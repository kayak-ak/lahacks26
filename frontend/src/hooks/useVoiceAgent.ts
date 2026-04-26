import { useConversation } from '@elevenlabs/react';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string;

export function useVoiceAgent() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs'),
    onDisconnect: () => console.log('Disconnected from ElevenLabs'),
    onError: (error) => console.error('ElevenLabs error:', error),
  });

  const startSession = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId: AGENT_ID });
    } catch (err) {
      console.error('Failed to start voice session:', err);
    }
  };

  const endSession = () => {
    conversation.endSession();
  };

  const toggleSession = () => {
    if (conversation.status === 'connected') {
      endSession();
    } else {
      startSession();
    }
  };

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isListening: conversation.isListening,
    isMuted: conversation.isMuted,
    setMuted: conversation.setMuted,
    toggleSession,
    startSession,
    endSession,
    getOutputByteFrequencyData: conversation.getOutputByteFrequencyData,
  };
}