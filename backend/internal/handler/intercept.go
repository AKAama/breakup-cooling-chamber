package handler

import (
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/model"
	"cooling-chamber/internal/repository"
	"cooling-chamber/internal/service"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// InterceptHandler 冲突拦截 handler
type InterceptHandler struct {
	svc  *service.InterceptService
	repo *repository.RecordRepository
}

// NewInterceptHandler 创建拦截 handler
func NewInterceptHandler(svc *service.InterceptService, repo *repository.RecordRepository) *InterceptHandler {
	return &InterceptHandler{svc: svc, repo: repo}
}

// Intercept POST /api/intercept
// 接收 {message: string}，返回 InterceptResult JSON（v1 兼容接口）
func (h *InterceptHandler) Intercept(c *gin.Context) {
	start := time.Now()
	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		core.Sugar().Warnw("Intercept 请求参数错误", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "message 字段必填"})
		return
	}
	core.Sugar().Infow("Intercept 请求开始",
		"message_preview", truncateText(req.Message, 80),
		"message_len", len(req.Message))

	result := h.svc.Intercept(req.Message)
	core.Sugar().Infow("Intercept 分析完成",
		"emotion_score", result.EmotionScore,
		"emotion_label", result.EmotionLabel,
		"questions", len(result.Questions),
		"latency", time.Since(start))

	// 持久化拦截记录（存储失败不阻断响应）
	questions := make([]string, 0, len(result.Questions))
	for _, q := range result.Questions {
		questions = append(questions, q.Q)
	}
	suggestion := result.SuggestionPreview
	rec := &model.InterceptRecord{
		RawMessage:   req.Message,
		EmotionScore: result.EmotionScore,
		EmotionLabel: result.EmotionLabel,
		Questions:    questions,
		Suggestion:   &suggestion,
		ActuallySent: false,
	}
	if err := h.repo.Create(c.Request.Context(), rec); err == nil {
		result.ID = rec.ID
		result.CreatedAt = rec.CreatedAt
	}

	c.JSON(http.StatusOK, result)
}

// Chat POST /api/intercept/chat
// 第一次对话：用户输入消息 → 流式军师分析 + 3个问题
// SSE 事件流格式：
// event: analysis\ndata: {"emotion_score":8,"emotion_label":"冲动","questions":["Q1","Q2","Q3"]}\n\n
// event: text\ndata: {"content":"这条消息情绪分8分...\n\n"}\n\n[分多次发送]
// event: done\ndata: {}\n\n
func (h *InterceptHandler) Chat(c *gin.Context) {
	start := time.Now()
	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		core.Sugar().Warnw("Chat 请求参数错误", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "message 字段必填"})
		return
	}
	core.Sugar().Infow("Chat 流式对话开始",
		"message_preview", truncateText(req.Message, 80),
		"message_len", len(req.Message))

	// 设置 SSE 响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// 先持久化一条记录
	rec := &model.InterceptRecord{
		RawMessage:   req.Message,
		EmotionScore: 0,
		EmotionLabel: "",
		Questions:    []string{},
		History:      []model.Message{{Role: "user", Content: req.Message}},
		ActuallySent: false,
	}
	if err := h.repo.Create(c.Request.Context(), rec); err != nil {
		core.Sugar().Warnw("Chat 持久化初始记录失败", "error", err)
	}

	// 执行流式分析
	analysis, chunks, err := h.svc.InterceptStream(req.Message)
	if err != nil {
		core.Sugar().Errorw("Chat 流式分析失败", "error", err)
		sendSSE(c, "error", fmt.Sprintf(`{"error":"%s"}`, err.Error()))
		return
	}
	core.Sugar().Infow("Chat 流式分析启动",
		"emotion_score", analysis.EmotionScore,
		"emotion_label", analysis.EmotionLabel,
		"questions_count", len(analysis.Questions))

	// 发送分析结果事件（包含问题和选项）
	if rec.ID == "" {
		core.Sugar().Warnw("Chat 记录 ID 为空，前端将无法提交答案")
	}
	analysisData, _ := json.Marshal(map[string]interface{}{
		"emotion_score": analysis.EmotionScore,
		"emotion_label": analysis.EmotionLabel,
		"questions":     analysis.Questions,
		"id":            rec.ID,
	})
	sendSSE(c, "analysis", string(analysisData))

	// 更新记录的初始分析结果（只存问题文本）
	if analysis != nil && rec.ID != "" {
		rec.EmotionScore = analysis.EmotionScore
		rec.EmotionLabel = analysis.EmotionLabel
		qTexts := make([]string, 0, len(analysis.Questions))
		for _, q := range analysis.Questions {
			qTexts = append(qTexts, q.Q)
		}
		rec.Questions = qTexts
		if err := h.repo.UpdateHistory(c.Request.Context(), rec.ID, rec.History, nil); err != nil {
			core.Sugar().Warnw("Chat 更新初始记录失败", "error", err)
		}
	}

	// 发送文本流
	chunkCount := 0
	for chunk := range chunks {
		textData, _ := json.Marshal(map[string]string{"content": chunk})
		sendSSE(c, "text", string(textData))
		chunkCount++
	}

	core.Sugar().Infow("Chat 流式对话完成",
		"id", rec.ID,
		"chunks", chunkCount,
		"latency", time.Since(start))

	// 发送完成事件
	sendSSE(c, "done", `{"type":"done"}`)
}

