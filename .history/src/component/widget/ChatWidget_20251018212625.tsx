import { useEffect, useRef, useState } from 'react';
import { Minimize2, Loader2 } from 'lucide-react';
import { WidgetConfig, Message } from '../../types/widget';
import { LanguageCode, DEFAULT_LANGUAGE } from '../../config/languages';
import { sarvamService } from '../../services/sarvamService';
import { supabase } from '../../utils/supabase';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { LanguageSelector } from './LanguageSelector';

interface ChatWidgetProps {
  config: WidgetConfig;
  onClose: () => void;
}

export function ChatWidget({ config, onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    config.defaultLanguage || DEFAULT_LANGUAGE
  );
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const primaryColor = config.theme?.primaryColor || '#4F46E5';
  const agentName = config.agent?.name || 'Assistant';
  const agentAvatar = config.agent?.avatar;
  const enableVoice = config.enableVoice !== false;
  const context = config.context || 'You are a helpful assistant.';

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: getWelcomeMessage(currentLanguage),
      timestamp: new Date(),
      isVoice: false,
      language: currentLanguage
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWelcomeMessage = (lang: LanguageCode): string => {
    const welcomeMessages = {
      en: `Hello! I'm ${agentName}. How can I help you today?`,
      hi: `नमस्ते! मैं ${agentName} हूं। मैं आज आपकी कैसे मदद कर सकता हूं?`,
      ta: `வணக்கம்! நான் ${agentName}. இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?`
    };
    return welcomeMessages[lang] || welcomeMessages.en;
  };

  const saveMessage = async (message: Message) => {
    if (config.configId) {
      try {
        await supabase.from('widget_conversations').insert({
          widget_config_id: config.configId,
          session_id: sessionId,
          message: message.content,
          role: message.role,
          language: message.language,
          is_voice: message.isVoice
        });
      } catch (error) {
        console.error('Error saving message:', error);
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      isVoice: false,
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await sarvamService.chat(content, context, currentLanguage);

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        isVoice: false,
        language: currentLanguage
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isVoice: false,
        language: currentLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    setIsLoading(true);

    try {
      const transcription = await sarvamService.speechToText(audioBlob, currentLanguage);

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: transcription,
        timestamp: new Date(),
        isVoice: true,
        language: currentLanguage
      };

      setMessages(prev => [...prev, userMessage]);
      await saveMessage(userMessage);

      const response = await sarvamService.chat(transcription, context, currentLanguage);

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        isVoice: true,
        language: currentLanguage
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);

      const audioContent = await sarvamService.textToSpeech(response, currentLanguage);
      if (audioContent) {
        const audio = new Audio(`data:audio/wav;base64,${audioContent}`);
        audio.play().catch(err => console.error('Error playing audio:', err));
      }
    } catch (error) {
      console.error('Error processing voice message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    const langChangeMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: getWelcomeMessage(lang),
      timestamp: new Date(),
      isVoice: false,
      language: lang
    };
    setMessages(prev => [...prev, langChangeMessage]);
  };

  return (
    <div
      className="fixed bottom-24 bg-white rounded-lg shadow-2xl flex flex-col z-[999998] border border-gray-200"
      style={{
        width: '380px',
        height: '600px',
        maxHeight: 'calc(100vh - 120px)',
        [config.position?.includes('right') ? 'right' : 'left']: '24px'
      }}
    >
      <div
        className="flex items-center justify-between p-4 border-b border-gray-200 rounded-t-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          {agentAvatar ? (
            <img src={agentAvatar} alt={agentName} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-medium">{agentName[0]}</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{agentName}</h3>
            <p className="text-xs text-white/80">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            primaryColor="#FFFFFF"
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Minimize chat"
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.map(message => (
          <ChatMessage
            key={message.id}
            message={message}
            agentName={agentName}
            agentAvatar={agentAvatar}
            primaryColor={primaryColor}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{agentName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onVoiceMessage={handleVoiceMessage}
        isLoading={isLoading}
        enableVoice={enableVoice}
        primaryColor={primaryColor}
        placeholder={`Message ${agentName}...`}
      />
    </div>
  );
}
