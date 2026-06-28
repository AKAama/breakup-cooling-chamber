-- 分手冷静室 · 初始化建表 SQL

CREATE TABLE IF NOT EXISTS intercept_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_message TEXT NOT NULL,
    emotion_score INT NOT NULL,
    emotion_label VARCHAR(20) NOT NULL,
    questions TEXT[] NOT NULL,
    answers TEXT[],
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_records_created ON intercept_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);
