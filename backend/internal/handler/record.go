package handler

import (
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/repository"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// RecordHandler 历史记录 handler
type RecordHandler struct {
	repo *repository.RecordRepository
}

// NewRecordHandler 创建历史记录 handler
func NewRecordHandler(repo *repository.RecordRepository) *RecordHandler {
	return &RecordHandler{repo: repo}
}

// List GET /api/records，返回最近 7 天的拦截记录
func (h *RecordHandler) List(c *gin.Context) {
	start := time.Now()
	core.Sugar().Info("查询拦截记录列表")
	records, err := h.repo.ListRecent(c.Request.Context(), 7)
	if err != nil {
		core.Sugar().Errorw("查询拦截记录失败", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	core.Sugar().Infow("查询拦截记录成功",
		"count", len(records),
		"latency", time.Since(start))
	c.JSON(http.StatusOK, records)
}

// Get GET /api/records/:id，返回单条拦截记录
func (h *RecordHandler) Get(c *gin.Context) {
	start := time.Now()
	id := c.Param("id")
	core.Sugar().Infow("查询单条拦截记录", "id", id)
	rec, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		core.Sugar().Errorw("查询单条拦截记录失败", "error", err, "id", id)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if rec == nil {
		core.Sugar().Warnw("拦截记录不存在", "id", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "记录不存在"})
		return
	}
	core.Sugar().Infow("查询单条拦截记录成功", "id", id, "latency", time.Since(start))
	c.JSON(http.StatusOK, rec)
}
