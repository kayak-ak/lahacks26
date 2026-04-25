import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatStore } from '@/store/chatStore';
import type { Room } from './data';
import { PaperclipIcon, SendIcon, SparkleIcon } from './icons';

type AssistantSidebarProps = {
  selectedRoom: Room;
};

function formatRoomPrompt(room: Room) {
  if (room.patient) {
    return `${room.id} selected. ${room.patient} is currently marked ${room.status}. ${room.cameraLabel}.`;
  }

  return `${room.id} selected. The room is currently ${room.status}. ${room.cameraLabel}.`;
}

export function AssistantSidebar({
  selectedRoom,
}: AssistantSidebarProps) {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const [draft, setDraft] = useState('');

  const placeholder = useMemo(() => formatRoomPrompt(selectedRoom), [selectedRoom]);
  const sendDisabled = draft.trim().length === 0 || isLoading;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (sendDisabled) return;
    const text = draft.trim();
    setDraft('');
    sendMessage(text, formatRoomPrompt(selectedRoom));
  };

  return (
    <aside className="grid grid-rows-[auto_1fr_auto] min-h-full bg-white/80 border-l border-border/40 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border/40 bg-gradient-to-b from-blue-50/50 to-transparent">
        <div className="grid place-items-center w-10 h-10 rounded-[18px] text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
          <SparkleIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="m-0 text-[1.75rem] leading-[1.1] text-slate-900">AI Assistant</h2>
          <p className="mt-1 mb-0 text-slate-500 text-[0.95rem]">Clinical Coordination</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 p-6 overflow-y-auto">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
              <Card className={cn(
                "max-w-[85%] p-3.5 px-4 pb-3 rounded-2xl shadow-sm border-transparent",
                isUser 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-slate-100 text-slate-800 rounded-tl-sm border-slate-200/50"
              )}>
                <p className="m-0 text-[1.02rem] leading-[1.62]">{message.text}</p>
                <time className={cn("block mt-1 text-[0.86rem] opacity-70")}>{message.time}</time>
              </Card>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex w-full justify-start">
            <Card className="max-w-[85%] p-3.5 px-4 pb-3 bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm border-slate-200/50 shadow-sm border-transparent">
              <p className="m-0 text-[1.02rem] leading-[1.62] animate-pulse">Thinking...</p>
            </Card>
          </div>
        )}

        <div className="flex w-full justify-end">
          <Card className="max-w-[85%] p-3.5 px-4 pb-3 bg-blue-50 text-blue-800 border-blue-200/60 border border-dashed rounded-2xl rounded-tr-sm shadow-none">
            <p className="m-0 text-[1.02rem] leading-[1.62]">{placeholder}</p>
            <time className="block mt-1 text-[0.86rem] opacity-70">Live Context</time>
          </Card>
        </div>
      </div>

      {/* Composer */}
      <form
        className="grid grid-cols-[auto_1fr_auto] gap-2 items-center p-4 border-t bg-background"
        onSubmit={handleSubmit}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Attach context"
        >
          <PaperclipIcon className="w-5 h-5" />
        </Button>

        <Input
          id="assistant-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          className="rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary"
        />

        <Button
          type="submit"
          size="icon"
          variant="default"
          className="rounded-full"
          aria-label="Send message"
          disabled={sendDisabled}
        >
          <SendIcon className="w-5 h-5" />
        </Button>
      </form>
    </aside>
  );
}