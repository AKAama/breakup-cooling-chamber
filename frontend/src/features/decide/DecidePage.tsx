import { useState } from 'react';
import { Button, Card, Divider, Input, List, message, Space, Tag, Typography } from 'antd';
import { postDecide } from '../../core/api';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import type { DecideResult } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export function DecidePage() {
  const [behaviors, setBehaviors] = useState<string[]>(['', '', '', '', '']);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<DecideResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleAnalyze = async () => {
    const filled = behaviors.filter((b) => b.trim());
    if (filled.length < 3) {
      message.warning('请至少填写 3 个行为模式');
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await postDecide(filled, context.trim() || undefined);
      setResult(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Title level={3}>决策辅助</Title>
      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">输入对方的 5 个核心行为模式</Text>
        <Space orientation="vertical" size="small" style={{ width: '100%', marginTop: 12 }}>
          {behaviors.map((b, i) => (
            <Input
              key={i}
              value={b}
              onChange={(e) => {
                const next = [...behaviors];
                next[i] = e.target.value;
                setBehaviors(next);
              }}
              placeholder={`行为模式 ${i + 1}`}
            />
          ))}
        </Space>
        <TextArea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="关系背景（可选）"
          autoSize={{ minRows: 2, maxRows: 4 }}
          style={{ marginTop: 12 }}
        />
        <Button
          type="primary"
          block
          size="large"
          style={{ marginTop: 12 }}
          onClick={() => void handleAnalyze()}
        >
          帮我理一理
        </Button>
      </Card>

      {loading && <LoadingState message="AI 正在帮你理清沉没成本与未来预期..." />}
      {error && <ErrorState onRetry={() => void handleAnalyze()} />}
      {result && (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Card title="沉没成本">
            <Paragraph>
              <Text type="secondary">时间：</Text>
              {result.sunk_cost.time}
            </Paragraph>
            <Paragraph>
              <Text type="secondary">情感：</Text>
              {result.sunk_cost.emotion}
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>{result.sunk_cost.summary}</Paragraph>
          </Card>
          <Card title="未来预期">
            <Text type="secondary">积极面</Text>
            <List
              size="small"
              dataSource={result.future_expectation.positives}
              renderItem={(p) => (
                <List.Item>
                  <Tag color="green">+</Tag>
                  {p}
                </List.Item>
              )}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              风险
            </Text>
            <List
              size="small"
              dataSource={result.future_expectation.risks}
              renderItem={(r) => (
                <List.Item>
                  <Tag color="red">-</Tag>
                  {r}
                </List.Item>
              )}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Paragraph style={{ marginBottom: 0 }}>
              {result.future_expectation.summary}
            </Paragraph>
          </Card>
          <Card title="问自己的问题">
            <List
              size="small"
              dataSource={result.questions_to_self}
              renderItem={(q) => <List.Item>{q}</List.Item>}
            />
          </Card>
          <Paragraph type="secondary" italic>
            {result.reminder}
          </Paragraph>
        </Space>
      )}
    </div>
  );
}
