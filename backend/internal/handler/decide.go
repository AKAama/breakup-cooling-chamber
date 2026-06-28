package handler

import (
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// DecideHandler 决策辅助 handler
type DecideHandler struct {
	svc *service.DecideService
}

// NewDecideHandler 创建决策辅助 handler
func NewDecideHandler(svc *service.DecideService) *DecideHandler {
	return &DecideHandler{svc: svc}
}

// Decide POST /api/decide
// 接收 {behaviors: string[], context?: string}，返回 DecideResult JSON
func (h *DecideHandler) Decide(c *gin.Context) {
	start := time.Now()
	var req struct {
		Behaviors []string `json:"behaviors" binding:"required"`
		Context   string   `json:"context"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		core.Sugar().Warnw("决策辅助 - 参数错误", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "behaviors 必填"})
		return
	}
	core.Sugar().Infow("决策辅助请求开始",
		"behaviors_count", len(req.Behaviors),
		"has_context", req.Context != "")

	result := h.svc.Decide(req.Behaviors, req.Context)
	core.Sugar().Infow("决策辅助请求完成",
		"questions", len(result.QuestionsToSelf),
		"latency", time.Since(start))
	c.JSON(http.StatusOK, result)
}
