import { Send } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onVoiceMessage: (audioBlob: Blob) => void;
  isLoading: boolean;
  enableVoice: boolean;
  primaryColor: string;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onVoiceMessage,
  isLoading,
  enableVoice,
  primaryColor,
  placeholder = 'Type a message...'
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    onVoiceMessage(audioBlob);
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? 'Recording...' : placeholder}
            disabled={isLoading || isRecording}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{
              maxHeight: '120px',
              minHeight: '48px'
            }}
            rows={1}
          />
        </div>

        <div className="flex items-center gap-1">
          {enableVoice && (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              isRecording={isRecording}
              onRecordingStart={() => setIsRecording(true)}
              onRecordingStop={() => setIsRecording(false)}
              primaryColor={primaryColor}
            />
          )}

          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading || isRecording}
            className="p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: message.trim() && !isLoading && !isRecording ? primaryColor : '#E5E7EB'
            }}
            aria-label="Send message"
          >
            <Send className={`w-5 h-5 ${message.trim() && !isLoading && !isRecording ? 'text-white' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
