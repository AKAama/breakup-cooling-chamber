import { Spin, Typography } from 'antd';

const { Text } = Typography;

interface LoadingStateProps {
  message?: string;
}

// 加载态
export function LoadingState({ message = '正在分析...' }: LoadingStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <Spin size="large" />
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">{message}</Text>
      </div>
    </div>
  );
}
