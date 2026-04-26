import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/store/chatStore';
import type { Room } from './data';
import { PaperclipIcon, SendIcon, SparkleIcon } from './icons';
import { MarkdownContent } from './MarkdownContent';

type AssistantSidebarProps = {
  selectedRoom: Room | null;
  onWidthChange: (width: number) => void;
  onDeselectRoom: () => void;
};

function formatRoomPrompt(room: Room) {
  if (room.patient) {
    return `${room.id} selected. ${room.patient} is currently marked ${room.status}. ${room.cameraLabel}.`;
  }

  return `${room.id} selected. The room is currently ${room.status}. ${room.cameraLabel}.`;
}

export function AssistantSidebar({
  selectedRoom,
  onWidthChange,
  onDeselectRoom,
}: AssistantSidebarProps) {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const sendDisabled = draft.trim().length === 0 || isLoading || !selectedRoom;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = (e.currentTarget.parentElement as HTMLElement)?.offsetWidth ?? 300;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - ev.clientX;
      const newWidth = Math.max(220, Math.min(600, startWidth.current + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [onWidthChange]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    const maxHeight = lineHeight * 4 + 16; // 4 lines + padding
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (sendDisabled) return;
    const text = draft.trim();
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendMessage(text, formatRoomPrompt(selectedRoom!));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <aside className="relative grid grid-rows-[auto_1fr_auto] min-h-full bg-white/80 border-l border-border/40 backdrop-blur-md">
      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/30 active:bg-blue-400/50 transition-colors z-10"
        onMouseDown={handleMouseDown}
      />
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border/40 bg-gradient-to-b from-blue-50/50 to-transparent">
        <div className="grid place-items-center w-10 h-10 rounded-[18px] text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
          <SparkleIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="m-0 text-[1.75rem] leading-[1.1] text-slate-900">Siren</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 p-6 overflow-y-auto overflow-x-hidden" style={{ minWidth: 0 }}>
        {messages.map((message) => {
          const isUser = message.role === 'user';
          if (!isUser && message.text === '') return null;
          return (
            <div key={message.id} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
              <Card className={cn(
                "max-w-[85%] p-2.5 rounded-2xl shadow-sm border-transparent",
                isUser 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 text-slate-800 border-slate-200/50"
              )}>
                {isUser ? (
                  <p className="m-0 text-sm leading-relaxed">{message.text}</p>
                ) : (
                  <div className="text-sm leading-relaxed">
                    <MarkdownContent content={message.text} />
                  </div>
                )}
              </Card>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex w-full justify-start">
            <Card className="max-w-[85%] p-2.5 bg-slate-100 text-slate-800 rounded-2xl border-slate-200/50 shadow-sm border-transparent">
              <p className="m-0 text-sm leading-relaxed animate-pulse">Thinking...</p>
            </Card>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        className="flex flex-col gap-4 pt-4 pb-10 px-4 border-t bg-background"
        onSubmit={handleSubmit}
      >
        <div className="relative flex items-center">
          <textarea
            ref={textareaRef}
            id="assistant-input"
            value={draft}
            rows={1}
            onChange={(event) => {
              setDraft(event.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full rounded-2xl bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary pr-12 py-2.5 px-3.5 text-sm resize-none overflow-y-auto leading-5 min-h-[42px]"
          />
          <Button
            type="submit"
            size="icon"
            variant="default"
            className="absolute right-3 bottom-1 rounded-full w-8 h-8"
            aria-label="Send message"
            disabled={sendDisabled}
          >
            <SendIcon className="w-4 h-4" />
          </Button>
        </div>

        <Badge
          variant="secondary"
          className={cn(
            "gap-1.5 bg-blue-50 text-blue-700 border-blue-200/60 border border-dashed text-[0.75rem] font-medium self-start pr-1.5",
            !selectedRoom && "invisible"
          )}
        >
          <PaperclipIcon className="w-3 h-3" />
          {selectedRoom ? `${selectedRoom.id}${selectedRoom.patient ? ` · ${selectedRoom.patient}` : ''}` : '—'}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onDeselectRoom(); }}
            className="grid place-items-center w-4 h-4 rounded-full hover:bg-blue-200/60 transition-colors"
            aria-label="Deselect room"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </Badge>
      </form>
    </aside>
  );
}