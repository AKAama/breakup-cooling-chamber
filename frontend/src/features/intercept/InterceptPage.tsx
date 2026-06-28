import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, message } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../../core/store';
import { streamInterceptChat, streamInterceptAnswer } from '../../core/api';
import type { AnalysisFrame, AnalysisQuestion } from '../../types';

const { TextArea } = Input;

/* ---------- 色值常量 ---------- */
const C = {
  bg: '#1a1308',
  primary: '#f97316',
  primaryDark: '#ea580c',
  accent: '#fbbf24',
  cardBg: 'rgba(255,200,150,0.04)',
  cardBorder: 'rgba(255,200,150,0.1)',
  textMain: '#fef3c7',
  textDim: 'rgba(255,237,213,0.5)',
  textFaint: 'rgba(255,237,213,0.3)',
  glowOrange: 'rgba(249,115,22,0.08)',
  glowPink: 'rgba(236,72,153,0.05)',
};

/* ---------- SVG 图标 ---------- */
type IconProps = { size?: number; color?: string; style?: React.CSSProperties };

const BackIcon = ({ size = 18, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const SendIcon = ({ size = 18, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const PencilIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);
const CheckIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const FlameIcon = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const AlertIcon = ({ size = 14, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const SparklesIcon = ({ size = 14, color = 'currentColor', style, spinning }: IconProps & { spinning?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ ...style, animation: spinning ? 'spin 2s linear infinite' : undefined }}>
    <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />
  </svg>
);
const PenIcon = ({ size = 18, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const GaugeIcon = ({ size = 18, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 18a9 9 0 1 1 18 0" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="8" y1="18" x2="8" y2="15" /><line x1="16" y1="18" x2="16" y2="15" />
  </svg>
);
const QuestionIcon = ({ size = 18, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const CompassIcon = ({ size = 18, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const FlagIcon = ({ size = 18, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

/* ---------- Markdown 样式 ---------- */
const markdownStyles = `
  .advice-md p { margin: 0 0 10px 0; }
  .advice-md p:last-child { margin-bottom: 0; }
  .advice-md strong { font-weight: 600; color: ${C.textMain}; }
  .advice-md em { font-style: italic; color: rgba(255,237,213,0.7); }
  .advice-md ul, .advice-md ol { margin: 8px 0; padding-left: 20px; }
  .advice-md li { margin: 4px 0; }
  .advice-md h1, .advice-md h2, .advice-md h3 { margin: 14px 0 8px 0; font-size: 15px; font-weight: 600; color: ${C.textMain}; }
  .advice-md blockquote { border-left: 2px solid ${C.primary}; margin: 8px 0; padding-left: 14px; color: ${C.textDim}; }
  .advice-md code { background: rgba(249,115,22,0.15); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #fdba74; }
  .advice-md hr { border: none; border-top: 1px solid ${C.cardBorder}; margin: 12px 0; }
  .advice-md a { color: #fb923c; text-decoration: underline; }
`;

/* ---------- 站点定义 ---------- */
type StationId = 'message' | 'emotion' | 'questions' | 'advice' | 'decision';
type StationStatus = 'done' | 'active' | 'pending';
interface StationDef {
  id: StationId; title: string; subtitle: string;
  icon: (color: string) => React.ReactNode;
}
const STATIONS: StationDef[] = [
  { id: 'message', title: '写下消息', subtitle: '你想发什么？', icon: (c) => <PenIcon size={18} color={c} /> },
  { id: 'emotion', title: '情绪检测', subtitle: '军师在感受你的状态', icon: (c) => <GaugeIcon size={18} color={c} /> },
  { id: 'questions', title: '三个反思', subtitle: '想清楚再决定', icon: (c) => <QuestionIcon size={18} color={c} /> },
  { id: 'advice', title: '军师建议', subtitle: '听完再决定', icon: (c) => <CompassIcon size={18} color={c} /> },
  { id: 'decision', title: '最终决定', subtitle: '你的选择', icon: (c) => <FlagIcon size={18} color={c} /> },
];

/* ---------- 情绪仪表盘 ---------- */
function EmotionGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 7 ? '#ef4444' : score >= 4 ? '#f59e0b' : '#10b981';
  const desc = score >= 7 ? '情绪很高涨，建议先深呼吸，别急着发' : score >= 4 ? '有点焦虑，想清楚再决定也不迟' : '情绪比较平稳，你可以理性判断';
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 10) * circ;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={radius} fill="none" stroke={C.cardBorder} strokeWidth="4" />
          <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 8px ${color}66)` }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ color: C.textMain, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{score}</div>
          <div style={{ color: C.textFaint, fontSize: 9, marginTop: 2 }}>/ 10</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {score >= 7 && <FlameIcon size={16} color={color} />}
          {score >= 4 && score < 7 && <AlertIcon size={14} color={color} />}
          {score < 4 && <CheckIcon size={16} color={color} />}
          <span style={{ color: C.textMain, fontSize: 16, fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ---------- 步进式三问 ---------- */
function SteppedQuestions({ questions, onComplete, disabled }: { questions: AnalysisQuestion[]; onComplete: (answers: string[]) => void; disabled: boolean }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [customValues, setCustomValues] = useState<string[]>(new Array(questions.length).fill(''));
  const total = questions.length;
  const q = questions[current];
  const selected = answers[current];
  const customVal = customValues[current];
  const isCustom = selected === '__custom__';
  const canNext = selected && (!isCustom || customVal.trim().length > 0);

  const handleNext = () => {
    if (isCustom) { const n = [...answers]; n[current] = customVal.trim(); setAnswers(n); }
    if (current < total - 1) { setCurrent(current + 1); }
    else { onComplete(answers.map((a, i) => (a === '__custom__' ? customValues[i] : a))); }
  };
  const handleSelect = (val: string) => { const n = [...answers]; n[current] = val; setAnswers(n); };
  const handleCustomChange = (val: string) => {
    const n = [...customValues]; n[current] = val; setCustomValues(n);
    if (answers[current] !== '__custom__') { const a = [...answers]; a[current] = '__custom__'; setAnswers(a); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        {questions.map((_, i) => (
          <div key={i} style={{ width: i === current ? 36 : 8, height: 8, borderRadius: 4, background: i <= current ? C.primary : C.cardBorder, transition: 'all 0.3s ease' }} />
        ))}
        <span style={{ color: C.textDim, fontSize: 13, marginLeft: 8 }}>{current + 1} / {total}</span>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: 'rgba(249,115,22,0.15)', color: '#fdba74', fontSize: 12, fontWeight: 500, marginBottom: 12 }}>
          问题 {current + 1}
        </div>
        <h3 style={{ color: C.textMain, fontSize: 18, fontWeight: 600, margin: '0 0 6px 0', lineHeight: 1.4 }}>{q.q}</h3>
        {q.hint && <div style={{ color: C.textFaint, fontSize: 13 }}>{q.hint}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {q.options.map((opt, idx) => {
          const sel = selected === opt;
          return (
            <div key={idx} onClick={() => !disabled && handleSelect(opt)} style={{
              padding: '14px 16px', borderRadius: 14, border: sel ? `1px solid ${C.primary}` : `1px solid ${C.cardBorder}`,
              background: sel ? 'rgba(249,115,22,0.1)' : 'rgba(255,200,150,0.02)', cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1, transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel ? C.primary : C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary }} />}
              </div>
              <span style={{ color: sel ? C.textMain : C.textDim, fontSize: 15, flex: 1 }}>{opt}</span>
            </div>
          );
        })}
        <div onClick={() => !disabled && handleSelect('__custom__')} style={{
          padding: '14px 16px', borderRadius: 14, border: isCustom ? `1px solid ${C.primary}` : `1px dashed ${C.cardBorder}`,
          background: isCustom ? 'rgba(249,115,22,0.1)' : 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isCustom ? C.primary : C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isCustom && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isCustom ? '#fdba74' : C.textFaint, fontSize: 15 }}>
            <PencilIcon size={14} color={isCustom ? '#fdba74' : C.textFaint} /> 都不是，我想自己说
          </div>
        </div>
        {isCustom && (
          <TextArea rows={3} value={customVal} onChange={(e) => handleCustomChange(e.target.value)} placeholder="说说你真实的想法..." disabled={disabled} maxLength={200} showCount
            style={{ borderRadius: 12, resize: 'none', background: 'rgba(255,200,150,0.03)', borderColor: C.cardBorder, color: C.textMain }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button onClick={() => current > 0 && setCurrent(current - 1)} disabled={current === 0 || disabled} style={{
          padding: '12px 24px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: 'transparent',
          color: C.textDim, fontSize: 15, cursor: current === 0 || disabled ? 'not-allowed' : 'pointer', opacity: current === 0 || disabled ? 0.4 : 1, transition: 'all 0.2s ease',
        }}>上一题</button>
        <button onClick={handleNext} disabled={!canNext || disabled} style={{
          padding: '12px 32px', borderRadius: 12, border: 'none',
          background: canNext && !disabled ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : C.cardBorder,
          color: canNext && !disabled ? '#fff' : C.textFaint, fontSize: 15, fontWeight: 500,
          cursor: canNext && !disabled ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease',
          boxShadow: canNext && !disabled ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
        }}>{current === total - 1 ? '想好了' : '下一题'}</button>
      </div>
    </div>
  );
}

/* ---------- 决策卡片 ---------- */
function DecisionCard({ onChoose, disabled }: { onChoose: (c: 'skip' | 'edit' | 'send' | 'think') => void; disabled: boolean }) {
  const choices = [
    { key: 'skip', title: '不发了', desc: '冷静下来了，觉得没必要', color: '#10b981' },
    { key: 'edit', title: '改改再发', desc: '语气缓和一点，说清楚就行', color: '#f59e0b' },
    { key: 'send', title: '还是想发', desc: '我想清楚了，发了不后悔', color: '#ef4444' },
    { key: 'think', title: '再想想', desc: '继续和军师聊聊', color: '#8b5cf6' },
  ] as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {choices.map((c) => (
        <div key={c.key} onClick={() => !disabled && onChoose(c.key)} style={{
          padding: '16px 18px', borderRadius: 14, border: `1px solid ${c.color}33`, background: 'rgba(255,200,150,0.03)',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 14,
        }}
          onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = `${c.color}88`; e.currentTarget.style.background = `${c.color}0a`; } }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.color}33`; e.currentTarget.style.background = 'rgba(255,200,150,0.03)'; }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
          </div>
          <div>
            <div style={{ color: C.textMain, fontSize: 15, fontWeight: 600 }}>{c.title}</div>
            <div style={{ color: C.textDim, fontSize: 13, marginTop: 2 }}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 底部输入栏 ---------- */
function ChatInputBar({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('');
  const handleSend = () => { if (!value.trim()) return; onSend(value.trim()); setValue(''); };
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 28px', background: `linear-gradient(to top, ${C.bg} 60%, transparent)`, display: 'flex', gap: 10, zIndex: 100, maxWidth: 760, margin: '0 auto' }}>
      <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder={disabled ? '军师正在思考...' : '继续和军师聊聊？'} disabled={disabled}
        style={{ flex: 1, padding: '14px 20px', borderRadius: 24, border: `1px solid ${C.cardBorder}`, background: 'rgba(255,200,150,0.05)', backdropFilter: 'blur(20px)', color: C.textMain, fontSize: 15, outline: 'none', transition: 'border-color 0.2s ease' }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(249,115,22,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = C.cardBorder)} />
      <button onClick={handleSend} disabled={disabled || !value.trim()} style={{
        width: 48, height: 48, borderRadius: '50%', border: 'none',
        background: disabled || !value.trim() ? C.cardBorder : `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
        color: '#fff', cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: disabled || !value.trim() ? 'none' : '0 4px 20px rgba(249,115,22,0.3)',
      }}><SendIcon size={18} color="#fff" /></button>
    </div>
  );
}

/* ---------- 主页面 ---------- */
type Phase = 'analyzing' | 'questions' | 'advising' | 'decision' | 'chatting';

export function InterceptPage() {
  const navigate = useNavigate();
  const { pendingMessage, chatMessages, currentAIMessage, isAITyping, addUserMessage, appendAIText, setAIMessage, setAITyping, startChat, resetChat } = useAppStore();
  const [analysis, setAnalysis] = useState<AnalysisFrame | null>(null);
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [showDecision, setShowDecision] = useState(false);
  const [adviceDone, setAdviceDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, currentAIMessage, phase, analysis]);

  useEffect(() => {
    if (!pendingMessage) { navigate('/', { replace: true }); return; }
    resetChat(); setAnalysis(null); setPhase('analyzing'); setShowDecision(false);
    addUserMessage(pendingMessage); startChat(); setAIMessage(''); setAITyping(true);
    streamInterceptChat(pendingMessage, (f) => setAnalysis(f), (t) => appendAIText(t), () => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
      setPhase('questions');
    }).catch(() => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
      setPhase('questions'); message.error('AI 暂时没回应，你可以先回答这三个问题');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage]);

  const handleQuestionsComplete = (answers: string[]) => {
    if (!analysis?.questions || analysis.questions.length === 0) return;
    setPhase('advising'); setAdviceDone(false);
    const lines = answers.map((ans, i) => `${i + 1}. ${analysis.questions?.[i]?.q ?? `问题${i + 1}`}\n   我的回答：${ans}`);
    addUserMessage(`我想了想这三个问题：\n\n${lines.join('\n\n')}\n\n你帮我分析分析。`.trim());
    setAIMessage(''); setAITyping(true);
    streamInterceptAnswer(analysis.id!, answers, useAppStore.getState().chatMessages, (t) => appendAIText(t), () => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
      setAdviceDone(true);
    }).catch(() => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
      setAdviceDone(true); message.error('AI 暂时没回应，你可以先做选择');
    });
  };

  const handleAdviceRead = () => {
    setPhase('decision'); setShowDecision(true);
  };

  const handleDecision = (choice: 'skip' | 'edit' | 'send' | 'think') => {
    if (choice === 'think') { setPhase('chatting'); setShowDecision(false); return; }
    const labels: Record<string, string> = { skip: '我决定不发了', edit: '我决定改改再发', send: '我还是想发' };
    addUserMessage(labels[choice] ?? choice); setShowDecision(false); setAIMessage(''); setAITyping(true); setPhase('chatting');
    streamInterceptAnswer(analysis!.id!, [], useAppStore.getState().chatMessages, (t) => appendAIText(t), () => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
    }).catch(() => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
      message.error('AI 暂时没回应');
    });
  };

  const handleContinueSend = (text: string) => {
    if (!text.trim()) return;
    addUserMessage(text.trim()); setAIMessage(''); setAITyping(true); setShowDecision(false); setPhase('chatting');
    streamInterceptAnswer(analysis!.id!, [], useAppStore.getState().chatMessages, (t) => appendAIText(t), () => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
    }).catch(() => {
      setAITyping(false); const s = useAppStore.getState();
      if (s.currentAIMessage) { s.addAIMessage(s.currentAIMessage); setAIMessage(''); }
      message.error('AI 暂时没回应，请重试');
    });
  };

  if (!pendingMessage) return null;

  const getStationStatus = (id: StationId): StationStatus => {
    const idx = STATIONS.findIndex((s) => s.id === id);
    if (phase === 'analyzing') return idx === 0 ? 'active' : 'pending';
    if (phase === 'questions') return idx <= 1 ? 'done' : idx === 2 ? 'active' : 'pending';
    if (phase === 'advising') return idx <= 2 ? 'done' : idx === 3 ? 'active' : 'pending';
    if (phase === 'decision') return idx <= 3 ? 'done' : idx === 4 ? 'active' : 'pending';
    return 'done';
  };

  const currentStationId = phase === 'analyzing' ? 'message' : phase === 'questions' ? 'questions' : phase === 'advising' ? 'advice' : 'decision';
  const currentStationIdx = STATIONS.findIndex((s) => s.id === currentStationId);
  const progressHeight = `${(currentStationIdx / (STATIONS.length - 1)) * 100}%`;

  const aiAdviceContent = chatMessages.filter((m) => m.role === 'assistant').map((m) => m.content).join('\n\n---\n\n');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 背景光晕 */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '45%', height: '45%', background: `radial-gradient(circle, ${C.glowOrange} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: '45%', height: '45%', background: `radial-gradient(circle, ${C.glowPink} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* 顶部栏 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', background: 'rgba(26,19,8,0.8)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.cardBorder}`,
      }}>
        <button onClick={() => navigate('/')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.textDim, fontSize: 14, cursor: 'pointer', padding: 0, transition: 'color 0.2s ease',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.textMain)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.textDim)}>
          <BackIcon size={16} /> 返回首页
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SparklesIcon size={14} color={C.primary} />
          <span style={{ color: C.textDim, fontSize: 13 }}>冷静之旅</span>
        </div>
      </div>

      {/* 主体：时间线 + 内容 */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 120px' }}>
        {STATIONS.map((s, i) => {
          const status = getStationStatus(s.id);
          if (status === 'pending') return null;
          const isLast = i === STATIONS.length - 1;
          const nodeColor = status === 'done' ? C.primary : status === 'active' ? '#fb923c' : C.cardBorder;

          return (
            <div key={s.id} style={{ display: 'flex', marginBottom: isLast ? 0 : 40, animation: status === 'active' ? 'fadeInUp 0.5s ease' : 'none' }}>
              {/* 左侧：时间线节点列 */}
              <div style={{ flexShrink: 0, width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* 节点上半段线 */}
                <div style={{ width: 2, flex: i === 0 ? '0 0 0px' : '1 1 0', background: i === 0 ? 'transparent' : C.cardBorder }} />
                {/* 节点圆 */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: C.bg, border: `2px solid ${nodeColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1,
                    boxShadow: status === 'active' ? `0 0 16px ${nodeColor}44` : 'none', transition: 'all 0.3s ease',
                  }}>
                    {status === 'done' ? <CheckIcon size={16} color="#fff" /> : s.icon(nodeColor)}
                  </div>
                  {status === 'active' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderRadius: '50%', border: `2px solid ${nodeColor}`, animation: 'pulseRing 2s infinite' }} />
                  )}
                </div>
                {/* 节点下半段线 */}
                <div style={{ width: 2, flex: isLast ? '0 0 0px' : '1 1 0', background: isLast ? 'transparent' : C.cardBorder }} />
              </div>

              {/* 右侧：内容区 */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4, opacity: status === 'active' ? 1 : 0.75, transition: 'opacity 0.4s ease', paddingTop: 0 }}>
                {/* 站点标题 */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: status === 'done' ? C.textFaint : C.textMain, fontSize: 16, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ color: C.textFaint, fontSize: 13 }}>{status === 'done' ? '已完成' : s.subtitle}</div>
                </div>

                {/* 站点内容卡片 */}
                <div style={{ padding: '20px 24px', borderRadius: 16, background: C.cardBg, border: `1px solid ${C.cardBorder}`, backdropFilter: 'blur(20px)' }}>
                  {/* 站点1：消息 */}
                  {s.id === 'message' && (
                    <div>
                      <div style={{ color: C.textFaint, fontSize: 12, marginBottom: 8 }}>你想发的消息</div>
                      <div style={{
                        padding: '14px 18px', borderRadius: '12px 12px 12px 4px',
                        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                        color: '#fff', fontSize: 15, lineHeight: 1.65, whiteSpace: 'pre-wrap', boxShadow: '0 4px 20px rgba(249,115,22,0.2)',
                      }}>{pendingMessage}</div>
                      {phase === 'analyzing' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: C.textDim, fontSize: 13 }}>
                          <SparklesIcon size={14} color={C.primary} spinning /> 军师正在分析...
                        </div>
                      )}
                    </div>
                  )}

                  {/* 站点2：情绪 */}
                  {s.id === 'emotion' && analysis && <EmotionGauge score={analysis.emotion_score} label={analysis.emotion_label} />}

                  {/* 站点3：三问 */}
                  {s.id === 'questions' && status === 'active' && analysis?.questions && analysis.questions.length > 0 && (
                    <SteppedQuestions questions={analysis.questions} onComplete={handleQuestionsComplete} disabled={isAITyping} />
                  )}
                  {s.id === 'questions' && status === 'done' && <div style={{ color: C.textDim, fontSize: 14 }}>已完成三个反思问题</div>}

                  {/* 站点4：军师建议 */}
                  {s.id === 'advice' && status === 'active' && (
                    <div>
                      {isAITyping && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <SparklesIcon size={16} color={C.primary} spinning />
                          <span style={{ color: C.textDim, fontSize: 14 }}>军师正在思考...</span>
                        </div>
                      )}
                      {currentAIMessage && isAITyping && (
                        <div className="advice-md" style={{ color: 'rgba(255,237,213,0.85)', fontSize: 15, lineHeight: 1.65 }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentAIMessage}</ReactMarkdown>
                          <span style={{ display: 'inline-block', width: 7, height: 16, background: C.primary, marginLeft: 3, verticalAlign: 'text-bottom', borderRadius: 1, animation: 'blink 1s infinite' }} />
                        </div>
                      )}
                      {!isAITyping && aiAdviceContent && (
                        <div className="advice-md" style={{ color: 'rgba(255,237,213,0.85)', fontSize: 15, lineHeight: 1.65 }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAdviceContent}</ReactMarkdown>
                        </div>
                      )}
                      {adviceDone && (
                        <button onClick={handleAdviceRead} style={{
                          marginTop: 20, width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                          color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer',
                          boxShadow: '0 4px 20px rgba(249,115,22,0.3)', transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          <CheckIcon size={16} color="#fff" />
                          我看完了，做决定
                        </button>
                      )}
                      <style>{markdownStyles}</style>
                    </div>
                  )}
                  {s.id === 'advice' && status === 'done' && aiAdviceContent && (
                    <div className="advice-md" style={{ color: 'rgba(255,237,213,0.7)', fontSize: 15, lineHeight: 1.65 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAdviceContent}</ReactMarkdown>
                      <style>{markdownStyles}</style>
                    </div>
                  )}

                  {/* 站点5：决定 */}
                  {s.id === 'decision' && status === 'active' && showDecision && <DecisionCard onChoose={handleDecision} disabled={isAITyping} />}
                  {s.id === 'decision' && status === 'done' && <div style={{ color: C.textDim, fontSize: 14 }}>已做出决定</div>}
                </div>

                {/* 聊天阶段：自由对话 */}
                {s.id === 'decision' && phase === 'chatting' && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ color: C.textFaint, fontSize: 12, marginBottom: 12 }}>继续和军师聊聊</div>
                    {chatMessages.slice(2).map((msg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                        {msg.role === 'assistant' && (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                            <SparklesIcon size={14} color="#fff" />
                          </div>
                        )}
                        <div style={{
                          maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: msg.role === 'user' ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : 'rgba(255,200,150,0.05)',
                          border: msg.role === 'user' ? 'none' : `1px solid ${C.cardBorder}`, color: msg.role === 'user' ? '#fff' : 'rgba(255,237,213,0.85)',
                          lineHeight: 1.6, fontSize: 14,
                        }} className={msg.role === 'user' ? '' : 'advice-md'}>
                          {msg.role === 'user' ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
                        </div>
                      </div>
                    ))}
                    {isAITyping && currentAIMessage && (
                      <div style={{ display: 'flex', marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                          <SparklesIcon size={14} color="#fff" />
                        </div>
                        <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,200,150,0.05)', border: `1px solid ${C.cardBorder}`, color: 'rgba(255,237,213,0.85)', lineHeight: 1.6, fontSize: 14 }}>
                          <span style={{ whiteSpace: 'pre-wrap' }}>{currentAIMessage}</span>
                          <span style={{ display: 'inline-block', width: 7, height: 14, background: C.primary, marginLeft: 3, verticalAlign: 'text-bottom', borderRadius: 1, animation: 'blink 1s infinite' }} />
                        </div>
                      </div>
                    )}
                    <style>{markdownStyles}</style>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* 底部输入栏 */}
      {(phase === 'chatting' || phase === 'decision') && <ChatInputBar onSend={handleContinueSend} disabled={isAITyping} />}

      {/* 动画 */}
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.cardBorder}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,150,0.2); }
      `}</style>
    </div>
  );
}
