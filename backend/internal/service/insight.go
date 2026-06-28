package service

import (
	"cooling-chamber/internal/model"
	"cooling-chamber/pkg/deepseek"
	"encoding/json"
	"fmt"
)

// InsightResult 盲区分析结果（返回给前端）
type InsightResult struct {
	Observations  []Observation `json:"observations"`
	PeakHours     string        `json:"peak_hours"`
	FrequentWords []string      `json:"frequent_words"`
}

// Observation 盲区观察
type Observation struct {
	Pattern  string `json:"pattern"`
	Evidence string `json:"evidence"`
	Insight  string `json:"insight"`
}

// insightSystemPrompt 盲区分析系统提示词（来自 DEV_DOC 12.2.3）
const insightSystemPrompt = `你是"分手冷静室"的关系观察者。基于用户过去7天的拦截记录,指出他看不到的行为模式。

每条记录字段:rawMessage(想发的话), emotionScore, createdAt, actuallySent

返回严格JSON:
{
  "observations": [
    {
      "pattern": "观察到的模式名称",
      "evidence": "从哪些记录看出来的",
      "insight": "这个模式意味着什么"
    }
  ],
  "peak_hours": "情绪峰值时段,如'23:00-01:00'",
  "frequent_words": ["高频绝对化用语1", "用语2"]
}

要求:
1. 最多3条观察,少而精
2. 语气是"观察"不是"诊断",用"我注意到"而非"你有问题"
3. 如果记录少于3条,返回 observations 空数组,并在 peak_hours 写"数据不足"
4. 只返回JSON`

// InsightService 盲区分析服务
type InsightService struct {
	ai *deepseek.Client
}

// NewInsightService 创建盲区分析服务
func NewInsightService(ai *deepseek.Client) *InsightService {
	return &InsightService{ai: ai}
}

// Analyze 基于近 7 天拦截记录进行盲区分析
func (s *InsightService) Analyze(records []model.InterceptRecord) InsightResult {
	// 记录少于 3 条，直接返回数据不足，不调用 AI
	if len(records) < 3 {
		return InsightResult{
			Observations:  []Observation{},
			PeakHours:     "数据不足",
			FrequentWords: []string{},
		}
	}

	userMsg := fmt.Sprintf("用户近7天记录(JSON数组):\n%s\n\n请返回严格JSON。", recordsJSON(records))

	content, err := s.ai.Chat(insightSystemPrompt, userMsg, true)
	if err != nil {
		return insightFallback("分析服务暂时不可用")
	}

	var result InsightResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return insightFallback("分析服务暂时不可用")
	}
	if result.Observations == nil {
		result.Observations = []Observation{}
	}
	if result.FrequentWords == nil {
		result.FrequentWords = []string{}
	}
	if result.PeakHours == "" {
		result.PeakHours = "数据不足"
	}
	return result
}

// insightFallback AI 失败时的降级结果
func insightFallback(reason string) InsightResult {
	return InsightResult{
		Observations:  []Observation{},
		PeakHours:     reason,
		FrequentWords: []string{},
	}
}
