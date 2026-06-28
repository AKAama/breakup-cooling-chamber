package service

import (
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/model"
	"cooling-chamber/pkg/deepseek"
	"encoding/json"
	"fmt"
	"time"
)

// InterceptResult 拦截分析结果（返回给前端）
type InterceptResult struct {
	ID                string     `json:"id,omitempty"`
	EmotionScore      int        `json:"emotion_score"`
	EmotionLabel      string     `json:"emotion_label"`
	Questions         []Question `json:"questions"`
	SuggestionPreview string     `json:"suggestion_preview"`
	CreatedAt         string     `json:"created_at,omitempty"`
}

// Question 拦截问题
type Question struct {
	Q    string `json:"q"`
	Hint string `json:"hint"`
}

// interceptSystemPrompt 冲突拦截系统提示词（来自 DEV_DOC 12.2.1）
const interceptSystemPrompt = `你是"分手冷静室"的冷静教练。用户深夜想给伴侣/前任发一条消息。
你的任务:不替用户做决定,问3个让他自己想清楚的问题。

返回严格JSON,不要输出JSON以外的任何内容:
{
  "emotion_score": 1到10的整数,
  "emotion_label": "冷静" | "焦虑" | "冲动" | "暴怒" 之一,
  "questions": [
    {"q": "针对这条消息的具体问题1", "hint": "引导用户看到什么"},
    {"q": "针对这条消息的具体问题2", "hint": "..."},
    {"q": "针对这条消息的具体问题3", "hint": "..."}
  ],
  "suggestion_preview": "若用户答完,倾向发/不发/改写的一句话理由"
}

要求:
1. 三个问题层层递进:意图 → 后果 → 替代方案
2. 问题必须针对用户输入的具体内容,不要泛泛而谈
3. emotion_score 分级:1-3冷静, 4-6焦虑, 7-10冲动
4. 只返回JSON`

// InterceptService 拦截服务
type InterceptService struct {
	ai *deepseek.Client
}

// NewInterceptService 创建拦截服务
func NewInterceptService(ai *deepseek.Client) *InterceptService {
	return &InterceptService{ai: ai}
}

// Intercept 执行拦截分析，AI 失败时返回降级数据
func (s *InterceptService) Intercept(message string) InterceptResult {
	userMsg := fmt.Sprintf("用户想发的消息:\"%s\"\n\n请返回严格JSON。", message)

	content, err := s.ai.Chat(interceptSystemPrompt, userMsg, true)
	if err != nil {
		return fallbackIntercept()
	}

	result, ok := parseIntercept(content)
	if !ok {
		// JSON 解析失败，重试 1 次
		content2, err2 := s.ai.Chat(interceptSystemPrompt, userMsg, true)
		if err2 != nil {
			return fallbackIntercept()
		}
		result, ok = parseIntercept(content2)
		if !ok {
			return fallbackIntercept()
		}
	}

	// 字段校验与补默认值
	if result.EmotionScore < 1 || result.EmotionScore > 10 {
		result.EmotionScore = 5
	}
	if result.EmotionLabel == "" {
		result.EmotionLabel = "焦虑"
	}
	if len(result.Questions) == 0 {
		return fallbackIntercept()
	}
	return result
}

// parseIntercept 解析 AI 返回的 JSON
func parseIntercept(content string) (InterceptResult, bool) {
	var result InterceptResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return InterceptResult{}, false
	}
	return result, true
}

// fallbackIntercept 降级：通用 3 问 + score=5（来自 DEV_DOC 12.2.1）
func fallbackIntercept() InterceptResult {
	return InterceptResult{
		EmotionScore: 5,
		EmotionLabel: "焦虑",
		Questions: []Question{
			{Q: "你发这条消息,希望对方看到后做什么?", Hint: "看清自己的真实意图"},
			{Q: "如果对方反应不如预期,你会怎样?", Hint: "预判后果"},
			{Q: "这条消息是沟通还是情绪宣泄?", Hint: "区分目的"},
		},
		SuggestionPreview: "先想清楚再发",
	}
}