// Answer POST /api/intercept/answer
// 用户回答了3个问题 → 流式军师继续对话
// 请求：{"answers":["答案1","答案2","答案3"],"history":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
// SSE 事件流：
// event: text\ndata: {"content":"好，你已经看到了...\n\n"}\n\n[分多次发送]
// event: done\ndata: {"suggestion":"不发这条..."}
func (h *InterceptHandler) Answer(c *gin.Context) {
	start := time.Now()
	var req struct {
		ID      string          `json:"id" binding:"required"`
		Answers []string        `json:"answers" binding:"required"`
		History []model.Message `json:"history" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		core.Sugar().Warnw("Answer 请求参数错误", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "id、answers、history 字段必填"})
		return
	}
	core.Sugar().Infow("Answer 流式继续对话",
		"id", req.ID,
		"answers_count", len(req.Answers),
		"history_count", len(req.History))

	// 设置 SSE 响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// 构建用户答案消息
	answersText := "我回答了以下问题：\n"
	for i, ans := range req.Answers {
		answersText += fmt.Sprintf("%d. %s\n", i+1, ans)
	}
	newHistory := make([]model.Message, len(req.History)+1)
	copy(newHistory, req.History)
	newHistory[len(req.History)] = model.Message{Role: "user", Content: answersText}

	// 执行流式对话
	chunks, err := h.svc.InterceptAnswerStream(newHistory)
	if err != nil {
		core.Sugar().Errorw("Answer 流式对话失败", "error", err)
		sendSSE(c, "error", fmt.Sprintf(`{"error":"%s"}`, err.Error()))
		return
	}

	var fullResponse strings.Builder
	chunkCount := 0
	for chunk := range chunks {
		fullResponse.WriteString(chunk)
		textData, _ := json.Marshal(map[string]string{"content": chunk})
		sendSSE(c, "text", string(textData))
		chunkCount++
	}

	// 更新记录
	var suggestion *string
	if fullResponse.Len() > 0 {
		s := fullResponse.String()
		suggestion = &s
	}
	if err := h.repo.UpdateHistory(c.Request.Context(), req.ID, newHistory, suggestion); err != nil {
		core.Sugar().Warnw("Answer 更新记录失败", "error", err)
	}

	core.Sugar().Infow("Answer 流式继续对话完成",
		"id", req.ID,
		"chunks", chunkCount,
		"has_suggestion", suggestion != nil,
		"latency", time.Since(start))

	// 发送完成事件
	doneData, _ := json.Marshal(map[string]interface{}{
		"type":       "done",
		"suggestion": suggestion,
	})
	sendSSE(c, "done", string(doneData))
}

// sendSSE 发送 SSE 事件
func sendSSE(c *gin.Context, event, data string) {
	c.Writer.Write([]byte(fmt.Sprintf("event: %s\ndata: %s\n\n", event, data)))
	c.Writer.(http.Flusher).Flush()
}

// truncateText 截断字符串用于日志
func truncateText(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
