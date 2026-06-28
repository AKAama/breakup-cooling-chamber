// 单个分析问题（带选项）
export interface AnalysisQuestion {
  q: string;
  hint?: string;
  options: string[];
}

// 情绪分析帧（AI第一帧）
export interface AnalysisFrame {
  type: "analysis";
  emotion_score: number;
  emotion_label: string;
  id?: string;
  questions?: AnalysisQuestion[]; // 第一轮返回3个问题（带选项）
}

// 文本帧（流式输出）
export interface TextFrame {
  type: "text";
  content: string;
}

// 结束帧
export interface DoneFrame {
  type: "done";
  suggestion?: string;
}

// 对话消息
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 拦截结果：AI 返回的 JSON 结构
export interface InterceptResult {
  emotion_score: number; // 1-10
  emotion_label: string; // 冷静 | 焦虑 | 冲动 | 暴怒
  questions: { q: string; hint: string }[];
  suggestion_preview: string;
}

// 拦截记录
export interface InterceptRecord {
  id: string;
  raw_message: string;
  emotion_score: number;
  emotion_label: string;
  questions: string[];
  answers: (string | null)[];
  suggestion: string | null;
  actually_sent: boolean;
  created_at: string;
}

// 盲区分析结果
export interface InsightResult {
  observations: { pattern: string; evidence: string; insight: string }[];
  peak_hours: string;
  frequent_words: string[];
}

// 决策辅助结果
export interface DecideResult {
  sunk_cost: { time: string; emotion: string; summary: string };
  future_expectation: { positives: string[]; risks: string[]; summary: string };
  questions_to_self: string[];
  reminder: string;
}

// 日记
export interface JournalEntry {
  id: string;
  content: string;
  mood: number;
  created_at: string;
}
