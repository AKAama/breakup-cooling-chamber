package handler

import (
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/repository"
	"cooling-chamber/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// InsightHandler 盲区分析 handler
type InsightHandler struct {
	svc  *service.InsightService
	repo *repository.RecordRepository
}

// NewInsightHandler 创建盲区分析 handler
func NewInsightHandler(svc *service.InsightService, repo *repository.RecordRepository) *InsightHandler {
	return &InsightHandler{svc: svc, repo: repo}
}

// Get GET /api/insight，基于近 7 天记录分析盲区
func (h *InsightHandler) Get(c *gin.Context) {
	start := time.Now()
	core.Sugar().Info("开始盲区分析")
	records, err := h.repo.ListRecent(c.Request.Context(), 7)
	if err != nil {
		core.Sugar().Errorw("盲区分析 - 查询记录失败", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	core.Sugar().Infow("盲区分析 - 收到记录", "count", len(records))
	result := h.svc.Analyze(records)
	core.Sugar().Infow("盲区分析完成", "observations", len(result.Observations), "latency", time.Since(start))
	c.JSON(http.StatusOK, result)
}
