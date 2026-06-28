import { useEffect, useState } from 'react';
import { Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import { getInsight } from '../../core/api';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import { EmptyState } from '../../shared/components/EmptyState';
import type { InsightResult } from '../../types';

const { Title, Paragraph, Text } = Typography;

export function InsightPage() {
  const [data, setData] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getInsight();
      setData(res);
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
      <Title level={3}>盲区分析</Title>
      {loading ? (
        <LoadingState message="AI 正在分析你的行为模式..." />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !data || data.observations.length === 0 ? (
        <EmptyState title="数据不足" subtitle="多用几次冲突拦截，再来分析" />
      ) : (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Card>
                <Statistic title="情绪峰值时段" value={data.peak_hours} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="高频用语数" value={data.frequent_words.length} />
              </Card>
            </Col>
          </Row>
          <Card>
            <Text type="secondary">高频绝对化用语</Text>
            <div style={{ marginTop: 8 }}>
              {data.frequent_words.map((w) => (
                <Tag key={w} color="orange" style={{ marginBottom: 4 }}>
                  {w}
                </Tag>
              ))}
            </div>
          </Card>
          {data.observations.map((o, i) => (
            <Card key={i} title={o.pattern}>
              <Paragraph>
                <Text type="secondary">证据：</Text>
                {o.evidence}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <Text type="secondary">洞察：</Text>
                {o.insight}
              </Paragraph>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}
