

export interface WidgetConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  agent?: {
    name?: string;
    avatar?: string;
  };
  enableVoice?: boolean;
  defaultLanguage?: LanguageCode;
  context?: string;
  configId?: string;
}

export interface Message {
  isVoice: boolean;
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: LanguageCode;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  language: LanguageCode;
}

export type LanguageCode = 'en' | 'hi' | 'ta';

export interface WidgetConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  agent?: {
    name?: string;
    avatar?: string;
  };
  enableVoice?: boolean;
  defaultLanguage?: LanguageCode;
  context?: string;
  configId?: string;
}

// ...existing code...