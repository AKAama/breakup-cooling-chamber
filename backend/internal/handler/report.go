package handler

import (
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ReportHandler 7 天报告 handler
type ReportHandler struct {
	svc *service.ReportService
}

// NewReportHandler 创建报告 handler
func NewReportHandler(svc *service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

// Get GET /api/report，生成或返回缓存的 7 天报告
func (h *ReportHandler) Get(c *gin.Context) {
	start := time.Now()
	core.Sugar().Info("开始生成/查询 7 天报告")
	report, err := h.svc.GetOrGenerate(c.Request.Context())
	if err != nil {
		core.Sugar().Errorw("生成/查询 7 天报告失败", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	core.Sugar().Infow("生成/查询 7 天报告成功",
		"id", report.ID,
		"period_start", report.PeriodStart,
		"latency", time.Since(start))
	c.JSON(http.StatusOK, report)
}
