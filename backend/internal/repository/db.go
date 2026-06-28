package repository

import (
	"context"
	"cooling-chamber/internal/core"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool 创建 PostgreSQL 连接池并完成连通性校验
func NewPool(dsn string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("解析数据库配置失败: %w", err)
	}
	cfg.MaxConns = 100
	cfg.MinConns = 1
	cfg.MaxConnLifetime = time.Hour

	start := time.Now()
	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		core.Sugar().Errorw("创建数据库连接池失败", "error", err, "latency", time.Since(start))
		return nil, fmt.Errorf("创建连接池失败: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		core.Sugar().Errorw("数据库 Ping 失败", "error", err, "latency", time.Since(start))
		return nil, fmt.Errorf("数据库连接失败: %w", err)
	}

	core.Sugar().Infow("数据库连接成功",
		"max_conns", cfg.MaxConns,
		"min_conns", cfg.MinConns,
		"conn_lifetime", cfg.MaxConnLifetime,
		"latency", time.Since(start))
	return pool, nil
}

// RunMigrations 执行建表 SQL（IF NOT EXISTS，安全可重复执行）
func RunMigrations(pool *pgxpool.Pool) error {
	start := time.Now()
	core.Sugar().Info("开始检查/创建表结构")

	// 建表（首次创建）
	schema := `
CREATE TABLE IF NOT EXISTS intercept_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_message TEXT NOT NULL,
    emotion_score INT NOT NULL,
    emotion_label VARCHAR(20) NOT NULL,
    ai_analysis TEXT,
    questions TEXT[] NOT NULL,
    history JSONB DEFAULT '[]',
    suggestion TEXT,
    actually_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    mood INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    markdown TEXT NOT NULL,
    period_start DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`
	_, err := pool.Exec(context.Background(), schema)
	if err != nil {
		core.Sugar().Errorw("执行建表 SQL 失败", "error", err, "latency", time.Since(start))
		return fmt.Errorf("执行建表SQL失败: %w", err)
	}

	// 补列（对已存在的老表安全，IF NOT EXISTS）
	alterations := `
ALTER TABLE intercept_records ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
ALTER TABLE intercept_records ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';
ALTER TABLE intercept_records ALTER COLUMN questions DROP NOT NULL;
ALTER TABLE intercept_records ALTER COLUMN emotion_score DROP NOT NULL;
ALTER TABLE intercept_records ALTER COLUMN emotion_label DROP NOT NULL;
`
	if _, err := pool.Exec(context.Background(), alterations); err != nil {
		core.Sugar().Warnw("补列 SQL 执行警告（部分列可能已存在）", "error", err)
	}

	// 索引
	indices := `
CREATE INDEX IF NOT EXISTS idx_records_created ON intercept_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);
`
	if _, err := pool.Exec(context.Background(), indices); err != nil {
		core.Sugar().Warnw("建索引 SQL 执行警告", "error", err)
	}

	core.Sugar().Infow("表结构检查/创建完成", "latency", time.Since(start))
	return nil
}
