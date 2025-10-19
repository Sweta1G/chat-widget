export interface WidgetConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: {
    primaryColor?: string;
  };
  agent?: {
    name?: string;
    avatar?: string;
  };
  enableVoice?: boolean;
  context?: string;
  defaultLanguage?: 'en' | 'hi' | 'ta';
  configId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice: boolean;
  language: string;
}

export type WidgetMode = 'chat' | 'voice';

export interface WidgetState {
  isOpen: boolean;
  mode: WidgetMode;
  messages: Message[];
  isLoading: boolean;
  currentLanguage: string;
}
