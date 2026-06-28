import { useEffect, useState } from 'react';
import { Button, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../core/store';

const { Title, Text } = Typography;

// 格式化倒计时 mm:ss
function formatRemain(ms: number): string {
  if (ms <= 0) return '00:00';
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 软锁全屏遮罩：30min 倒计时 + 写日记/听白噪音入口
export function LockOverlay() {
  const navigate = useNavigate();
  const unlockAt = useAppStore((s) => s.unlockAt);
  const lockReason = useAppStore((s) => s.lockReason);
  const clearLock = useAppStore((s) => s.clearLock);

  const [remain, setRemain] = useState(() => (unlockAt ? unlockAt - Date.now() : 0));

  useEffect(() => {
    const timer = setInterval(() => {
      if (!unlockAt) return;
      const left = unlockAt - Date.now();
      setRemain(left);
      if (left <= 0) {
        clearLock();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [unlockAt, clearLock]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(31, 31, 46, 0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <Title level={2} style={{ color: '#fff' }}>
        现在说的话，明天醒来你会想删
      </Title>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>{lockReason}</Text>
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          margin: '24px 0',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatRemain(remain)}
      </div>
      <Text style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
        倒计时结束自动解锁
      </Text>
      <div style={{ display: 'flex', gap: 16 }}>
        <Button size="large" onClick={() => navigate('/journal')}>
          写日记
        </Button>
        <Button size="large" ghost onClick={() => message.info('白噪音即将上线')}>
          听白噪音
        </Button>
      </div>
    </div>
  );
}
