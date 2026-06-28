import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from 'antd';
import {
  ThunderboltOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CompassOutlined,
  SendOutlined,
  MenuOutlined,
  CloseOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../core/store';
import heroImage from '../../assets/hero-home.webp';

const { TextArea } = Input;

/* ---------- SVG 图标 ---------- */

type IconProps = { size?: number; color?: string; style?: React.CSSProperties };

const HeartIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SparklesIcon = ({ size = 14, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />
    <path d="M19 3v4M21 5h-4M5 17v2M6 18H4" />
  </svg>
);

const LockIcon = ({ size = 14, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ZapIcon = ({ size = 14, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const FireIcon = ({ size = 20, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const AlertIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircleIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PencilIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const SendIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MessageIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const features = [
  { key: 'intercept', title: '冲突拦截', desc: '发消息前，AI 帮你拦一下', icon: <ThunderboltOutlined />, path: '/intercept' },
  { key: 'journal', title: '情绪日记', desc: '把情绪写下来，比发出去安全', icon: <EditOutlined />, path: '/journal' },
  { key: 'history', title: '历史记录', desc: '看看你曾想发什么', icon: <HistoryOutlined />, path: '/history' },
  { key: 'insight', title: '盲区分析', desc: 'AI 帮你看清自己的模式', icon: <EyeOutlined />, path: '/insight' },
  { key: 'report', title: '7 天报告', desc: '一周关系体检', icon: <FileTextOutlined />, path: '/report' },
  { key: 'decide', title: '决策辅助', desc: '挽回还是放手，理一理', icon: <CompassOutlined />, path: '/decide' },
];

// 滚动渐入动画 hook
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// 可复用的渐入容器
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// 导航栏
function NavBar({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: scrolled ? '12px 32px' : '20px 32px',
          background: scrolled ? 'rgba(8,8,8,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,237,213,0.06)' : '1px solid transparent',
          transition: 'all 0.3s ease',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #fbbf24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            <HeartIcon size={14} color="#fff" />
          </div>
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 500, letterSpacing: 0.3 }}>冷静室</span>
        </div>

        {/* 桌面导航 */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span
            style={{ color: 'rgba(255,237,213,0.6)', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,237,213,0.6)')}
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            功能
          </span>
          <span
            style={{ color: 'rgba(255,237,213,0.6)', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,237,213,0.6)')}
            onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
          >
            怎么用
          </span>
          <span
            style={{ color: 'rgba(255,237,213,0.6)', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,237,213,0.6)')}
            onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
          >
            开始
          </span>
          <Button
            onClick={() => onNavigate('/intercept')}
            style={{
              height: 38,
              padding: '0 20px',
              borderRadius: 999,
              background: '#fff',
              color: '#1a1308',
              border: 'none',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            立即试试
          </Button>
        </div>

        {/* 移动端菜单按钮 */}
        <Button
          type="text"
          icon={menuOpen ? <CloseOutlined style={{ color: '#fff' }} /> : <MenuOutlined style={{ color: '#fff' }} />}
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none' }}
          className="mobile-menu-btn"
        />
      </div>

      {/* 移动端展开菜单 */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            zIndex: 999,
            background: 'rgba(8,8,8,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {['features', 'how', 'cta'].map((id) => (
            <span
              key={id}
              style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
              onClick={() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                setMenuOpen(false);
              }}
            >
              {id === 'features' ? '功能' : id === 'how' ? '怎么用' : '开始'}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// Hero 区域
function HeroSection({ onAnalyze }: { onAnalyze: (msg: string) => void }) {
  const [message, setMessage] = useState('');

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        overflow: 'hidden',
      }}
    >
      {/* 背景图 */}
      <img
        src={heroImage}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />
      {/* 暗色遮罩 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(8,8,8,0.7) 0%, rgba(8,8,8,0.5) 50%, rgba(8,8,8,0.85) 100%)',
          zIndex: 1,
        }}
      />

      {/* 内容 */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, textAlign: 'center', width: '100%' }}>
        {/* 公告标签 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255,237,213,0.08)',
            border: '1px solid rgba(255,237,213,0.12)',
            marginBottom: 28,
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,237,213,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,237,213,0.08)';
          }}
        >
          <SparklesIcon size={13} color="rgba(255,237,213,0.8)" />
          <span style={{ color: 'rgba(255,237,213,0.8)', fontSize: 13 }}>
            AI 军师已上线
          </span>
          <ArrowRightOutlined style={{ color: 'rgba(255,237,213,0.5)', fontSize: 11 }} />
        </div>

        {/* H1 大标题 */}
        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 60px)',
            fontWeight: 400,
            lineHeight: 1.15,
            margin: '0 0 20px 0',
            color: '#fff',
            letterSpacing: -0.5,
          }}
        >
          别急着发那条消息。
          <br />
          先冷静 3 分钟。
        </h1>

        {/* 副标题 */}
        <p
          style={{
            fontSize: 18,
            color: 'rgba(255,237,213,0.65)',
            marginBottom: 40,
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          AI 军师陪你捋清情绪，看清自己真正想说的。
          <br />
          不替你说话，替你把关。
        </p>

        {/* CTA 按钮组 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            size="large"
            onClick={() => document.getElementById('input-area')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              height: 48,
              padding: '0 32px',
              borderRadius: 999,
              background: '#fff',
              color: '#1a1308',
              border: 'none',
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            让 AI 帮我看看
          </Button>
          <Button
            size="large"
            ghost
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              height: 48,
              padding: '0 28px',
              borderRadius: 999,
              border: '1px solid rgba(255,237,213,0.2)',
              color: '#fff',
              fontWeight: 500,
              fontSize: 15,
              background: 'rgba(255,237,213,0.05)',
              backdropFilter: 'blur(10px)',
            }}
          >
            看看怎么用
          </Button>
        </div>
      </div>

      {/* 向下滚动指示 */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: 'rgba(255,237,213,0.3)', fontSize: 12 }}>向下看</span>
        <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(255,237,213,0.3), transparent)' }} />
      </div>
    </section>
  );
}

// 输入区域
function InputSection({ onAnalyze }: { onAnalyze: (msg: string) => void }) {
  const [message, setMessage] = useState('');

  return (
    <section
      id="input-area"
      style={{
        position: 'relative',
        padding: '100px 24px',
        background: '#1a1308',
        borderTop: '1px solid rgba(255,237,213,0.04)',
      }}
    >
      {/* 背景光晕 */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <span style={{ color: '#f97316', fontSize: 13, letterSpacing: 2, fontWeight: 500 }}>START</span>
          <h2
            style={{
              color: '#fff',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              margin: '12px 0 16px 0',
              lineHeight: 1.3,
            }}
          >
            把你想发的那条消息写下来
          </h2>
          <p style={{ color: 'rgba(255,237,213,0.5)', fontSize: 16, marginBottom: 40 }}>
            不用纠结措辞，想到什么写什么。AI 军师会帮你分析。
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div
            style={{
              background: 'rgba(255,237,213,0.03)',
              border: '1px solid rgba(255,237,213,0.08)',
              borderRadius: 20,
              padding: 24,
              textAlign: 'left',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span style={{ color: 'rgba(255,237,213,0.4)', fontSize: 13, display: 'block', marginBottom: 12 }}>
              你想发的消息
            </span>
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="比如：你到底在不在乎我？我已经受够了..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 16,
                resize: 'none',
                padding: 0,
                lineHeight: 1.6,
              }}
              variant="borderless"
            />
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,237,213,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'rgba(255,237,213,0.3)', fontSize: 12 }}>{message.length} 字</span>
              <Button
                type="primary"
                size="large"
                onClick={() => onAnalyze(message)}
                disabled={!message.trim()}
                icon={<SendOutlined />}
                style={{
                  height: 44,
                  padding: '0 28px',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                让军师看看
              </Button>
            </div>
          </div>
        </Reveal>

        {/* 信任标签 */}
        <Reveal delay={200}>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
            {[
              { icon: <LockIcon size={14} color="rgba(255,237,213,0.4)" />, text: '内容仅你可见' },
              { icon: <ZapIcon size={14} color="rgba(255,237,213,0.4)" />, text: '3 秒出分析' },
              { icon: <HeartIcon size={14} color="rgba(255,237,213,0.4)" />, text: '24h 自动销毁' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.icon}
                <span style={{ color: 'rgba(255,237,213,0.4)', fontSize: 13 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// 数据统计区
function StatsSection() {
  const stats = [
    { value: '12,847', label: '条冲动消息被拦截' },
    { value: '3 min', label: '平均冷静时间' },
    { value: '94%', label: '用户冷静后不后悔' },
  ];
  return (
    <section
      style={{
        padding: '80px 24px',
        background: '#0c0c0c',
        borderTop: '1px solid rgba(255,237,213,0.04)',
        borderBottom: '1px solid rgba(255,237,213,0.04)',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <p style={{ color: 'rgba(255,237,213,0.5)', fontSize: 17, maxWidth: 500, margin: '0 auto 56px' }}>
            已帮助数千人在冲动发消息前冷静下来，避免说出让自己后悔的话。
          </p>
        </Reveal>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
          }}
        >
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div>
                <div
                  style={{
                    fontSize: 'clamp(36px, 5vw, 52px)',
                    fontWeight: 300,
                    color: '#fff',
                    marginBottom: 8,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,237,213,0.45)', fontSize: 14 }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// 产品模拟图（聊天界面）
function ChatMockup() {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#111',
        border: '1px solid rgba(255,237,213,0.08)',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
      }}
    >
      {/* 窗口顶栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,237,213,0.06)',
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ color: 'rgba(255,237,213,0.3)', fontSize: 12, marginLeft: 8 }}>冷静室 · 对话</span>
      </div>
      {/* 聊天内容 */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 用户消息 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: '14px 14px 4px 14px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            你到底在不在乎我？我已经受够了
          </div>
        </div>
        {/* AI 消息 */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: '14px 14px 14px 4px',
              background: 'rgba(255,237,213,0.06)',
              color: 'rgba(255,237,213,0.9)',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            我感受到你此刻很受伤。在发这条之前，先问你一个问题：你发这条消息，最想达到什么目的？
          </div>
        </div>
        {/* 问题选项 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
          {['想让对方理解我的感受', '想确认对方在不在乎我', '想和对方说清楚'].map((opt, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: i === 1 ? '1.5px solid #f97316' : '1px solid rgba(255,237,213,0.1)',
                background: i === 1 ? 'rgba(249,115,22,0.1)' : 'rgba(255,237,213,0.02)',
                color: 'rgba(255,237,213,0.7)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: i === 1 ? '2px solid #f97316' : '1.5px solid rgba(255,237,213,0.2)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i === 1 && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316' }} />}
              </div>
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 产品模拟图（情绪仪表盘）
function GaugeMockup() {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#111',
        border: '1px solid rgba(255,237,213,0.08)',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FireIcon size={20} color="#ef4444" />
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>情绪分：8 分（冲动）</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,237,213,0.06)', overflow: 'hidden' }}>
          <div style={{ width: '80%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)' }} />
        </div>
        <p style={{ color: 'rgba(255,237,213,0.4)', fontSize: 13, margin: '8px 0 0 0' }}>
          情绪很高涨，建议先深呼吸，别急着发
        </p>
      </div>
      <div
        style={{
          padding: '16px',
          borderRadius: 12,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <AlertIcon size={16} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 500 }}>检测到冲动信号</span>
        </div>
        <p style={{ color: 'rgba(255,237,213,0.5)', fontSize: 13, margin: 0 }}>
          你的消息中包含强烈情绪词。AI 军师建议你先回答 3 个问题，再决定是否发送。
        </p>
      </div>
    </div>
  );
}

// 产品模拟图（决策卡片）
function DecisionMockup() {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#111',
        border: '1px solid rgba(255,237,213,0.08)',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: '#fff', fontSize: 17, fontWeight: 500, margin: '0 0 4px 0' }}>你现在怎么想？</p>
        <p style={{ color: 'rgba(255,237,213,0.4)', fontSize: 13, margin: 0 }}>选一个，军师给你最后的回应</p>
      </div>
      {[
        { icon: <CheckCircleIcon size={16} color="#10b981" />, title: '不发了', desc: '冷静下来了，觉得没必要', color: '#10b981' },
        { icon: <PencilIcon size={16} color="#f59e0b" />, title: '改改再发', desc: '语气缓和一点，说清楚就行', color: '#f59e0b' },
        { icon: <SendIcon size={16} color="#ef4444" />, title: '还是想发', desc: '我想清楚了，发了不后悔', color: '#ef4444' },
        { icon: <MessageIcon size={16} color="#6b7280" />, title: '再想想', desc: '和军师再聊聊', color: '#6b7280' },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            border: `1px solid ${c.color}33`,
            background: i === 0 ? `${c.color}10` : 'rgba(255,237,213,0.02)',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${c.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            {c.icon}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{c.title}</div>
            <div style={{ color: 'rgba(255,237,213,0.4)', fontSize: 12 }}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 功能区块（交替左右布局，仿 giga.ai）
function FeatureBlock({
  eyebrow,
  title,
  description,
  features: subFeatures,
  mockup,
  reversed,
  exploreText,
  onExplore,
}: {
  eyebrow: string;
  title: string;
  description: string;
  features: { title: string; desc: string }[];
  mockup: React.ReactNode;
  reversed?: boolean;
  exploreText?: string;
  onExplore?: () => void;
}) {
  return (
    <section
      style={{
        padding: '100px 24px',
        background: '#1a1308',
        borderTop: '1px solid rgba(255,237,213,0.04)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
          direction: reversed ? 'rtl' : 'ltr',
        }}
        className="feature-grid"
      >
        {/* 文字区 */}
        <div style={{ direction: 'ltr' }}>
          <Reveal>
            <span style={{ color: '#f97316', fontSize: 13, letterSpacing: 2, fontWeight: 500 }}>{eyebrow}</span>
            <h2
              style={{
                color: '#fff',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 400,
                margin: '12px 0 16px 0',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
            <p style={{ color: 'rgba(255,237,213,0.5)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              {description}
            </p>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {subFeatures.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'rgba(249,115,22,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
                  </div>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 500, margin: '0 0 4px 0' }}>{f.title}</h3>
                    <p style={{ color: 'rgba(255,237,213,0.45)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {exploreText && (
            <Reveal delay={300}>
              <div
                style={{
                  marginTop: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  color: '#f97316',
                  fontSize: 15,
                  fontWeight: 500,
                  transition: 'gap 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.gap = '10px')}
                onMouseLeave={(e) => (e.currentTarget.style.gap = '6px')}
                onClick={onExplore}
              >
                {exploreText}
                <ArrowRightOutlined style={{ fontSize: 12 }} />
              </div>
            </Reveal>
          )}
        </div>

        {/* 产品图区 */}
        <div style={{ direction: 'ltr' }}>
          <Reveal delay={150}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  right: '10%',
                  bottom: '10%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 60%)',
                  filter: 'blur(40px)',
                  zIndex: 0,
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>{mockup}</div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// 用户评价区
function TestimonialSection() {
  return (
    <section
      style={{
        padding: '120px 24px',
        background: '#0c0c0c',
        borderTop: '1px solid rgba(255,237,213,0.04)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Reveal>
          <span style={{ color: 'rgba(255,237,213,0.4)', fontSize: 13, letterSpacing: 2, fontWeight: 500 }}>
            用户真实反馈
          </span>
        </Reveal>
        <Reveal delay={100}>
          <blockquote
            style={{
              color: '#fff',
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 300,
              lineHeight: 1.5,
              margin: '24px 0',
              fontStyle: 'normal',
            }}
          >
            "凌晨 2 点想发一条质问消息，冷静室拦住了我。回答完三个问题，我发现自己其实不是想吵架，只是太想他了。最后改了一条温和的消息发出去，结果完全不一样。"
          </blockquote>
        </Reveal>
        <Reveal delay={200}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              L
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>小林</div>
              <div style={{ color: 'rgba(255,237,213,0.4)', fontSize: 13 }}>使用冷静室 3 周</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// 功能入口网格
function FeaturesGrid({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section
      id="features"
      style={{
        padding: '100px 24px',
        background: '#1a1308',
        borderTop: '1px solid rgba(255,237,213,0.04)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ color: '#f97316', fontSize: 13, letterSpacing: 2, fontWeight: 500 }}>FEATURES</span>
            <h2
              style={{
                color: '#fff',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 400,
                margin: '12px 0 16px 0',
              }}
            >
              不只是拦截，更是陪你想清楚
            </h2>
            <p style={{ color: 'rgba(255,237,213,0.5)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              从情绪觉察到理性决策，一步一步帮你看清自己真正想要的。
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <Reveal key={f.key} delay={i * 60}>
              <div
                onClick={() => onNavigate(f.path)}
                style={{
                  padding: '28px 24px',
                  borderRadius: 16,
                  background: 'rgba(255,237,213,0.02)',
                  border: '1px solid rgba(255,237,213,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,237,213,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,237,213,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,237,213,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    marginBottom: 16,
                    color: '#f97316',
                  }}
                >
                  {f.icon}
                </div>
                <div style={{ color: '#fff', fontSize: 17, fontWeight: 500, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,237,213,0.5)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// 最终 CTA 区域
function CTASection({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section
      id="cta"
      style={{
        position: 'relative',
        padding: '120px 24px',
        textAlign: 'center',
        overflow: 'hidden',
        background: '#1a1308',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
      <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
        <Reveal>
          <h2
            style={{
              color: '#fff',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              marginBottom: 16,
              lineHeight: 1.3,
            }}
          >
            今天，别再发让自己后悔的消息
          </h2>
          <p style={{ color: 'rgba(255,237,213,0.5)', fontSize: 16, marginBottom: 32 }}>
            花 3 分钟，和军师聊聊。想清楚了，再决定。
          </p>
          <Button
            size="large"
            onClick={() => onNavigate('/intercept')}
            style={{
              height: 52,
              padding: '0 40px',
              borderRadius: 999,
              background: '#fff',
              color: '#1a1308',
              border: 'none',
              fontWeight: 500,
              fontSize: 16,
            }}
          >
            开始冷静一下 →
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

// 底部
function Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  const cols = [
    {
      title: '功能',
      links: features.slice(0, 3),
    },
    {
      title: '更多',
      links: features.slice(3),
    },
  ];

  return (
    <footer
      style={{
        padding: '60px 32px 32px',
        background: '#1a1308',
        borderTop: '1px solid rgba(255,237,213,0.04)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 40,
            marginBottom: 48,
          }}
          className="footer-grid"
        >
          {/* Logo + 描述 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #fbbf24 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HeartIcon size={14} color="#fff" />
              </div>
              <span style={{ color: '#fff', fontSize: 17, fontWeight: 500 }}>冷静室</span>
            </div>
            <p style={{ color: 'rgba(255,237,213,0.4)', fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
              不替你说话，替你把关。AI 军师陪你度过每一个想发消息的深夜。
            </p>
          </div>

          {/* 链接列 */}
          {cols.map((col) => (
            <div key={col.title}>
              <div style={{ color: 'rgba(255,237,213,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                {col.title}
              </div>
              {col.links.map((f) => (
                <div
                  key={f.key}
                  onClick={() => onNavigate(f.path)}
                  style={{
                    color: 'rgba(255,237,213,0.6)',
                    fontSize: 14,
                    marginBottom: 10,
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,237,213,0.6)')}
                >
                  {f.title}
                </div>
              ))}
            </div>
          ))}

          {/* 安全 */}
          <div>
            <div style={{ color: 'rgba(255,237,213,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>安全</div>
            {[
              { icon: <LockIcon size={13} color="rgba(255,237,213,0.6)" />, text: '隐私保护' },
              { icon: <ZapIcon size={13} color="rgba(255,237,213,0.6)" />, text: '即时响应' },
              { icon: <HeartIcon size={13} color="rgba(255,237,213,0.6)" />, text: '情感优先' },
            ].map((item) => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                {item.icon}
                <span style={{ color: 'rgba(255,237,213,0.6)', fontSize: 14 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            paddingTop: 24,
            borderTop: '1px solid rgba(255,237,213,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span style={{ color: 'rgba(255,237,213,0.3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            © 2026 冷静室 · 不替你说话，替你把关
            <HeartIcon size={12} color="rgba(255,237,213,0.3)" />
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['隐私政策', '服务条款', '联系我们'].map((t) => (
              <span
                key={t}
                style={{ color: 'rgba(255,237,213,0.3)', fontSize: 13, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,237,213,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,237,213,0.3)')}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const setPendingMessage = useAppStore((s) => s.setPendingMessage);

  const handleAnalyze = (msg: string) => {
    if (!msg.trim()) return;
    setPendingMessage(msg.trim());
    navigate('/intercept');
  };

  const handleNavigate = (path: string) => navigate(path);

  return (
    <div className="homepage" style={{ minHeight: '100vh', background: '#1a1308' }}>
      <NavBar onNavigate={handleNavigate} />

      <HeroSection onAnalyze={handleAnalyze} />

      <InputSection onAnalyze={handleAnalyze} />

      <StatsSection />

      {/* 功能区块 1：冲突拦截 */}
      <div id="how">
        <FeatureBlock
          eyebrow="INTERCEPT"
          title="发消息前，AI 帮你拦一下"
          description="当你写下想发的消息，AI 军师会先帮你做情绪分析，然后通过 3 个问题帮你理清真实意图。不是阻止你，而是确保你想清楚了。"
          features={[
            { title: '情绪打分', desc: 'AI 实时分析你的消息情绪强度，0-10 分量化你的状态' },
            { title: '三个关键问题', desc: '一题一题回答，逐步看清自己真正想达到什么目的' },
            { title: '军师对话', desc: 'AI 军师基于你的回答，以对话形式给出建议和开导' },
          ]}
          mockup={<ChatMockup />}
          exploreText="试试冲突拦截"
          onExplore={() => handleNavigate('/intercept')}
        />
      </div>

      {/* 功能区块 2：情绪分析 */}
      <FeatureBlock
        eyebrow="ANALYZE"
        title="看清你的情绪温度"
        description="情绪仪表盘实时反映你的情绪状态。从冷静到冲动，一目了然。当情绪过高时，系统会主动提醒你先深呼吸。"
        features={[
          { title: '情绪量化', desc: '将模糊的感受变成具体的数字，帮你客观看待自己' },
          { title: '冲动预警', desc: '检测到高情绪分时主动拦截，避免你做出后悔的决定' },
          { title: '情绪追踪', desc: '记录每次情绪波动，发现你的情绪触发模式' },
        ]}
        mockup={<GaugeMockup />}
        reversed
        exploreText="查看盲区分析"
        onExplore={() => handleNavigate('/insight')}
      />

      {/* 功能区块 3：决策辅助 */}
      <FeatureBlock
        eyebrow="DECIDE"
        title="想清楚了，再决定"
        description="军师给完建议后，你来选择：不发了、改改再发、还是想发就发。每个选择都有军师的最后回应。不是替你决定，而是陪你决定。"
        features={[
          { title: '四个选择', desc: '不发了 / 改改再发 / 还是想发 / 再想想，选你觉得对的' },
          { title: '最后回应', desc: '无论你选什么，军师都会给出最后的鼓励或提醒' },
          { title: '继续聊聊', desc: '没想清楚？可以继续和军师自由对话，直到你满意' },
        ]}
        mockup={<DecisionMockup />}
        exploreText="试试决策辅助"
        onExplore={() => handleNavigate('/decide')}
      />

      <TestimonialSection />

      <FeaturesGrid onNavigate={handleNavigate} />

      <CTASection onNavigate={handleNavigate} />

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
