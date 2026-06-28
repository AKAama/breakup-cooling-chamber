import { useEffect, useState } from 'react';
import { Card, Typography } from 'antd';
import { getReport } from '../../core/api';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import { EmptyState } from '../../shared/components/EmptyState';

const { Title } = Typography;

export function ReportPage() {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getReport();
      setMarkdown(res);
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
      <Title level={3}>7 天关系体检报告</Title>
      {loading ? (
        <LoadingState message="生成报告中..." />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !markdown ? (
        <EmptyState title="数据不足" subtitle="积累 7 天记录后生成完整报告" />
      ) : (
        <Card>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              fontFamily: 'inherit',
            }}
          >
            {markdown}
          </pre>
        </Card>
      )}
    </div>
  );
}
