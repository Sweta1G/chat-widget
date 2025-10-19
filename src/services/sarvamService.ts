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

    // Try multiple API configurations based on Sarvam docs
    const apiConfigs = [
      {
        name: 'Sarvam Chat API (api-subscription-key)',
        url: `${SARVAM_BASE_URL}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey
        },
        body: {
          model: 'sarvam-m',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: message }
          ]
        }
      },
      {
        name: 'Sarvam Chat API (Authorization Bearer)',
        url: `${SARVAM_BASE_URL}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: {
          model: 'sarvam-m',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: message }
          ]
        }
      },
      {
        name: 'Sarvam Chat API (Gemma 4B)',
        url: `${SARVAM_BASE_URL}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey
        },
        body: {
          model: 'gemma-4b',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: message }
          ]
        }
      },
      {
        name: 'Sarvam Chat API (Gemma 12B)',
        url: `${SARVAM_BASE_URL}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey
        },
        body: {
          model: 'gemma-12b',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: message }
          ]
        }
      }
    ];

    for (const config of apiConfigs) {
      try {
        console.log(`Trying Sarvam API: ${config.name}`);
        
        const response = await fetch(config.url, {
          method: 'POST',
          headers: config.headers,
          body: JSON.stringify(config.body)
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success with ${config.name}:`, data);
          
          // Try different response formats
          const reply = 
            data?.choices?.[0]?.message?.content ||
            data?.message?.content ||
            data?.response ||
            data?.text ||
            data?.translated_text ||
            JSON.stringify(data);
          
          if (reply && reply !== '{}' && reply !== 'null') {
            return reply.trim();
          }
        } else {
          const errorText = await response.text();
          console.warn(`❌ Failed with ${config.name} (${response.status}):`, errorText);
        }
      } catch (error) {
        console.warn(`❌ Error with ${config.name}:`, error);
      }
    }

    console.error('All Sarvam Chat API attempts failed');
    return this.getMockResponse(message, language);
  }

  async textToSpeech(text: string, language: LanguageCode): Promise<string> {
    if (!this.apiKey) {
      return '';
    }

    const languageCode = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : 'ta-IN';
    
    // Try multiple TTS API configurations based on Sarvam docs
    const apiConfigs = [
      {
        name: 'Sarvam TTS API (api-subscription-key)',
        url: `${SARVAM_BASE_URL}/v1/text-to-speech`,
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey
        },
        body: {
          text,
          target_language_code: languageCode,
          speaker: 'anushka',
          enable_preprocessing: true,
          model: 'bulbul:v1'
        }
      },
      {
        name: 'Sarvam TTS API (Authorization Bearer)',
        url: `${SARVAM_BASE_URL}/v1/text-to-speech`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: {
          text,
          language: languageCode,
          speaker: 'meera',
          model: 'bulbul:v1'
        }
      },
      {
        name: 'Sarvam TTS API (Alternative endpoint)',
        url: `${SARVAM_BASE_URL}/text-to-speech`,
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey
        },
        body: {
          text,
          target_language_code: languageCode,
          speaker: 'anushka',
          enable_preprocessing: true
        }
      }
    ];

    for (const config of apiConfigs) {
      try {
        console.log(`Trying Sarvam TTS API: ${config.name}`);
        
        const response = await fetch(config.url, {
          method: 'POST',
          headers: config.headers,
          body: JSON.stringify(config.body)
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ TTS Success with ${config.name}`);
          
          // Try different response formats
          const audioContent = 
            data?.audioContent ||
            data?.audio_content ||
            data?.audio ||
            data?.data ||
            data?.result;
          
          if (audioContent) {
            return audioContent;
          }
        } else {
          const errorText = await response.text();
          console.warn(`❌ TTS Failed with ${config.name} (${response.status}):`, errorText);
        }
      } catch (error) {
        console.warn(`❌ TTS Error with ${config.name}:`, error);
      }
    }

    console.error('All Sarvam TTS API attempts failed');
    return '';
  }

  async speechToText(audioBlob: Blob, language: LanguageCode): Promise<string> {
    if (!this.apiKey) {
      return 'Mock transcription: Hello, this is a test message';
    }

    const languageCode = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : 'ta-IN';
    
    // Try multiple STT API configurations based on Sarvam docs
    const apiConfigs = [
      {
        name: 'Sarvam STT API (api-subscription-key)',
        url: `${SARVAM_BASE_URL}/v1/speech-to-text`,
        headers: {
          'api-subscription-key': this.apiKey
        },
        formData: () => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('language', languageCode);
          formData.append('model', 'saarika:v1');
          return formData;
        }
      },
      {
        name: 'Sarvam STT API (Authorization Bearer)',
        url: `${SARVAM_BASE_URL}/v1/speech-to-text`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        formData: () => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('language', languageCode);
          formData.append('model', 'saarika:v1');
          return formData;
        }
      },
      {
        name: 'Sarvam STT API (Alternative)',
        url: `${SARVAM_BASE_URL}/v1/speech-to-text`,
        headers: {
          'api-subscription-key': this.apiKey
        },
        formData: () => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('source_language_code', languageCode);
          formData.append('model', 'saarika:v1');
          return formData;
        }
      },
      {
        name: 'Sarvam STT API (Alternative endpoint)',
        url: `${SARVAM_BASE_URL}/speech-to-text`,
        headers: {
          'api-subscription-key': this.apiKey
        },
        formData: () => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('source_language_code', languageCode);
          formData.append('model', 'saarika:v1');
          return formData;
        }
      },
      {
        name: 'Sarvam STT API (Alternative v2)',
        url: `${SARVAM_BASE_URL}/v1/speech-to-text`,
        headers: {
          'api-subscription-key': this.apiKey
        },
        formData: () => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('source_language_code', languageCode);
          formData.append('model', 'saarika:v2');
          return formData;
        }
      },
      {
        name: 'Sarvam STT API (saarika:v2.5)',
        url: `${SARVAM_BASE_URL}/speech-to-text`,
        headers: {
          'api-subscription-key': this.apiKey
        },
        formData: () => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('source_language_code', languageCode);
          formData.append('model', 'saarika:v2.5');
          return formData;
        }
      },
      {
        name: 'Sarvam STT API (saarika:flash)',
        url: `${SARVAM_BASE_URL}/speech-to-text`,
        headers: {
          'api-subscription-key': this.apiKey
        },
        formData: () => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('source_language_code', languageCode);
          formData.append('model', 'saarika:flash');
          return formData;
        }
      }
    ];

    for (const config of apiConfigs) {
      try {
        console.log(`Trying Sarvam STT API: ${config.name}`);
        
        const response = await fetch(config.url, {
          method: 'POST',
          headers: config.headers,
          body: config.formData()
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ STT Success with ${config.name}`);
          
          // Try different response formats
          const transcript = 
            data?.transcript ||
            data?.text ||
            data?.transcription ||
            data?.result ||
            data?.data;
          
          if (transcript && transcript.trim()) {
            return transcript.trim();
          }
        } else {
          const errorText = await response.text();
          console.warn(`❌ STT Failed with ${config.name} (${response.status}):`, errorText);
        }
      } catch (error) {
        console.warn(`❌ STT Error with ${config.name}:`, error);
      }
    }

    console.error('All Sarvam STT API attempts failed');
    return 'Error transcribing audio';
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
