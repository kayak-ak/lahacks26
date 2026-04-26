import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { MicrophoneIcon } from './dashboard/icons';

export function VoiceBubble() {
  const {
    status,
    isSpeaking,
    toggleSession,
  } = useVoiceAgent();

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const stateClass = !isConnected && !isConnecting
    ? 'voice-bubble-static'
    : isSpeaking
      ? 'voice-bubble-speaking'
      : '';

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`relative w-14 h-14 rounded-full overflow-hidden ${stateClass}`}>
        <div className="voice-bubble-bg absolute inset-0" />
        <div className="voice-bubble-overlay absolute inset-0" />

        <button
          type="button"
          onClick={toggleSession}
          disabled={isConnecting}
          className="absolute inset-0 z-10 rounded-full grid place-items-center bg-black/30 transition-all hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-[#2792dc] focus:ring-offset-2"
          aria-label={isConnected ? 'Stop voice assistant' : 'Start voice assistant'}
        >
          {isConnecting ? (
            <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <MicrophoneIcon className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}