import { create } from 'zustand';
import { initialMessages, type AssistantMessage } from '@/components/dashboard/data';

type ChatState = {
  messages: AssistantMessage[];
  isLoading: boolean;
  sendMessage: (text: string, context?: string) => Promise<void>;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5000';

function formatConversationHistory(messages: AssistantMessage[]): string {
  if (messages.length === 0) return '';
  return messages
    .map((m) => `[${m.role === 'user' ? 'User' : 'Assistant'}]: ${m.text}`)
    .join('\n');
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [...initialMessages],
  isLoading: false,

  sendMessage: async (text: string, context?: string) => {
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      const { messages } = get();
      const conversationHistory = formatConversationHistory(
        messages.filter((m) => m.id !== 'welcome')
      );
      const fullContext = [context, conversationHistory].filter(Boolean).join('\n\n');

      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: fullContext }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'No response received.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch {
      const errorMessage: AssistantMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },
}));
