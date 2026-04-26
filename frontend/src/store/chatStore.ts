import { create } from 'zustand';
import { initialMessages, type AssistantMessage } from '@/components/dashboard/data';

type ChatState = {
  messages: AssistantMessage[];
  isLoading: boolean;
  sendMessage: (text: string, context?: string) => Promise<void>;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

function formatConversationHistory(messages: AssistantMessage[]): string {
  if (messages.length === 0) return '';
  return messages
    .map((m) => `[${m.role === 'user' ? 'User' : 'Assistant'}]: ${m.text}`)
    .join('\n');
}

function parseSSELines(buffer: string): { events: { event: string; data: string }[]; remaining: string } {
  const events: { event: string; data: string }[] = [];
  const parts = buffer.split('\n\n');
  const remaining = parts.pop()!;

  for (const part of parts) {
    let event = 'message';
    let data = '';
    for (const line of part.split('\n')) {
      if (line.startsWith('event: ')) {
        event = line.slice(7);
      } else if (line.startsWith('data: ')) {
        data = line.slice(6);
      }
    }
    events.push({ event, data });
  }

  return { events, remaining };
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

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: AssistantMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isLoading: true,
    }));

    try {
      const { messages } = get();
      const conversationHistory = formatConversationHistory(
        messages.filter((m) => m.id !== 'welcome')
      );
      const fullContext = [context, conversationHistory].filter(Boolean).join('\n\n');

      const res = await fetch(`${API_BASE}/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: fullContext }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSELines(buffer);
        buffer = remaining;

        for (const { event, data } of events) {
          if (event === 'token') {
            try {
              const parsed = JSON.parse(data);
              if (firstToken) {
                firstToken = false;
                set({ isLoading: false });
              }
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantId
                    ? { ...m, text: m.text + (parsed.content ?? '') }
                    : m
                ),
              }));
            } catch {
              // ignore malformed JSON
            }
          } else if (event === 'done') {
            set({ isLoading: false });
          } else if (event === 'error') {
            try {
              const parsed = JSON.parse(data);
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantId
                    ? { ...m, text: parsed.message || 'Something went wrong.' }
                    : m
                ),
                isLoading: false,
              }));
            } catch {
              set({ isLoading: false });
            }
          }
        }
      }

      set({ isLoading: false });
    } catch {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, text: m.text || 'Sorry, something went wrong. Please try again.' }
            : m
        ),
        isLoading: false,
      }));
    }
  },
}));
