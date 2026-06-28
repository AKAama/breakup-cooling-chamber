package main

import (
	"cooling-chamber/internal/config"
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/handler"
	"cooling-chamber/internal/repository"
	"cooling-chamber/internal/service"
	"cooling-chamber/pkg/deepseek"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 0. 初始化日志（最先启动）
	core.InitLogger("debug")
	defer core.Sync()

	// 1. 加载配置
	cfg, err := config.Load()
	if err != nil {
		core.Sugar().Fatalw("加载配置失败", "error", err)
	}
	gin.SetMode(cfg.GinMode)
	core.Sugar().Infow("配置加载完成", "mode", cfg.GinMode, "db_ssl", cfg.DBSSLMode)

	// 2. 连接数据库
	core.Sugar().Infow("开始连接数据库", "host", cfg.DBHost, "port", cfg.DBPort, "db", cfg.DBName)
	pool, err := repository.NewPool(cfg.DSN())
	if err != nil {
		core.Sugar().Fatalw("数据库连接失败", "error", err)
	}
	defer pool.Close()
	core.Sugar().Infow("数据库连接成功",
		"max_conns", pool.Config().MaxConns,
		"min_conns", pool.Config().MinConns)

	// 2.5 自动建表（IF NOT EXISTS，安全可重复执行）
	if err := repository.RunMigrations(pool); err != nil {
		core.Sugar().Fatalw("数据库建表失败", "error", err)
	}
	core.Sugar().Info("表结构检查/创建完成")

	// 3. 初始化 DeepSeek 客户端
	if cfg.DeepSeekKey == "" {
		core.Sugar().Warn("DeepSeek Key 未配置，所有 AI 接口将返回降级数据")
	}
	aiClient := deepseek.NewClientWithKey(cfg.DeepSeekKey)
	core.Sugar().Info("DeepSeek 客户端初始化完成")

	// 4. 初始化仓储
	recordRepo := repository.NewRecordRepository(pool)
	journalRepo := repository.NewJournalRepository(pool)
	core.Sugar().Info("仓储层初始化完成")

	// 5. 初始化服务
	interceptSvc := service.NewInterceptService(aiClient)
	insightSvc := service.NewInsightService(aiClient)
	reportSvc := service.NewReportService(aiClient, pool, recordRepo, journalRepo)
	decideSvc := service.NewDecideService(aiClient)
	core.Sugar().Info("业务服务初始化完成")

	// 6. 初始化 handler
	interceptH := handler.NewInterceptHandler(interceptSvc, recordRepo)
	recordH := handler.NewRecordHandler(recordRepo)
	journalH := handler.NewJournalHandler(journalRepo)
	insightH := handler.NewInsightHandler(insightSvc, recordRepo)
	reportH := handler.NewReportHandler(reportSvc)
	decideH := handler.NewDecideHandler(decideSvc)
	core.Sugar().Info("接口处理器初始化完成")

	// 7. 注册路由
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(corsMiddleware(cfg.AllowedOrigins))
	r.Use(requestLogger())

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
		api.POST("/intercept", interceptH.Intercept)       // v1 兼容接口
		api.POST("/intercept/chat", interceptH.Chat)        // 流式第一轮
		api.POST("/intercept/answer", interceptH.Answer)    // 流式回答后继续
		api.GET("/records", recordH.List)
		api.GET("/records/:id", recordH.Get)
		api.POST("/journal", journalH.Create)
		api.GET("/journals", journalH.List)
		api.GET("/insight", insightH.Get)
		api.GET("/report", reportH.Get)
		api.POST("/decide", decideH.Decide)
	}

	// 8. 启动服务
	addr := ":" + cfg.Port
	core.Sugar().Infow("分手冷静室后端启动", "listen", addr)
	if err := r.Run(addr); err != nil {
		core.Sugar().Fatalw("服务启动失败", "error", err)
	}
}

// requestLogger 请求日志中间件：方法/路径/状态码/耗时/客户端IP/字节数
func requestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery
		method := c.Request.Method
		clientIP := c.ClientIP()

		c.Next()

		latency := time.Since(start)
		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()

		if raw != "" {
			path = path + "?" + raw
		}

		fields := []any{
			"method", method,
			"path", path,
			"status", statusCode,
			"latency", latency,
			"ip", clientIP,
			"size", bodySize,
		}

		// 按状态码分级别输出
		switch {
		case statusCode >= 500:
			errs := c.Errors.ByType(gin.ErrorTypePrivate).String()
			core.Sugar().Errorw("请求出错", append(fields, "error", errs)...)
		case statusCode >= 400:
			core.Sugar().Warnw("请求警告", fields...)
		default:
			core.Sugar().Infow("请求完成", fields...)
		}
	}
}

// corsMiddleware CORS 中间件，允许配置的来源跨域访问
func corsMiddleware(allowedOrigins string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigins)
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// 确保 zap 包引用被使用（避免 lint 警告）
var _ = zap.NewNop
