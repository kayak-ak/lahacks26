import { useMemo, useState } from 'react';
import type { AssistantMessage, Room } from './data';
import { PaperclipIcon, SendIcon, SparkleIcon } from './icons';

type AssistantSidebarProps = {
  messages: AssistantMessage[];
  selectedRoom: Room;
};

function formatRoomPrompt(room: Room) {
  if (room.patient) {
    return `${room.id} selected. ${room.patient} is currently marked ${room.status}. ${room.cameraLabel}.`;
  }

  return `${room.id} selected. The room is currently ${room.status}. ${room.cameraLabel}.`;
}

export function AssistantSidebar({
  messages,
  selectedRoom,
}: AssistantSidebarProps) {
  const [draft, setDraft] = useState('');

  const placeholder = useMemo(() => formatRoomPrompt(selectedRoom), [selectedRoom]);
  const sendDisabled = draft.trim().length === 0;

  return (
    <aside className="assistant-sidebar">
      <div className="assistant-sidebar__header">
        <div className="assistant-sidebar__avatar" aria-hidden="true">
          <SparkleIcon className="assistant-sidebar__avatar-icon" />
        </div>
        <div>
          <h2>AI Assistant</h2>
          <p>Clinical Coordination</p>
        </div>
      </div>

      <div className="assistant-sidebar__body">
        {messages.map((message) => (
          <article key={message.id} className="assistant-message">
            <p>{message.text}</p>
            <time>{message.time}</time>
          </article>
        ))}

        <article className="assistant-message assistant-message--selected">
          <p>{placeholder}</p>
          <time>Live</time>
        </article>
      </div>

      <form className="assistant-sidebar__composer" onSubmit={(event) => event.preventDefault()}>
        <button type="button" className="icon-button icon-button--muted" aria-label="Attach context">
          <PaperclipIcon className="icon-button__icon" />
        </button>

        <label className="composer-input">
          <span className="sr-only">Message</span>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type your message..."
          />
        </label>

        <button
          type="submit"
          className={`icon-button icon-button--send${sendDisabled ? ' icon-button--send-disabled' : ''}`}
          aria-label="Send message"
          disabled={sendDisabled}
        >
          <SendIcon className="icon-button__icon" />
        </button>
      </form>
    </aside>
  );
}
