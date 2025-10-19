// Allow TypeScript to recognize the widget config on window
type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type LanguageCode = 'en' | 'hi' | 'ta';

interface WidgetTheme {
  primaryColor?: string;
  fontFamily?: string;
}
interface AgentInfo {
  name?: string;
  avatar?: string;
}
interface WidgetConfig {
  position?: Position;
  theme?: WidgetTheme;
  agent?: AgentInfo;
  enableVoice?: boolean;
  defaultLanguage?: LanguageCode;
  context?: string;
}
interface Window {
  AgentWidgetConfig?: WidgetConfig;
  __AgentWidgetInitialized?: boolean;
}