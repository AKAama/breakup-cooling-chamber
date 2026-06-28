package service

import (
	"cooling-chamber/pkg/deepseek"
	"encoding/json"
	"fmt"
	"strings"
)

// DecideResult 决策辅助结果（返回给前端）
type DecideResult struct {
	SunkCost          SunkCost          `json:"sunk_cost"`
	FutureExpectation FutureExpectation `json:"future_expectation"`
	QuestionsToSelf   []string          `json:"questions_to_self"`
	Reminder          string            `json:"reminder"`
}

// SunkCost 沉没成本
type SunkCost struct {
	Time    string `json:"time"`
	Emotion string `json:"emotion"`
	Summary string `json:"summary"`
}

// FutureExpectation 未来预期
type FutureExpectation struct {
	Positives []string `json:"positives"`
	Risks     []string `json:"risks"`
	Summary   string   `json:"summary"`
}

// decideSystemPrompt 决策辅助系统提示词（来自 DEV_DOC 12.2.5）
const decideSystemPrompt = `你是"分手冷静室"的决策辅助者。用户在纠结该挽回还是该放手。
你的任务:不替用户决定,帮他想清楚"沉没成本 vs 未来预期"。

返回严格JSON:
{
  "sunk_cost": {
    "time": "时间投入观察",
    "emotion": "情感投入观察",
    "summary": "沉没成本一句话总结"
  },
  "future_expectation": {
    "positives": ["未来可能的积极面1", "积极面2"],
    "risks": ["未来可能的风险1", "风险2"],
    "summary": "未来预期一句话总结"
  },
  "questions_to_self": [
    "让用户自己思考的问题1",
    "问题2",
    "问题3"
  ],
  "reminder": "不替用户决定的免责声明,一句话"
}

要求:
1. 基于用户输入的5个行为模式分析,不编造
2. 沉没成本和未来预期都要客观,不偏向挽回或放手
3. questions_to_self 要尖锐但建设性
4. 只返回JSON`

// DecideService 决策辅助服务
type DecideService struct {
	ai *deepseek.Client
}

// NewDecideService 创建决策辅助服务
func NewDecideService(ai *deepseek.Client) *DecideService {
	return &DecideService{ai: ai}
}

// Decide 执行决策辅助分析，AI 失败时返回降级数据
func (s *DecideService) Decide(behaviors []string, context string) DecideResult {
	userMsg := fmt.Sprintf("用户输入的对方5个核心行为模式:\n%s", strings.Join(behaviors, "\n"))
	if context != "" {
		userMsg += fmt.Sprintf("\n\n用户输入的关系背景(可选):\n%s", context)
	}
	userMsg += "\n\n请返回严格JSON。"

	content, err := s.ai.Chat(decideSystemPrompt, userMsg, true)
	if err != nil {
		return fallbackDecide()
	}

	var result DecideResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return fallbackDecide()
	}
	if result.QuestionsToSelf == nil {
		result.QuestionsToSelf = []string{}
	}
	if result.FutureExpectation.Positives == nil {
		result.FutureExpectation.Positives = []string{}
	}
	if result.FutureExpectation.Risks == nil {
		result.FutureExpectation.Risks = []string{}
	}
	if result.Reminder == "" {
		result.Reminder = "最终决定权在你手里,以上仅为参考。"
	}
	return result
}

// fallbackDecide AI 失败时的降级结果
func fallbackDecide() DecideResult {
	return DecideResult{
		SunkCost: SunkCost{
			Time:    "无法评估",
			Emotion: "无法评估",
			Summary: "分析服务暂时不可用",
		},
		FutureExpectation: FutureExpectation{
			Positives: []string{},
			Risks:     []string{},
			Summary:   "分析服务暂时不可用",
		},
		QuestionsToSelf: []string{
			"这段关系让你成为更好的人了吗?",
			"如果未来5年都是现在的状态,你愿意吗?",
			"你留下来是因为爱,还是因为不甘心?",
		},
		Reminder: "最终决定权在你手里,以上仅为参考。",
	}
}
