import { Button, Result } from 'antd';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

// 错误态（含重试按钮）
export function ErrorState({ message = '出了点问题', onRetry }: ErrorStateProps) {
  return (
    <Result
      status="warning"
      title={message}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            重试
          </Button>
        ) : undefined
      }
    />
  );
}
