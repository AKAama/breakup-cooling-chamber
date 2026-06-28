import { useEffect, useState } from 'react';
import { Button, Card, Input, List, message, Slider, Space, Typography } from 'antd';
import { getJournals, postJournal } from '../../core/api';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import { EmptyState } from '../../shared/components/EmptyState';
import type { JournalEntry } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export function JournalPage() {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(5);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getJournals();
      setJournals(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('写点什么再保存');
      return;
    }
    try {
      const entry = await postJournal(content.trim(), mood);
      setJournals((prev) => [entry, ...prev]);
      setContent('');
      setMood(5);
      message.success('已保存');
    } catch {
      message.error('保存失败，稍后再试');
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Title level={3}>日记</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="把现在的感受写下来，写完会比发出去舒服"
            autoSize={{ minRows: 4, maxRows: 10 }}
          />
          <div>
            <Text type="secondary">心情指数：{mood}</Text>
            <Slider min={1} max={10} value={mood} onChange={setMood} />
          </div>
          <Button type="primary" onClick={() => void handleSubmit()}>
            保存日记
          </Button>
        </Space>
      </Card>

      <Title level={4}>历史日记</Title>
      {loading ? (
        <LoadingState message="加载日记..." />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : journals.length === 0 ? (
        <EmptyState title="还没有日记" subtitle="写下第一条吧" />
      ) : (
        <List
          dataSource={journals}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Text>{new Date(item.created_at).toLocaleString()}</Text>}
                description={
                  <>
                    <Text type="secondary">心情：{item.mood}</Text>
                    <br />
                    {item.content}
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
