package core

import (
	"os"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	once   sync.Once
	logger *zap.Logger
	sugar  *zap.SugaredLogger
)

// InitLogger 初始化全局 logger（幂等）
// mode: "debug" / "release"
func InitLogger(mode string) {
	once.Do(func() {
		encoder := consoleEncoder()
		level := zapcore.InfoLevel
		if strings.ToLower(mode) == "debug" {
			level = zapcore.DebugLevel
		}

		core := zapcore.NewCore(
			encoder,
			zapcore.AddSync(os.Stdout),
			level,
		)

		logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
		sugar = logger.Sugar()
	})
}

// Logger 返回标准 logger（结构化字段）
func Logger() *zap.Logger {
	if logger == nil {
		InitLogger("debug")
	}
	return logger
}

// Sugar 返回 sugared logger（便捷调用）
func Sugar() *zap.SugaredLogger {
	if sugar == nil {
		InitLogger("debug")
	}
	return sugar
}

// Sync 刷新日志缓冲
func Sync() {
	if logger != nil {
		_ = logger.Sync()
	}
}

// consoleEncoder 控制台友好的 encoder：彩色级别 + 时间 + 位置 + 消息
func consoleEncoder() zapcore.Encoder {
	cfg := zap.NewDevelopmentEncoderConfig()
	cfg.EncodeLevel = zapcore.CapitalColorLevelEncoder
	cfg.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		enc.AppendString(t.Format("2006-01-02 15:04:05.000"))
	}
	cfg.EncodeCaller = zapcore.ShortCallerEncoder
	cfg.EncodeDuration = zapcore.StringDurationEncoder
	return zapcore.NewConsoleEncoder(cfg)
}