// advisorSystemPrompt 军师顾问系统提示词（基于 DEV_DOC 4.1 v2 设计）
const advisorSystemPrompt = `你是"分手冷静室"的军师顾问——一个有温度、有洞察、不会替你做决定的朋友。
不是冷冰冰的AI，是会在深夜陪你想清楚的那个人。

你的风格：
1. 先共情，再说问题。不评判，不灌鸡汤。
2. 会指出用户看不到的模式（行为模式、情绪模式）
3. 会站在对方视角看问题
4. 问尖锐但建设性的问题
5. 给建议时，不说"你应该怎样"，而是"我注意到…你想想看…"
6. 最终决定权永远在用户手里

当用户发来一条想发的消息，你的回复格式：
- 先给情绪评分（用括号标注：🔥8分/⚠️5分/💙2分）
- 分析这条消息里的1-2个值得注意的点
- 提出3个让用户自己想清楚的问题（这3个问题作为表单呈现）
- 不要直接说"发"或"不发"

当用户回答了问题，你的回复：
- 针对用户的具体回答给出回应
- 可以追问1个最关键的问题
- 或者直接给出你的观察和建议
- 建议用"我有个想法…"开头，给用户留空间
`

// InterceptStream 执行流式拦截分析（军师模式第一轮）
// 策略：先 Chat(useJSON=true) 拿到情绪分析和3个问题，再 StreamingChat(useJSON=false) 输出军师风格分析
func (s *InterceptService) InterceptStream(message string) (*deepseek.InterceptAnalysis, <-chan string, error) {
	start := time.Now()

	// 步骤 1：先拿结构化分析（useJSON=true，prompt 含 "json" 满足 DeepSeek 要求）
	structurePrompt := `你是"分手冷静室"的情感分析助手。
只分析用户想发的消息，输出严格 JSON。
不要输出 JSON 以外的任何内容。

请以 json 格式输出:
{
  "emotion_score": 1到10的整数,
  "emotion_label": "冷静"|"焦虑"|"冲动"|"暴怒" 之一,
  "questions": [
    {
      "q": "针对这条消息的具体问题1",
      "hint": "引导用户看到什么",
      "options": ["选项A","选项B","选项C","选项D"]
    },
    {
      "q": "针对这条消息的具体问题2",
      "hint": "...",
      "options": ["选项A","选项B","选项C","选项D"]
    },
    {
      "q": "针对这条消息的具体问题3",
      "hint": "...",
      "options": ["选项A","选项B","选项C","选项D"]
    }
  ]
}

规则:
1. emotion_score: 1-3冷静, 4-6焦虑, 7-10冲动
2. 三个问题层层递进：看清意图→看清后果→看清替代方案
3. 每个问题提供 4 个选项，选项要针对消息的具体情境，不要泛泛而谈
4. 选项要覆盖不同的心理状态，让用户能找到接近自己的
5. 问题和选项必须用中文，简洁有力
6. 只返回 json，不要其他内容`

	userMsg := fmt.Sprintf("用户想发的消息:\"%s\"\n\n请返回严格 JSON。", message)
	structureText, err := s.ai.Chat(structurePrompt, userMsg, true)
	if err != nil {
		core.Sugar().Warnw("Chat 结构化分析失败，使用降级数据", "error", err)
		// 降级：从本地计算
		analysis := &deepseek.InterceptAnalysis{
			EmotionScore: 5,
			EmotionLabel: "焦虑",
			Questions: []deepseek.AnalysisQ{
				{Q: "你发这条消息，最想达到什么目的？", Hint: "看清自己的真实意图", Options: []string{"想让对方理解我的感受", "想确认对方在不在乎我", "想和对方说清楚/争吵", "想结束这段关系"}},
				{Q: "你觉得对方看到后，最可能的反应是？", Hint: "预判后果", Options: []string{"马上回复解释", "已读不回", "也生气回怼", "冷战几天"}},
				{Q: "如果对方没按你想的回应，你能接受吗？", Hint: "评估承受力", Options: []string{"完全能接受", "有点不舒服但还行", "会更生气", "会后悔发了"}},
			},
		}
		ch := make(chan string, 1)
		ch <- "我暂时无法连接到AI。先深呼吸3次。你不妨先回答你自己：你真正想得到的是什么？"
		close(ch)
		return analysis, ch, nil
	}

	// 解析 JSON
	var analysis deepseek.InterceptAnalysis
	if err := json.Unmarshal([]byte(structureText), &analysis); err != nil {
		// JSON 解析失败，降级
		analysis = deepseek.InterceptAnalysis{
			EmotionScore: 5,
			EmotionLabel: "焦虑",
			Questions: []deepseek.AnalysisQ{
				{Q: "你发这条消息，最想达到什么目的？", Hint: "看清自己的真实意图", Options: []string{"想让对方理解我的感受", "想确认对方在不在乎我", "想和对方说清楚/争吵", "想结束这段关系"}},
				{Q: "你觉得对方看到后，最可能的反应是？", Hint: "预判后果", Options: []string{"马上回复解释", "已读不回", "也生气回怼", "冷战几天"}},
				{Q: "如果对方没按你想的回应，你能接受吗？", Hint: "评估承受力", Options: []string{"完全能接受", "有点不舒服但还行", "会更生气", "会后悔发了"}},
			},
		}
	}
	if analysis.EmotionScore < 1 || analysis.EmotionScore > 10 {
		analysis.EmotionScore = 5
	}
	if analysis.EmotionLabel == "" {
		analysis.EmotionLabel = "焦虑"
	}
	if len(analysis.Questions) < 3 {
		analysis.Questions = []deepseek.AnalysisQ{
			{Q: "你发这条消息，最想达到什么目的？", Hint: "看清自己的真实意图", Options: []string{"想让对方理解我的感受", "想确认对方在不在乎我", "想和对方说清楚/争吵", "想结束这段关系"}},
			{Q: "你觉得对方看到后，最可能的反应是？", Hint: "预判后果", Options: []string{"马上回复解释", "已读不回", "也生气回怼", "冷战几天"}},
			{Q: "如果对方没按你想的回应，你能接受吗？", Hint: "评估承受力", Options: []string{"完全能接受", "有点不舒服但还行", "会更生气", "会后悔发了"}},
		}
	}
	// 确保每个问题至少有 3 个选项
	for i := range analysis.Questions {
		if len(analysis.Questions[i].Options) < 3 {
			analysis.Questions[i].Options = []string{"是的", "不是", "不确定"}
		}
	}

	core.Sugar().Infow("第一步：结构化分析完成",
		"score", analysis.EmotionScore,
		"label", analysis.EmotionLabel,
		"questions", len(analysis.Questions),
		"latency", time.Since(start))

	// 步骤 2：流式输出军师风格分析（纯文本，useJSON=false）
	advisorMsg := []deepseek.ChatMessage{
		{Role: "system", Content: advisorSystemPrompt},
		{Role: "user", Content: message},
	}
	_, chunks, err := s.ai.StreamingChat("", advisorMsg, false)
	if err != nil {
		core.Sugar().Errorw("第二步：流式对话失败", "error", err, "latency", time.Since(start))
		// 返回降级文本（非阻塞 channel）
		fallbackCh := make(chan string, 2)
		fallbackCh <- fmt.Sprintf("情绪分：%d（%s）。\n", analysis.EmotionScore, analysis.EmotionLabel)
		fallbackCh <- "别急着发。先想想：你希望对方看到这条消息后做什么？"
		close(fallbackCh)
		return &analysis, fallbackCh, nil
	}

	core.Sugar().Infow("InterceptStream 两步分析完成", "latency", time.Since(start))
	return &analysis, chunks, nil
}

// InterceptAnswerStream 执行流式回答后继续对话
func (s *InterceptService) InterceptAnswerStream(history []model.Message) (<-chan string, error) {
	messages := make([]deepseek.ChatMessage, 0, len(history)+1)
	messages = append(messages, deepseek.ChatMessage{Role: "system", Content: advisorSystemPrompt})
	for _, msg := range history {
		messages = append(messages, deepseek.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	_, chunks, err := s.ai.StreamingChat("", messages, false)
	if err != nil {
		return nil, err
	}
	return chunks, nil
}