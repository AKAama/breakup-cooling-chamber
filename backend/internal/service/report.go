package service

import (
	"context"
	"cooling-chamber/internal/model"
	"cooling-chamber/internal/repository"
	"cooling-chamber/pkg/deepseek"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// reportSystemPrompt 7 天报告系统提示词（来自 DEV_DOC 12.2.4）
const reportSystemPrompt = `你是"分手冷静室"的报告撰写者。基于用户过去7天的数据,生成一份《关系体检报告》。

直接返回 Markdown 格式报告(不要包裹在代码块里),包含以下章节:

## 📊 这7天,你经历了什么
(数据概览:触发拦截X次,实际发送Y次,情绪平均分Z)

## 🔥 你的争吵触发点
(Top3 触发词或场景)

## ⏰ 你的情绪峰值时段
(哪个时段最容易冲动)

## ⚠️ 你最容易犯的3个错
(具体、可改进)

## 💡 下周建议
(1-2条可执行建议,不替用户做决定)

要求:
1. 语气诚恳,像朋友复盘,不像医生下诊断
2. 用数据说话,引用具体记录
3. 如果数据不足7天,如实说明"目前记录X天,以下是基于现有数据的观察"
4. 直接返回 Markdown 正文`

// ReportService 报告生成服务
type ReportService struct {
	ai          *deepseek.Client
	pool        *pgxpool.Pool
	recordRepo  *repository.RecordRepository
	journalRepo *repository.JournalRepository
}

// NewReportService 创建报告服务
func NewReportService(ai *deepseek.Client, pool *pgxpool.Pool, rr *repository.RecordRepository, jr *repository.JournalRepository) *ReportService {
	return &ReportService{ai: ai, pool: pool, recordRepo: rr, journalRepo: jr}
}

// GetOrGenerate 获取缓存的 7 天报告，没有则生成并缓存
func (s *ReportService) GetOrGenerate(ctx context.Context) (*model.Report, error) {
	periodStart := time.Now().AddDate(0, 0, -7)

	// 1. 查缓存：当前 7 天周期是否已生成过报告
	if rep, ok := s.getCachedReport(ctx, periodStart); ok {
		return rep, nil
	}

	// 2. 聚合数据
	records, err := s.recordRepo.ListRecent(ctx, 7)
	if err != nil {
		return nil, fmt.Errorf("查询拦截记录失败: %w", err)
	}
	journals, err := s.journalRepo.ListRecent(ctx, 7)
	if err != nil {
		return nil, fmt.Errorf("查询日记失败: %w", err)
	}

	// 3. 构建用户消息并调用 AI 生成 Markdown
	userMsg := fmt.Sprintf("拦截记录:\n%s\n\n日记条目:\n%s\n\n情绪分数分布:\n%s",
		recordsJSON(records), journalsJSON(journals), buildScoreDistribution(records))

	markdown, err := s.ai.Chat(reportSystemPrompt, userMsg, false)
	if err != nil {
		return nil, fmt.Errorf("生成报告失败: %w", err)
	}

	// 4. 写入数据库缓存
	var id string
	var createdAt time.Time
	err = s.pool.QueryRow(ctx, `
		INSERT INTO reports (markdown, period_start)
		VALUES ($1, $2)
		RETURNING id, created_at
	`, markdown, periodStart).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("保存报告失败: %w", err)
	}

	return &model.Report{
		ID:          id,
		Markdown:    markdown,
		PeriodStart: periodStart.Format("2006-01-02"),
		CreatedAt:   createdAt.Format(time.RFC3339),
	}, nil
}

// getCachedReport 查询当前周期已缓存的报告
func (s *ReportService) getCachedReport(ctx context.Context, periodStart time.Time) (*model.Report, bool) {
	var rep model.Report
	var ps time.Time
	var createdAt time.Time
	err := s.pool.QueryRow(ctx, `
		SELECT id, markdown, period_start, created_at
		FROM reports
		WHERE period_start = $1
	`, periodStart).Scan(&rep.ID, &rep.Markdown, &ps, &createdAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, false
		}
		return nil, false
	}
	rep.PeriodStart = ps.Format("2006-01-02")
	rep.CreatedAt = createdAt.Format(time.RFC3339)
	return &rep, true
}

// recordsJSON 将拦截记录序列化为供 AI 分析的精简 JSON
func recordsJSON(records []model.InterceptRecord) string {
	type rec struct {
		RawMessage   string `json:"rawMessage"`
		EmotionScore int    `json:"emotionScore"`
		CreatedAt    string `json:"createdAt"`
		ActuallySent bool   `json:"actuallySent"`
	}
	out := make([]rec, 0, len(records))
	for _, r := range records {
		out = append(out, rec{
			RawMessage:   r.RawMessage,
			EmotionScore: r.EmotionScore,
			CreatedAt:    r.CreatedAt,
			ActuallySent: r.ActuallySent,
		})
	}
	b, _ := json.Marshal(out)
	return string(b)
}

// journalsJSON 将日记序列化为供 AI 分析的精简 JSON
func journalsJSON(journals []model.JournalEntry) string {
	type j struct {
		Content   string `json:"content"`
		Mood      int    `json:"mood"`
		CreatedAt string `json:"createdAt"`
	}
	out := make([]j, 0, len(journals))
	for _, e := range journals {
		out = append(out, j{Content: e.Content, Mood: e.Mood, CreatedAt: e.CreatedAt})
	}
	b, _ := json.Marshal(out)
	return string(b)
}

// buildScoreDistribution 统计情绪分数分布
func buildScoreDistribution(records []model.InterceptRecord) string {
	dist := make(map[int]int)
	for _, r := range records {
		dist[r.EmotionScore]++
	}
	b, _ := json.Marshal(dist)
	return string(b)
}
