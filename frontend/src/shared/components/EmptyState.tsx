import { Empty, Typography } from 'antd';

const { Title, Text } = Typography;

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

// 空状态
export function EmptyState({ title = '暂无数据', subtitle }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <Empty description={false} />
      <Title level={5} style={{ marginTop: 16 }}>
        {title}
      </Title>
      {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
    </div>
  );
}
