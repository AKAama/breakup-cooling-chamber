package handler

import (
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/model"
	"cooling-chamber/internal/repository"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// JournalHandler 日记 handler
type JournalHandler struct {
	repo *repository.JournalRepository
}

// NewJournalHandler 创建日记 handler
func NewJournalHandler(repo *repository.JournalRepository) *JournalHandler {
	return &JournalHandler{repo: repo}
}

// Create POST /api/journal
// 接收 {content: string, mood: number}，返回 JournalEntry
func (h *JournalHandler) Create(c *gin.Context) {
	start := time.Now()
	var req struct {
		Content string `json:"content" binding:"required"`
		Mood    int    `json:"mood" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		core.Sugar().Warnw("日记创建参数错误", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "content 和 mood 必填"})
		return
	}
	core.Sugar().Infow("创建日记开始", "mood", req.Mood, "content_len", len(req.Content))

	j := &model.JournalEntry{Content: req.Content, Mood: req.Mood}
	if err := h.repo.Create(c.Request.Context(), j); err != nil {
		core.Sugar().Errorw("日记创建失败", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	core.Sugar().Infow("日记创建成功", "id", j.ID, "latency", time.Since(start))
	c.JSON(http.StatusOK, j)
}

// List GET /api/journals，返回最近 7 天的日记
func (h *JournalHandler) List(c *gin.Context) {
	start := time.Now()
	core.Sugar().Info("查询日记列表")
	entries, err := h.repo.ListRecent(c.Request.Context(), 7)
	if err != nil {
		core.Sugar().Errorw("查询日记失败", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	core.Sugar().Infow("查询日记成功", "count", len(entries), "latency", time.Since(start))
	c.JSON(http.StatusOK, entries)
}
