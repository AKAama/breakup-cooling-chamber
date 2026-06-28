package repository

import (
	"context"
	"cooling-chamber/internal/core"
	"cooling-chamber/internal/model"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// JournalRepository 日记仓储
type JournalRepository struct {
	pool *pgxpool.Pool
}

// NewJournalRepository 创建日记仓储
func NewJournalRepository(pool *pgxpool.Pool) *JournalRepository {
	return &JournalRepository{pool: pool}
}

// Create 插入一条日记，回填 DB 生成的 id 与 created_at
func (r *JournalRepository) Create(ctx context.Context, j *model.JournalEntry) error {
	start := time.Now()
	core.Sugar().Debugw("创建日记",
		"mood", j.Mood,
		"content_preview", truncate(j.Content, 50))

	var id string
	var createdAt time.Time
	err := r.pool.QueryRow(ctx, `
		INSERT INTO journal_entries (content, mood)
		VALUES ($1, $2)
		RETURNING id, created_at
	`, j.Content, j.Mood).Scan(&id, &createdAt)
	if err != nil {
		core.Sugar().Errorw("插入日记失败", "error", err, "latency", time.Since(start))
		return fmt.Errorf("插入日记失败: %w", err)
	}
	j.ID = id
	j.CreatedAt = createdAt.Format(time.RFC3339)
	core.Sugar().Infow("创建日记成功",
		"id", j.ID,
		"mood", j.Mood,
		"latency", time.Since(start))
	return nil
}

// ListRecent 返回最近 days 天的日记（按创建时间倒序）
func (r *JournalRepository) ListRecent(ctx context.Context, days int) ([]model.JournalEntry, error) {
	start := time.Now()
	core.Sugar().Debugw("查询日记", "days", days)

	since := time.Now().AddDate(0, 0, -days)
	rows, err := r.pool.Query(ctx, `
		SELECT id, content, mood, created_at
		FROM journal_entries
		WHERE created_at >= $1
		ORDER BY created_at DESC
	`, since)
	if err != nil {
		core.Sugar().Errorw("查询日记失败", "error", err, "latency", time.Since(start))
		return nil, fmt.Errorf("查询日记失败: %w", err)
	}
	defer rows.Close()

	entries := make([]model.JournalEntry, 0)
	for rows.Next() {
		var j model.JournalEntry
		var createdAt time.Time
		if err := rows.Scan(&j.ID, &j.Content, &j.Mood, &createdAt); err != nil {
			core.Sugar().Errorw("扫描日记失败", "error", err)
			return nil, fmt.Errorf("扫描日记失败: %w", err)
		}
		j.CreatedAt = createdAt.Format(time.RFC3339)
		entries = append(entries, j)
	}
	core.Sugar().Infow("查询日记完成",
		"count", len(entries),
		"days", days,
		"latency", time.Since(start))
	return entries, rows.Err()
}
