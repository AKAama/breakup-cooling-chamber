package repository

import (
	"context"
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/model"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RecordRepository 拦截记录仓储
type RecordRepository struct {
	pool *pgxpool.Pool
}

// NewRecordRepository 创建拦截记录仓储
func NewRecordRepository(pool *pgxpool.Pool) *RecordRepository {
	return &RecordRepository{pool: pool}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

// Create 插入一条拦截记录，回填 DB 生成的 id 与 created_at
func (r *RecordRepository) Create(ctx context.Context, rec *model.InterceptRecord) error {
	start := time.Now()
	core.Sugar().Debugw("创建拦截记录",
		"message_preview", truncate(rec.RawMessage, 50),
		"emotion_score", rec.EmotionScore,
		"emotion_label", rec.EmotionLabel)

	historyJSON, err := json.Marshal(rec.History)
	if err != nil {
		core.Sugar().Errorw("序列化 history 失败", "error", err)
		return fmt.Errorf("序列化 history 失败: %w", err)
	}

	var id string
	var createdAt time.Time
	err = r.pool.QueryRow(ctx, `
		INSERT INTO intercept_records (raw_message, emotion_score, emotion_label, ai_analysis, questions, history, suggestion, actually_sent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`,
		rec.RawMessage, rec.EmotionScore, rec.EmotionLabel,
		rec.AIAnalysis, rec.Questions, historyJSON, rec.Suggestion, rec.ActuallySent,
	).Scan(&id, &createdAt)
	if err != nil {
		core.Sugar().Errorw("插入拦截记录失败", "error", err, "latency", time.Since(start))
		return fmt.Errorf("插入拦截记录失败: %w", err)
	}
	rec.ID = id
	rec.CreatedAt = createdAt.Format(time.RFC3339)
	core.Sugar().Infow("创建拦截记录成功",
		"id", rec.ID,
		"emotion_score", rec.EmotionScore,
		"emotion_label", rec.EmotionLabel,
		"latency", time.Since(start))
	return nil
}

// ListRecent 返回最近 days 天内的拦截记录（按创建时间倒序）
func (r *RecordRepository) ListRecent(ctx context.Context, days int) ([]model.InterceptRecord, error) {
	start := time.Now()
	core.Sugar().Debugw("查询拦截记录", "days", days)

	since := time.Now().AddDate(0, 0, -days)
	rows, err := r.pool.Query(ctx, `
		SELECT id, raw_message, emotion_score, emotion_label, ai_analysis, questions,
		       COALESCE(history, '[]'::jsonb), suggestion, actually_sent, created_at
		FROM intercept_records
		WHERE created_at >= $1
		ORDER BY created_at DESC
	`, since)
	if err != nil {
		core.Sugar().Errorw("查询拦截记录失败", "error", err, "latency", time.Since(start))
		return nil, fmt.Errorf("查询拦截记录失败: %w", err)
	}
	defer rows.Close()

	records := make([]model.InterceptRecord, 0)
	for rows.Next() {
		var rec model.InterceptRecord
		var createdAt time.Time
		var historyBytes []byte
		if err := rows.Scan(&rec.ID, &rec.RawMessage, &rec.EmotionScore, &rec.EmotionLabel,
			&rec.AIAnalysis, &rec.Questions, &historyBytes, &rec.Suggestion, &rec.ActuallySent, &createdAt); err != nil {
			core.Sugar().Errorw("扫描拦截记录失败", "error", err)
			return nil, fmt.Errorf("扫描拦截记录失败: %w", err)
		}
		if err := json.Unmarshal(historyBytes, &rec.History); err != nil {
			core.Sugar().Warnw("解析 history JSON 失败", "error", err, "id", rec.ID)
			return nil, fmt.Errorf("解析 history JSON 失败: %w", err)
		}
		rec.CreatedAt = createdAt.Format(time.RFC3339)
		records = append(records, rec)
	}
	core.Sugar().Infow("查询拦截记录完成",
		"count", len(records),
		"days", days,
		"latency", time.Since(start))
	return records, rows.Err()
}

// GetByID 按 ID 查询单条拦截记录
func (r *RecordRepository) GetByID(ctx context.Context, id string) (*model.InterceptRecord, error) {
	start := time.Now()
	core.Sugar().Debugw("查询单条拦截记录", "id", id)

	var rec model.InterceptRecord
	var createdAt time.Time
	var historyBytes []byte
	err := r.pool.QueryRow(ctx, `
		SELECT id, raw_message, emotion_score, emotion_label, ai_analysis, questions,
		       COALESCE(history, '[]'::jsonb), suggestion, actually_sent, created_at
		FROM intercept_records
		WHERE id = $1
	`, id).Scan(&rec.ID, &rec.RawMessage, &rec.EmotionScore, &rec.EmotionLabel,
		&rec.AIAnalysis, &rec.Questions, &historyBytes, &rec.Suggestion, &rec.ActuallySent, &createdAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			core.Sugar().Warnw("拦截记录不存在", "id", id)
			return nil, nil
		}
		core.Sugar().Errorw("查询单条拦截记录失败", "error", err, "id", id, "latency", time.Since(start))
		return nil, fmt.Errorf("查询拦截记录失败: %w", err)
	}
	if err := json.Unmarshal(historyBytes, &rec.History); err != nil {
		core.Sugar().Warnw("解析 history JSON 失败", "error", err, "id", id)
		return nil, fmt.Errorf("解析 history JSON 失败: %w", err)
	}
	rec.CreatedAt = createdAt.Format(time.RFC3339)
	core.Sugar().Infow("查询单条拦截记录成功",
		"id", id,
		"emotion_score", rec.EmotionScore,
		"latency", time.Since(start))
	return &rec, nil
}

// UpdateHistory 更新拦截记录的对话历史
func (r *RecordRepository) UpdateHistory(ctx context.Context, id string, history []model.Message, suggestion *string) error {
	start := time.Now()
	hasSuggestion := suggestion != nil && *suggestion != ""
	core.Sugar().Debugw("更新记录历史", "id", id, "history_len", len(history), "has_suggestion", hasSuggestion)

	if id == "" {
		core.Sugar().Warnw("更新记录历史跳过：ID 为空")
		return fmt.Errorf("记录 ID 为空，无法更新")
	}

	historyJSON, err := json.Marshal(history)
	if err != nil {
		core.Sugar().Errorw("序列化 history 失败", "error", err)
		return fmt.Errorf("序列化 history 失败: %w", err)
	}

	_, err = r.pool.Exec(ctx, `
		UPDATE intercept_records
		SET history = $2, suggestion = COALESCE($3, suggestion)
		WHERE id = $1
	`, id, historyJSON, suggestion)
	if err != nil {
		core.Sugar().Errorw("更新记录历史失败", "error", err, "id", id, "latency", time.Since(start))
		return fmt.Errorf("更新 history 失败: %w", err)
	}
	core.Sugar().Infow("更新记录历史成功",
		"id", id,
		"history_len", len(history),
		"has_suggestion", hasSuggestion,
		"latency", time.Since(start))
	return nil
}
