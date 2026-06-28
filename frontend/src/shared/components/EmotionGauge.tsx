import { Progress, Typography } from 'antd';
import type { ProgressProps } from 'antd';
import { getEmotionColor } from '../../core/theme';

const { Title, Text } = Typography;

interface EmotionGaugeProps {
  score: number; // 1-10
  label: string;
}

// 情绪仪表盘：半圆 dashboard，按分数分级配色
export function EmotionGauge({ score, label }: EmotionGaugeProps) {
  const color = getEmotionColor(score);
  const percent = Math.round((score / 10) * 100);
  const format: ProgressProps['format'] = () => (
    <span style={{ fontSize: 36, fontWeight: 700, color }}>{score}</span>
  );
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <Progress
        type="dashboard"
        percent={percent}
        strokeColor={color}
        format={format}
        size={200}
      />
      <Title level={4} style={{ color, margin: '8px 0 0' }}>
        {label}
      </Title>
      <Text type="secondary">发疯指数 · 1-10</Text>
    </div>
  );
}
