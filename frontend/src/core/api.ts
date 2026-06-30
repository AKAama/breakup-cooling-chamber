import axios from 'axios';
import type {
  DecideResult,
  InsightResult,
  InterceptRecord,
  InterceptResult,
  JournalEntry,
  AnalysisFrame,
  ChatMessage,
} from '../types';

// Axios 实例，baseURL 从环境变量读取。
// 生产构建经 nginx 代理：VITE_API_BASE_URL=/api，前端请求 /api/xxx → 后端 :8080/api/xxx。
// 本地开发回退到 http://localhost:8080/api（后端路由本身带 /api 前缀）。
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// 冲突拦截：POST /api/intercept
export async function postIntercept(message: string): Promise<InterceptResult> {
  const { data } = await http.post<InterceptResult>('/intercept', { message });
  return data;
}

// 历史记录：GET /api/records
export async function getHistory(): Promise<InterceptRecord[]> {
  const { data } = await http.get<InterceptRecord[]>('/records');
  return data;
}

// 写日记：POST /api/journal
export async function postJournal(content: string, mood: number): Promise<JournalEntry> {
  const { data } = await http.post<JournalEntry>('/journal', { content, mood });
  return data;
}

// 日记列表：GET /api/journals
export async function getJournals(): Promise<JournalEntry[]> {
  const { data } = await http.get<JournalEntry[]>('/journals');
  return data;
}

// 盲区分析：GET /api/insight
export async function getInsight(): Promise<InsightResult> {
  const { data } = await http.get<InsightResult>('/insight');
  return data;
}

// 7 天报告：GET /api/report（返回 Markdown 字符串）
export async function getReport(): Promise<string> {
  const { data } = await http.get<string>('/report');
  return data;
}

// 决策辅助：POST /api/decide
export async function postDecide(behaviors: string[], context?: string): Promise<DecideResult> {
  const { data } = await http.post<DecideResult>('/decide', { behaviors, context });
  return data;
}

// 流式第一轮对话：发送消息，获取军师分析
export async function streamInterceptChat(
  message: string,
  onAnalysis: (frame: AnalysisFrame) => void,
  onText: (text: string) => void,
  onDone: (suggestion?: string) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/intercept/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error('请求失败');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';
  let doneFired = false;

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 按 \n\n 分割 SSE 事件
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventBlock of events) {
      const lines = eventBlock.split('\n');
      currentEvent = '';
      let dataStr = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          dataStr = line.slice(6).trim();
        }
      }

      if (!dataStr) continue;

      try {
        const parsed = JSON.parse(dataStr);

        // 优先用 event 名判断，其次用 data.type
        if (currentEvent === 'analysis' || parsed.emotion_score !== undefined) {
          onAnalysis(parsed as AnalysisFrame);
        } else if (currentEvent === 'text' || parsed.content) {
          onText(parsed.content);
        } else if (currentEvent === 'done' || parsed.type === 'done') {
          if (!doneFired) {
            doneFired = true;
            onDone(parsed.suggestion);
          }
        }
      } catch {
        // 忽略解析失败
      }
    }
  }

  // 兜底：流读完了但还没触发 done，也手动触发
  if (!doneFired) {
    onDone();
  }
}

// 流式继续对话：用户回答后继续
export async function streamInterceptAnswer(
  id: string,
  answers: string[],
  history: ChatMessage[],
  onText: (text: string) => void,
  onDone: (suggestion?: string) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/intercept/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, answers, history }),
  });

  if (!response.ok) throw new Error('请求失败');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneFired = false;

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 按 \n\n 分割 SSE 事件
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventBlock of events) {
      const lines = eventBlock.split('\n');
      let currentEvent = '';
      let dataStr = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          dataStr = line.slice(6).trim();
        }
      }

      if (!dataStr) continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (currentEvent === 'text' || parsed.content) {
          onText(parsed.content);
        } else if (currentEvent === 'done' || parsed.type === 'done') {
          if (!doneFired) {
            doneFired = true;
            onDone(parsed.suggestion);
          }
        }
      } catch {
        // 忽略解析失败
      }
    }
  }

  // 兜底：流读完了但还没触发 done，也手动触发
  if (!doneFired) {
    onDone();
  }
}

export default http;
