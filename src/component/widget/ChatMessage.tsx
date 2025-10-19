import { Volume2 } from 'lucide-react';
import { Message } from '../../types/widget';

interface ChatMessageProps {
  message: Message;
  agentName: string;
  agentAvatar?: string;
  primaryColor: string;
  onPlayAudio?: () => void;
}

export function ChatMessage({ message, agentName, agentAvatar, primaryColor, onPlayAudio }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            U
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {agentAvatar ? (
              <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-gray-600">{agentName[0]}</span>
            )}
          </div>
        )}
      </div>

      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
        style={isUser ? { backgroundColor: primaryColor } : {}}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          {message.isVoice && !isUser && onPlayAudio && (
            <button
              onClick={onPlayAudio}
              className="mt-2 flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
            >
              <Volume2 className="w-3 h-3" />
              <span>Play audio</span>
            </button>
          )}
        </div>
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
