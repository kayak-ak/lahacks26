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

  return (
    <div className="fixed top-6 right-6 z-50">
      <button
        type="button"
        onClick={toggleSession}
        disabled={isConnecting}
        className={`relative w-14 h-14 rounded-full grid place-items-center transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
          isConnected
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
            : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg'
        }`}
        aria-label={isConnected ? 'Stop voice assistant' : 'Start voice assistant'}
      >
        {isConnecting ? (
          <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : isConnected ? (
          <div className="relative">
            <MicrophoneIcon className="w-6 h-6 text-white" />
            {isSpeaking && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
            )}
          </div>
        ) : (
          <MicrophoneIcon className="w-6 h-6 text-white" />
        )}

        {isConnected && (
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
        )}
      </button>
    </div>
  );
}
