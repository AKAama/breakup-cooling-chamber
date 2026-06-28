package model

// Message 对话消息
type Message struct {
	Role    string `json:"role"`    // "user" | "assistant"
	Content string `json:"content"`
}

// InterceptRecord v2 拦截记录，对应 intercept_records 表
type InterceptRecord struct {
	ID           string    `json:"id"`
	RawMessage   string    `json:"raw_message"`
	EmotionScore int       `json:"emotion_score"`
	EmotionLabel string    `json:"emotion_label"`
	AIAnalysis   string    `json:"ai_analysis"`    // AI第一轮分析文本
	Questions    []string  `json:"questions"`     // 3个问题文本
	History      []Message `json:"history"`       // 对话历史（JSONB）
	Suggestion   *string   `json:"suggestion"`
	ActuallySent bool      `json:"actually_sent"`
	CreatedAt    string    `json:"created_at"`     // ISO 时间
}

// JournalEntry 日记，对应 journal_entries 表
type JournalEntry struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	Mood      int    `json:"mood"`
	CreatedAt string `json:"created_at"`
}

// Report 7 天关系体检报告，对应 reports 表
type Report struct {
	ID          string `json:"id"`
	Markdown    string `json:"markdown"`
	PeriodStart string `json:"period_start"`
	CreatedAt   string `json:"created_at"`
}
