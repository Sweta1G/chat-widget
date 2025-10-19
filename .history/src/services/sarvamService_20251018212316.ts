import { LanguageCode } from '../config/languages';

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY || '';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

export class SarvamService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || SARVAM_API_KEY;
  }

  async chat(message: string, context: string, language: LanguageCode): Promise<string> {
    if (!this.apiKey) {
      return this.getMockResponse(message, language);
    }

    try {
      const response = await fetch(`${SARVAM_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'sarvam-2b',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: message }
          ],
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not process that.';
    } catch (error) {
      console.error('Sarvam Chat API error:', error);
      return this.getMockResponse(message, language);
    }
  }

  async textToSpeech(text: string, language: LanguageCode): Promise<string> {
    if (!this.apiKey) {
      return '';
    }

    try {
      const response = await fetch(`${SARVAM_BASE_URL}/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          text,
          language,
          speaker: 'meera',
          model: 'bulbul:v1'
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data = await response.json();
      return data.audioContent || '';
    } catch (error) {
      console.error('Sarvam TTS API error:', error);
      return '';
    }
  }

  async speechToText(audioBlob: Blob, language: LanguageCode): Promise<string> {
    if (!this.apiKey) {
      return 'Mock transcription: Hello, this is a test message';
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('language', language);
      formData.append('model', 'saaras:v1');

      const response = await fetch(`${SARVAM_BASE_URL}/v1/speech-to-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`STT API error: ${response.status}`);
      }

      const data = await response.json();
      return data.transcript || '';
    } catch (error) {
      console.error('Sarvam STT API error:', error);
      return 'Error transcribing audio';
    }
  }

  private getMockResponse(message: string, language: LanguageCode): string {
    const responses = {
      en: `Thank you for your message: "${message}". This is a mock response. To enable real AI responses, please add your Sarvam API key.`,
      hi: `आपके संदेश के लिए धन्यवाद: "${message}"। यह एक नमूना प्रतिक्रिया है। वास्तविक AI प्रतिक्रियाओं को सक्षम करने के लिए, कृपया अपनी Sarvam API key जोड़ें।`,
      ta: `உங்கள் செய்திக்கு நன்றி: "${message}". இது ஒரு மாதிரி பதில். உண்மையான AI பதில்களை இயக்க, தயவுசெய்து உங்கள் Sarvam API விசையைச் சேர்க்கவும்.`
    };

    return responses[language] || responses.en;
  }
}

export const sarvamService = new SarvamService();
