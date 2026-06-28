import { create } from 'zustand';
import type { InterceptResult, ChatMessage } from '../types';

interface AppState {
  // 从首页传到拦截页的待分析消息
  pendingMessage: string;
  // 当前拦截结果
  interceptResult: InterceptResult | null;
  // 软锁状态
  isLocked: boolean;
  unlockAt: number | null; // 解锁时间戳（ms）
  lockReason: string;

  // 新增：对话状态
  chatMessages: ChatMessage[]; // 对话历史
  currentAIMessage: string; // 当前AI正在输出的一段文本
  isAITyping: boolean; // AI是否正在打字
  hasStartedChat: boolean; // 是否已开始对话
  pendingAnswers: (string | null)[]; // 用户当前待提交的3个答案

  setPendingMessage: (msg: string) => void;
  setInterceptResult: (r: InterceptResult | null) => void;
  triggerLock: (reason: string, durationMs?: number) => void;
  clearLock: () => void;

  // 新增操作
  addUserMessage: (content: string) => void;
  addAIMessage: (content: string) => void;
  appendAIText: (text: string) => void;
  setAIMessage: (content: string) => void;
  setAITyping: (typing: boolean) => void;
  startChat: () => void;
  setPendingAnswers: (answers: (string | null)[]) => void;
  resetChat: () => void;
}

// 全局状态：当前拦截结果 + 软锁状态 + 对话状态
export const useAppStore = create<AppState>((set) => ({
  // 现有字段
  pendingMessage: '',
  interceptResult: null,
  isLocked: false,
  unlockAt: null,
  lockReason: '',

  // 新增：对话状态初始化
  chatMessages: [],
  currentAIMessage: '',
  isAITyping: false,
  hasStartedChat: false,
  pendingAnswers: [],

  // 现有操作
  setPendingMessage: (msg) => set({ pendingMessage: msg }),
  setInterceptResult: (r) => set({ interceptResult: r }),
  triggerLock: (reason, durationMs = 30 * 60 * 1000) =>
    set({
      isLocked: true,
      lockReason: reason,
      unlockAt: Date.now() + durationMs,
    }),
  clearLock: () => set({ isLocked: false, unlockAt: null, lockReason: '' }),

  // 新增对话操作
  addUserMessage: (content) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { role: 'user', content }],
    })),

  addAIMessage: (content) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { role: 'assistant', content }],
    })),

  appendAIText: (text) =>
    set((state) => ({
      currentAIMessage: state.currentAIMessage + text,
    })),

  setAIMessage: (content) => set({ currentAIMessage: content }),

  setAITyping: (typing) => set({ isAITyping: typing }),

  startChat: () => set({ hasStartedChat: true }),

  setPendingAnswers: (answers) => set({ pendingAnswers: answers }),

  resetChat: () =>
    set({
      chatMessages: [],
      currentAIMessage: '',
      isAITyping: false,
      hasStartedChat: false,
      pendingAnswers: [],
    }),
}));
