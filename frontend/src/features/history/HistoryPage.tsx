import { useEffect, useState } from 'react';
import { Card, Tag, Typography } from 'antd';
import { getHistory } from '../../core/api';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import { EmptyState } from '../../shared/components/EmptyState';
import { getEmotionColor } from '../../core/theme';
import type { InterceptRecord } from '../../types';

const { Title, Text, Paragraph } = Typography;

export function HistoryPage() {
  const [records, setRecords] = useState<InterceptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getHistory();
      setRecords(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Title level={3}>历史记录</Title>
      {loading ? (
        <LoadingState message="加载记录..." />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : records.length === 0 ? (
        <EmptyState title="还没有拦截记录" subtitle="去首页试试冲突拦截" />
      ) : (
        <div>
          {records.map((item) => (
            <Card key={item.id} size="small" style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Tag color={getEmotionColor(item.emotion_score)}>
                  {item.emotion_label} · {item.emotion_score}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </div>
              <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                {item.raw_message}
              </Paragraph>
              {item.actually_sent && (
                <Text type="warning" style={{ fontSize: 12 }}>
                  已发送
                </Text>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
