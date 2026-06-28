package deepseek

import (
	"bufio"
	"bytes"
	"cooling-chamber/internal/core"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	apiURL = "https://api.deepseek.com/chat/completions"
	model  = "deepseek-v4-pro"
)

// Client DeepSeek API 客户端
type Client struct {
	apiKey       string
	httpClient   *http.Client    // 普通请求（有总超时）
	streamClient *http.Client    // 流式请求（无总超时，仅连接超时）
}

// NewClient 创建 DeepSeek 客户端，从环境变量 DEEPSEEK_KEY 读取密钥
func NewClient() *Client {
	return newClientWithKey(os.Getenv("DEEPSEEK_KEY"))
}

// NewClientWithKey 使用指定密钥创建客户端
func NewClientWithKey(key string) *Client {
	return newClientWithKey(key)
}

func newClientWithKey(key string) *Client {
	return &Client{
		apiKey: key,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		streamClient: &http.Client{
			// 不设总超时，流式输出可能很长；仅控制连接阶段
			Transport: &http.Transport{
				ResponseHeaderTimeout: 30 * time.Second,
			},
		},
	}
}

// ChatMessage 单条对话消息
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// responseFormat 控制 AI 返回格式
type responseFormat struct {
	Type string `json:"type"`
}

// chatRequest DeepSeek 请求体
type chatRequest struct {
	Model          string          `json:"model"`
	Messages       []ChatMessage   `json:"messages"`
	Temperature    float64         `json:"temperature"`
	MaxTokens      int             `json:"max_tokens"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
	Stream         bool            `json:"stream"`
}

// chatResponse DeepSeek 响应体
type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// Chat 调用 DeepSeek 对话接口，返回 AI 文本内容
//   - useJSON=true  时强制返回 JSON（temperature=0.7, max_tokens=1000）
//   - useJSON=false 时返回纯文本（temperature=0.8, max_tokens=2000），用于 7 天报告
func (c *Client) Chat(systemPrompt, userMessage string, useJSON bool) (string, error) {
	if c.apiKey == "" {
		core.Sugar().Warnw("DeepSeek Key 未配置，Chat 调用被拒绝")
		return "", fmt.Errorf("DEEPSEEK_KEY 未配置")
	}
	start := time.Now()
	core.Sugar().Infow("DeepSeek Chat 请求开始",
		"use_json", useJSON,
		"system_prompt_len", len(systemPrompt),
		"user_prompt_len", len(userMessage))

	reqBody := chatRequest{
		Model: model,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userMessage},
		},
		Stream: false,
	}

	if useJSON {
		reqBody.Temperature = 0.7
		reqBody.MaxTokens = 1000
		reqBody.ResponseFormat = &responseFormat{Type: "json_object"}
	} else {
		reqBody.Temperature = 0.8
		reqBody.MaxTokens = 2000
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("序列化请求失败: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		core.Sugar().Errorw("DeepSeek 调用失败", "error", err, "latency", time.Since(start))
		return "", fmt.Errorf("调用 DeepSeek 失败: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		preview := string(respBytes)
		if len(preview) > 200 {
			preview = preview[:200] + "..."
		}
		core.Sugar().Errorw("DeepSeek 返回错误状态码",
			"status", resp.StatusCode,
			"response_preview", preview,
			"latency", time.Since(start))
		return "", fmt.Errorf("DeepSeek 返回错误状态码 %d: %s", resp.StatusCode, string(respBytes))
	}

	var chatResp chatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return "", fmt.Errorf("解析响应失败: %w", err)
	}
	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("DeepSeek 返回空结果")
	}
	content := chatResp.Choices[0].Message.Content
	core.Sugar().Infow("DeepSeek Chat 请求成功",
		"status", resp.StatusCode,
		"response_len", len(content),
		"latency", time.Since(start))
	return content, nil
}

// InterceptAnalysis 拦截分析结果（用于流式第一帧解析）
type InterceptAnalysis struct {
	EmotionScore int             `json:"emotion_score"`
	EmotionLabel string          `json:"emotion_label"`
	Questions    []AnalysisQ     `json:"questions,omitempty"`
	Suggestion   string          `json:"suggestion,omitempty"`
}

// AnalysisQ 单个分析问题（带选项）
type AnalysisQ struct {
	Q       string   `json:"q"`
	Hint    string   `json:"hint,omitempty"`
	Options []string `json:"options"`
}

// StreamingChat 发起流式对话，返回一个 channel 逐块推送内容
// 返回 (analysis *InterceptAnalysis, chunks <-chan string, err error)
// analysis 为第一帧解析出的情绪分析（如果 useJSON=true）
// chunks 为后续流式文本块
// useJSON=true 时，首帧是 JSON 情绪分析，后续是空/或直接返回文本
// useJSON=false 时，全部是流式文本
func (c *Client) StreamingChat(systemPrompt string, messages []ChatMessage, useJSON bool) (*InterceptAnalysis, <-chan string, error) {
	if c.apiKey == "" {
		core.Sugar().Warnw("DeepSeek Key 未配置，StreamingChat 调用被拒绝")
		return nil, nil, fmt.Errorf("DEEPSEEK_KEY 未配置")
	}
	start := time.Now()
	core.Sugar().Infow("DeepSeek 流式请求开始",
		"use_json", useJSON,
		"messages", len(messages),
		"system_prompt_len", len(systemPrompt))

	reqBody := chatRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   4096,
		Stream:      true,
	}

	if useJSON {
		reqBody.ResponseFormat = &responseFormat{Type: "json_object"}
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, nil, fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.streamClient.Do(req)
	if err != nil {
		core.Sugar().Errorw("DeepSeek 流式调用失败", "error", err, "latency", time.Since(start))
		return nil, nil, fmt.Errorf("调用 DeepSeek 失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		preview := string(respBytes)
		if len(preview) > 200 {
			preview = preview[:200] + "..."
		}
		core.Sugar().Errorw("DeepSeek 流式响应异常",
			"status", resp.StatusCode,
			"response_preview", preview,
			"latency", time.Since(start))
		return nil, nil, fmt.Errorf("DeepSeek 返回错误状态码 %d: %s", resp.StatusCode, string(respBytes))
	}

	core.Sugar().Infow("DeepSeek 流式响应已接受，开始推送内容",
		"status", resp.StatusCode,
		"ttfb", time.Since(start))

	ch := make(chan string, 100)
	var analysis *InterceptAnalysis

	go func() {
		defer resp.Body.Close()
		defer close(ch)

		scanner := bufio.NewScanner(resp.Body)
		buf := make([]byte, 100)
		scanner.Buffer(buf, 1024*1024*64) // 64MB buffer

		fullContent := &strings.Builder{}
		analysisParsed := false
		chunkCount := 0

		for scanner.Scan() {
			line := scanner.Text()
			if !strings.HasPrefix(line, "data: ") {
				continue
			}
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}

			// 解析 SSE chunk
			var chunk struct {
				Choices []struct {
					Delta struct {
						Content string `json:"content"`
					} `json:"delta"`
				} `json:"choices"`
			}
			if err := json.Unmarshal([]byte(data), &chunk); err != nil {
				continue
			}
			if len(chunk.Choices) == 0 {
				continue
			}

			content := chunk.Choices[0].Delta.Content
			if content == "" {
				continue
			}

			// 如果 useJSON=true 且是第一帧，尝试解析为 InterceptAnalysis
			if useJSON && !analysisParsed {
				fullContent.WriteString(content)
				// 尝试解析完整的 JSON
				var a InterceptAnalysis
				if err := json.Unmarshal([]byte(fullContent.String()), &a); err == nil {
					// 可能是部分 JSON，继续接收
					if a.EmotionScore > 0 || a.EmotionLabel != "" {
						analysisParsed = true
						analysis = &a
					}
				}
			} else {
				ch <- content
				chunkCount++
			}
		}

		if err := scanner.Err(); err != nil {
			core.Sugar().Errorw("流式解析错误", "error", err, "latency", time.Since(start))
		}

		core.Sugar().Infow("DeepSeek 流式请求完成",
			"analysis_score", func() int {
				if analysis != nil {
					return analysis.EmotionScore
				}
				return 0
			}(),
			"analysis_label", func() string {
				if analysis != nil {
					return analysis.EmotionLabel
				}
				return ""
			}(),
			"chunks", chunkCount,
			"total_len", fullContent.Len(),
			"latency", time.Since(start))
	}()

	return analysis, ch, nil
}
