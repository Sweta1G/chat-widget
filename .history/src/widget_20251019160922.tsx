import type { LanguageCode } from './types/widget';

const LANG_MAP: Record<LanguageCode, { label: string; stt: string; tts: string }> = {
  en: { label: 'English', stt: 'en-IN', tts: 'en-IN' },
  hi: { label: 'हिंदी', stt: 'hi-IN', tts: 'hi-IN' },
  ta: { label: 'தமிழ்', stt: 'ta-IN', tts: 'ta-IN' }
};

const DEFAULTS = {
  position: 'bottom-right',
  theme: { primaryColor: '#4F46E5', fontFamily: 'Inter, system-ui, sans-serif' },
  agent: { name: 'SarvamBot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SarvamBot' },
  enableVoice: true,
  defaultLanguage: 'en',
  context: 'You are a helpful AI assistant.'
};

const merge = (a: any, b: any) => {
  const out = { ...a };
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) out[k] = merge(a[k] || {}, b[k]);
    else out[k] = b[k];
  }
  return out;
};

const CONFIG = merge(DEFAULTS, (window as any).AgentWidgetConfig || {});

async function chat(prompt: string, context: string, lang: LanguageCode): Promise<string> {
  const API_KEY = import.meta.env?.VITE_SARVAM_API_KEY || '';
  
  if (!API_KEY) {
    console.warn('No API key found. Set VITE_SARVAM_API_KEY in .env file');
    return `Demo mode: "${prompt}" - Please add your Sarvam API key to get real AI responses.`;
  }

  console.log('=== SARVAM API REQUEST ===');
  console.log('API Key present:', API_KEY ? `Yes (${API_KEY.substring(0, 15)}...)` : 'No');
  console.log('Language:', lang);
  console.log('Prompt:', prompt);

  const apiConfigs = [
    {
      name: 'Sarvam Chat API (v1)',
      url: 'https://api.sarvam.ai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY
      },
      body: {
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: prompt }
        ]
      }
    },
    {
      name: 'Sarvam Chat API (Authorization Bearer)',
      url: 'https://api.sarvam.ai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: {
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: prompt }
        ]
      }
    },
    {
      name: 'Sarvam Translate + Generate (fallback)',
      url: 'https://api.sarvam.ai/translate',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY
      },
      body: {
        input: prompt,
        source_language_code: LANG_MAP[lang].stt,
        target_language_code: LANG_MAP[lang].stt,
        speaker_gender: 'Male',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true
      }
    }
  ];

  for (const config of apiConfigs) {
    try {
      console.log(`\nTrying: ${config.name}`);
      console.log('URL:', config.url);
      console.log('Headers:', JSON.stringify(config.headers, null, 2));
      console.log('Body:', JSON.stringify(config.body, null, 2));

      const response = await fetch(config.url, {
        method: 'POST',
        headers: Object.fromEntries(
          Object.entries(config.headers).filter(([_, v]) => v !== undefined)
        ) as HeadersInit,
        body: JSON.stringify(config.body)
      });

      console.log('Response Status:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('Response Body:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('✅ SUCCESS with', config.name);
        
        let reply = 
          data?.choices?.[0]?.message?.content ||
          data?.message?.content ||
          data?.response ||
          data?.translated_text ||
          data?.text ||
          JSON.stringify(data);
        
        if (reply && reply !== '{}') {
          reply = reply
            .replace(/\\\(/g, '')
            .replace(/\\\)/g, '')
            .replace(/\\\[/g, '')
            .replace(/\\\]/g, '')
            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
            .replace(/\\text\{([^}]+)\}/g, '$1')
            .replace(/\\\\/g, '')
            .replace(/\\/g, '')
            .trim();
          
          return reply;
        }
      } else {
        console.error(`❌ Failed with status ${response.status}:`, responseText);
      }
    } catch (error) {
      console.error(`❌ Error with ${config.name}:`, error);
    }
  }

  console.log('=== ALL API ATTEMPTS FAILED ===');
  console.log('Please check:');
  console.log('1. Is your API key correct? Current:', (import.meta.env?.VITE_SARVAM_API_KEY || '').substring(0, 15) + '...');
  console.log('2. Visit https://docs.sarvam.ai for API documentation');
  console.log('3. Check if you have API credits/quota remaining');
  console.log('4. Verify your subscription includes chat completions');

  return generateSmartFallback(prompt, lang);
}

function generateSmartFallback(prompt: string, lang: LanguageCode): string {
  const lower = prompt.toLowerCase();
  
  const responses: Record<string, Record<LanguageCode, string>> = {
    greeting: {
      en: "Hello! I'm SarvamBot. I'm currently in offline mode, but I can still help with basic questions. How can I assist you?",
      hi: "नमस्ते! मैं SarvamBot हूं। मैं वर्तमान में ऑफ़लाइन मोड में हूं, लेकिन फिर भी बुनियादी सवालों में मदद कर सकता हूं। मैं आपकी कैसे मदद कर सकता हूं?",
      ta: "வணக்கம்! நான் SarvamBot. நான் தற்போது ஆஃப்லைன் பயன்முறையில் இருக்கிறேன், ஆனால் அடிப்படை கேள்விகளுக்கு இன்னும் உதவ முடியும். நான் உங்களுக்கு எப்படி உதவ முடியும்?"
    },
    identity: {
      en: "I'm SarvamBot, an AI assistant created by Sarvam AI. I can communicate in English, Hindi, and Tamil. I'm designed to help answer questions and have conversations.",
      hi: "मैं SarvamBot हूं, Sarvam AI द्वारा बनाया गया एक AI सहायक। मैं अंग्रेजी, हिंदी और तमिल में संवाद कर सकता हूं। मैं सवालों के जवाब देने और बातचीत करने में मदद के लिए डिज़ाइन किया गया हूं।",
      ta: "நான் SarvamBot, Sarvam AI ஆல் உருவாக்கப்பட்ட ஒரு AI உதவியாளர். நான் ஆங்கிலம், இந்தி மற்றும் தமிழில் தொடர்பு கொள்ள முடியும். கேள்விகளுக்கு பதிலளிக்கவும் உரையாடல்களை நடத்தவும் நான் வடிவமைக்கப்பட்டுள்ளேன்."
    },
    capability: {
      en: "I can help you with:\n• Answering questions\n• Having conversations in multiple languages\n• Providing information on various topics\n• Translating between English, Hindi, and Tamil\n\nNote: I'm currently in offline mode. For full AI capabilities, please ensure the Sarvam API is properly configured.",
      hi: "मैं आपकी इनमें मदद कर सकता हूं:\n• सवालों के जवाब देना\n• कई भाषाओं में बातचीत करना\n• विभिन्न विषयों पर जानकारी प्रदान करना\n• अंग्रेजी, हिंदी और तमिल के बीच अनुवाद करना\n\nनोट: मैं वर्तमान में ऑफ़लाइन मोड में हूं। पूर्ण AI क्षमताओं के लिए, कृपया सुनिश्चित करें कि Sarvam API ठीक से कॉन्फ़िगर किया गया है।",
      ta: "நான் உங்களுக்கு இவற்றில் உதவ முடியும்:\n• கேள்விகளுக்கு பதிலளித்தல்\n• பல மொழிகளில் உரையாடல்கள்\n• பல்வேறு தலைப்புகளில் தகவல் வழங்குதல்\n• ஆங்கிலம், இந்தி மற்றும் தமிழ் இடையே மொழிபெயர்த்தல்\n\nகுறிப்பு: நான் தற்போது ஆஃப்லைன் பயன்முறையில் இருக்கிறேன். முழு AI திறன்களுக்கு, Sarvam API சரியாக உள்ளமைக்கப்பட்டுள்ளதா என்பதை உறுதிப்படுத்தவும்."
    },
    weather: {
      en: "I apologize, but I don't have access to real-time weather data in offline mode. For accurate weather information, please check a weather service or wait until the API connection is restored.",
      hi: "मुझे खेद है, लेकिन ऑफ़लाइन मोड में मेरे पास वास्तविक समय के मौसम डेटा तक पहुंच नहीं है। सटीक मौसम की जानकारी के लिए, कृपया किसी मौसम सेवा की जांच करें या API कनेक्शन बहाल होने तक प्रतीक्षा करें।",
      ta: "மன்னிக்கவும், ஆஃப்லைன் பயன்முறையில் எனக்கு நேரடி வானிலை தரவு அணுகல் இல்லை. துல்லியமான வானிலை தகவலுக்கு, தயவுசெய்து வானிலை சேவையை சரிபார்க்கவும் அல்லது API இணைப்பு மீட்டமைக்கப்படும் வரை காத்திருக்கவும்."
    },
    time: {
      en: `The current time is ${new Date().toLocaleTimeString()}. The date is ${new Date().toLocaleDateString()}.`,
      hi: `वर्तमान समय ${new Date().toLocaleTimeString('hi-IN')} है। तारीख ${new Date().toLocaleDateString('hi-IN')} है।`,
      ta: `தற்போதைய நேரம் ${new Date().toLocaleTimeString('ta-IN')}. தேதி ${new Date().toLocaleDateString('ta-IN')}.`
    },
    thanks: {
      en: "You're welcome! Is there anything else I can help you with?",
      hi: "आपका स्वागत है! क्या कुछ और है जिसमें मैं आपकी मदद कर सकता हूं?",
      ta: "வரவேற்கிறோம்! வேறு ஏதாவது நான் உதவ முடியுமா?"
    }
  };

  if (lower.match(/^(hi|hello|hey|namaste|வணக்கம்|नमस्ते)/)) {
    return responses.greeting[lang];
  }
  if (lower.match(/(who|what|naam|பெயர்|नाम).*(you|are|तुम|நீ)/)) {
    return responses.identity[lang];
  }
  if (lower.match(/(can you|help|capability|क्या.*सकते|திறன்|உதவி)/)) {
    return responses.capability[lang];
  }
  if (lower.match(/(weather|मौसम|வானிலை)/)) {
    return responses.weather[lang];
  }
  if (lower.match(/(time|date|समय|तारीख|நேரம்|தேதி)/)) {
    return responses.time[lang];
  }
  if (lower.match(/(thank|धन्यवाद|நன்றி)/)) {
    return responses.thanks[lang];
  }

  const defaults: Record<LanguageCode, string> = {
    en: `I understand you asked: "${prompt}"\n\nI'm currently in offline mode and cannot access the full AI capabilities. However, I can help with:\n• Basic conversations\n• Language information\n• Time and date\n\nFor complex questions, please check the browser console (F12) to see why the API connection failed, or contact support to verify your Sarvam API configuration.`,
    hi: `मैं समझता हूं कि आपने पूछा: "${prompt}"\n\nमैं वर्तमान में ऑफ़लाइन मोड में हूं और पूर्ण AI क्षमताओं तक पहुंच नहीं सकता। हालांकि, मैं इनमें मदद कर सकता हूं:\n• बुनियादी बातचीत\n• भाषा जानकारी\n• समय और तारीख\n\nजटिल सवालों के लिए, कृपया ब्राउज़र कंसोल (F12) की जांच करें यह देखने के लिए कि API कनेक्शन क्यों विफल रहा, या अपने Sarvam API कॉन्फ़िगरेशन को सत्यापित करने के लिए सहायता से संपर्क करें।`,
    ta: `நீங்கள் கேட்டது எனக்குப் புரிகிறது: "${prompt}"\n\nநான் தற்போது ஆஃப்லைன் பயன்முறையில் இருக்கிறேன் மற்றும் முழு AI திறன்களை அணுக முடியாது. இருப்பினும், நான் இவற்றில் உதவ முடியும்:\n• அடிப்படை உரையாடல்கள்\n• மொழி தகவல்\n• நேரம் மற்றும் தேதி\n\nசிக்கலான கேள்விகளுக்கு, API இணைப்பு ஏன் தோல்வியடைந்தது என்பதைப் பார்க்க உலாவி கன்சோலை (F12) சரிபார்க்கவும், அல்லது உங்கள் Sarvam API உள்ளமைவை சரிபார்க்க ஆதரவைத் தொடர்பு கொள்ளவும்.`
  };

  return defaults[lang];
}

// ---- Voice control: prevent overlapping TTS and mic ----

let currentAudio: HTMLAudioElement | null = null;
let currentUtter: SpeechSynthesisUtterance | null = null;
let currentSpeakAbort: AbortController | null = null;

function cancelTTS() {
  try { window.speechSynthesis?.cancel(); } catch {}
  currentUtter = null;

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio.load();
    } catch {}
  }
  currentAudio = null;

  if (currentSpeakAbort) {
    try { currentSpeakAbort.abort(); } catch {}
    currentSpeakAbort = null;
  }
}

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Speak with cancellation; uses Sarvam TTS for hi/ta when API key exists; falls back to speechSynthesis
async function speak(text: string, lang: LanguageCode) {
  if (!CONFIG.enableVoice) return;

  // Clean text first
  let cleanText = text
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/___/g, '')
    .replace(/__/g, '')
    .replace(/_/g, '')
    .replace(/~~~/g, '')
    .replace(/~~/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/`/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[•●○■□▪▫]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\|/g, ' ')
    .replace(/\\/g, '')
    .replace(/\n{3,}/g, '. ')
    .replace(/\n{2}/g, '. ')
    .replace(/\n/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleanText) {
    console.warn('No text to speak after cleaning');
    return;
  }

  // Stop any previous TTS
  cancelTTS();

  const API_KEY = import.meta.env?.VITE_SARVAM_API_KEY || '';

  // If no API key or English, use browser TTS
  if (!API_KEY || lang === 'en') {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(cleanText);
      currentUtter = utter;
      utter.lang = LANG_MAP[lang].tts;
      utter.rate = 0.9;
      utter.pitch = 1;
      try { window.speechSynthesis.cancel(); } catch {}
      window.speechSynthesis.speak(utter);
    }
    return;
  }

  console.log('Using Sarvam TTS API for', lang);
  console.log('Text to speak:', cleanText);

  // Map a valid speaker for each language (example)
  const speakerMap: Record<LanguageCode, string> = {
    en: 'anushka',
    hi: 'anushka',
    ta: 'anushka'
  };

  currentSpeakAbort = new AbortController();

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY
      },
      body: JSON.stringify({
        inputs: [cleanText],
        target_language_code: LANG_MAP[lang].tts,
        speaker: speakerMap[lang],
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v2'
      }),
      signal: currentSpeakAbort.signal
    });

    console.log('TTS Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Sarvam TTS API error:', errorText);
      throw new Error('TTS API failed');
    }

    const data = await response.json();
    console.log('TTS Response data:', data);

    const audioBase64 = data?.audios?.[0];
    if (!audioBase64) {
      console.error('No audio data in response');
      throw new Error('No audio data');
    }

    const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.onended = () => {
      try { URL.revokeObjectURL(audioUrl); } catch {}
      if (currentAudio === audio) currentAudio = null;
    };
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      try { URL.revokeObjectURL(audioUrl); } catch {}
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(cleanText);
        currentUtter = utter;
        utter.lang = LANG_MAP[lang].tts;
        utter.rate = 0.9;
        try { window.speechSynthesis.cancel(); } catch {}
        window.speechSynthesis.speak(utter);
      }
    };

    // Cancel any previous audio and play this one
    cancelTTS();
    currentAudio = audio;
    await audio.play().catch((err) => {
      console.warn('Autoplay blocked or audio play failed, falling back to speechSynthesis', err);
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(cleanText);
        currentUtter = utter;
        utter.lang = LANG_MAP[lang].tts;
        utter.rate = 0.9;
        try { window.speechSynthesis.cancel(); } catch {}
        window.speechSynthesis.speak(utter);
      }
    });
  } catch (e) {
    if ((e as any)?.name === 'AbortError') {
      console.log('TTS request aborted');
      return;
    }
    console.error('TTS error:', e);
    const fallbackText = text.replace(/\*/g, '').replace(/[•●○■□▪▫]/g, '').replace(/\n/g, ' ').trim();
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(fallbackText);
      currentUtter = utter;
      utter.lang = LANG_MAP[lang].tts;
      utter.rate = 0.9;
      try { window.speechSynthesis.cancel(); } catch {}
      window.speechSynthesis.speak(utter);
    }
  }
}

// ---- Speech recognition helpers ----

function createRecognizer(lang: LanguageCode) {
  const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = LANG_MAP[lang].stt;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  return rec;
}

function stopRecognition(recognitionRef: any, setFlags: () => void) {
  try { if (recognitionRef) recognitionRef.onresult = null; } catch {}
  try { if (recognitionRef) recognitionRef.onerror = null; } catch {}
  try { if (recognitionRef) recognitionRef.onend = null; } catch {}
  try { recognitionRef?.abort?.(); } catch {}
  try { recognitionRef?.stop?.(); } catch {}
  setFlags();
}

// ---- UI and behavior ----

if (!(window as any).__AgentWidgetInitialized) {
  (window as any).__AgentWidgetInitialized = true;

  const container = document.createElement('div');
  container.setAttribute('data-agent-widget-root', 'true');
  container.style.position = 'fixed';
  container.style.zIndex = '2147483647';
  container.style[CONFIG.position.includes('bottom') ? 'bottom' : 'top'] = '20px';
  container.style[CONFIG.position.includes('right') ? 'right' : 'left'] = '20px';
  document.body.appendChild(container);

  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  container.appendChild(host);

  const styles = document.createElement('style');
  styles.textContent = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .btn { 
      background: ${CONFIG.theme.primaryColor}; 
      color: #fff; 
      border: none; 
      border-radius: 9999px; 
      cursor: pointer;
      font-family: ${CONFIG.theme.fontFamily};
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: scale(1.05); }
    .btn:active { transform: scale(0.95); }
    .floating-btn { 
      width: 60px; 
      height: 60px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .floating-btn:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
    .panel {
      position: absolute;
      ${CONFIG.position.includes('bottom') ? 'bottom: 76px;' : 'top: 76px;'}
      ${CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
      width: 380px; 
      max-width: calc(100vw - 40px);
      height: 580px;
      max-height: calc(100vh - 120px);
      background: #fff; 
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      display: none; 
      flex-direction: column;
      overflow: hidden; 
      font-family: ${CONFIG.theme.fontFamily};
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .panel.open { display: flex; }
    .header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      padding: 16px; 
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, ${CONFIG.theme.primaryColor}15, transparent);
      flex-shrink: 0;
    }
    .agent { display: flex; align-items: center; gap: 12px; }
    .agent img { width: 40px; height: 40px; border-radius: 50%; border: 2px solid ${CONFIG.theme.primaryColor}40; }
    .agent .info { display: flex; flex-direction: column; }
    .agent .name { font-weight: 700; color: #111827; font-size: 16px; }
    .agent .status { font-size: 12px; color: #10b981; }
    .controls { display: flex; gap: 8px; align-items: center; }
    .close { 
      background: transparent; 
      border: none; 
      font-size: 20px; 
      cursor: pointer; 
      color: #6b7280;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .close:hover { background: #f3f4f6; color: #111827; }
    .messages { 
      padding: 16px; 
      flex: 1;
      overflow-y: auto; 
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .messages::-webkit-scrollbar { width: 6px; }
    .messages::-webkit-scrollbar-track { background: transparent; }
    .messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
    .msg { display: flex; gap: 8px; animation: fadeIn 0.3s; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .msg .bubble { 
      padding: 12px 16px; 
      border-radius: 16px; 
      max-width: 75%; 
      line-height: 1.5; 
      font-size: 14px; 
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .msg.user { justify-content: flex-end; }
    .msg.user .bubble { 
      background: ${CONFIG.theme.primaryColor}; 
      color: #fff; 
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 8px ${CONFIG.theme.primaryColor}40;
    }
    .msg.bot .bubble { 
      background: #fff; 
      color: #111827; 
      border: 1px solid #e5e7eb; 
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .input-bar { 
      display: flex; 
      gap: 8px; 
      padding: 16px; 
      border-top: 1px solid #e5e7eb; 
      align-items: center; 
      background: #fff;
      flex-shrink: 0;
    }
    .input { flex: 1; display: flex; gap: 8px; align-items: center; }
    .input input { 
      flex: 1; 
      padding: 12px 16px; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px; 
      font-size: 14px; 
      outline: none;
      font-family: ${CONFIG.theme.fontFamily};
      transition: border-color 0.2s;
    }
    .input input:focus { border-color: ${CONFIG.theme.primaryColor}; }
    .send { 
      padding: 12px 20px; 
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }
    .send:disabled { opacity: 0.5; cursor: not-allowed; }
    .lang { 
      padding: 8px 12px; 
      border-radius: 8px; 
      border: 1px solid #e5e7eb; 
      background: #fff; 
      font-size: 12px;
      cursor: pointer;
      font-family: ${CONFIG.theme.fontFamily};
      transition: border-color 0.2s;
    }
    .lang:hover { border-color: ${CONFIG.theme.primaryColor}; }
    .mic { 
      padding: 12px; 
      border-radius: 12px; 
      background: #111827; 
      color: #fff; 
      border: none; 
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s;
      min-width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mic:hover { background: #1f2937; }
    .mic.recording { 
      background: #ef4444; 
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .hint { 
      color: #6b7280; 
      font-size: 11px; 
      padding: 0 16px 12px 16px;
      text-align: center;
      flex-shrink: 0;
    }
  `;
  shadow.appendChild(styles);

  const wrapper = document.createElement('div');
  shadow.appendChild(wrapper);

  const floatBtn = document.createElement('button');
  floatBtn.className = 'btn floating-btn';
  floatBtn.title = 'Chat with ' + CONFIG.agent.name;
  floatBtn.innerHTML = CONFIG.agent.avatar
    ? `<img src="${CONFIG.agent.avatar}" alt="avatar" style="width:32px;height:32px;border-radius:50%;">`
    : '💬';
  wrapper.appendChild(floatBtn);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.setAttribute('aria-hidden', 'true');
  wrapper.appendChild(panel);

  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <div class="agent">
      <img src="${CONFIG.agent.avatar}" alt="avatar" />
      <div class="info">
        <div class="name">${CONFIG.agent.name}</div>
        <div class="status">● Online</div>
      </div>
    </div>
    <div class="controls">
      <select class="lang" title="Change Language">
        ${Object.entries(LANG_MAP).map(([k, v]) =>
          `<option value="${k}" ${k === CONFIG.defaultLanguage ? 'selected' : ''}>${v.label}</option>`
        ).join('')}
      </select>
      <button class="close" title="Close">✕</button>
    </div>
  `;
  panel.appendChild(header);

  const messages = document.createElement('div');
  messages.className = 'messages';
  panel.appendChild(messages);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = CONFIG.enableVoice 
    ? 'Click 🎤 to use voice (microphone permission required)'
    : 'Powered by Sarvam AI';
  panel.appendChild(hint);

  const inputBar = document.createElement('div');
  inputBar.className = 'input-bar';
  inputBar.innerHTML = `
    <div class="input">
      <input type="text" placeholder="Type your message..." />
      <button class="send btn">Send</button>
    </div>
    ${CONFIG.enableVoice ? `<button class="mic" title="Voice Input">🎤</button>` : ''}
  `;
  panel.appendChild(inputBar);

  const inputEl = inputBar.querySelector('input') as HTMLInputElement;
  const sendBtn = inputBar.querySelector('.send') as HTMLButtonElement;
  const micBtn = inputBar.querySelector('.mic') as HTMLButtonElement | null;
  const langSelect = header.querySelector('.lang') as HTMLSelectElement;
  const closeBtn = header.querySelector('.close') as HTMLButtonElement;

  let currentLang: LanguageCode = CONFIG.defaultLanguage as LanguageCode;
  let isOpen = false;
  let isRecording = false;
  let isSending = false;
  let recognition: any = null;

  const stopAllVoice = () => {
    cancelTTS();
    if (isRecording || recognition) {
      stopRecognition(recognition, () => {
        isRecording = false;
        if (micBtn) {
          micBtn.classList.remove('recording');
          micBtn.textContent = '🎤';
        }
        recognition = null;
      });
    }
  };

  const scrollToBottom = () => { 
    setTimeout(() => messages.scrollTop = messages.scrollHeight, 50);
  };
  
  const addMsg = (role: 'user' | 'bot', text: string) => {
    const row = document.createElement('div'); 
    row.className = `msg ${role}`;
    const bubble = document.createElement('div'); 
    bubble.className = 'bubble'; 
    bubble.textContent = text;
    row.appendChild(bubble); 
    messages.appendChild(row); 
    scrollToBottom();
    return row;
  };

  async function send() {
    const text = inputEl.value.trim();
    if (!text || isSending) return;

    // Prevent overlap with any ongoing voice
    stopAllVoice();
    
    isSending = true;
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '...';
    
    addMsg('user', text);
    const thinkingMsg = addMsg('bot', 'Thinking...');

    try {
      const reply = await chat(text, CONFIG.context, currentLang);
      thinkingMsg.remove();
      addMsg('bot', reply);
      await speak(reply, currentLang);
    } catch (error) {
      console.error('Send error:', error);
      thinkingMsg.remove();
      addMsg('bot', 'Sorry, something went wrong. Please try again.');
    } finally {
      isSending = false;
      inputEl.disabled = false;
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
      inputEl.focus();
    }
  }

  function toggleRecording() {
    if (isRecording) {
      // Stop current recognition
      stopRecognition(recognition, () => {
        isRecording = false;
        micBtn?.classList.remove('recording');
        if (micBtn) micBtn.textContent = '🎤';
        recognition = null;
      });
      return;
    }

    // Stop TTS before starting to listen
    cancelTTS();

    // Ensure previous recognition is stopped
    if (recognition) {
      stopRecognition(recognition, () => {});
      recognition = null;
    }
    
    recognition = createRecognizer(currentLang);
    if (!recognition) {
      addMsg('bot', 'Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    isRecording = true;
    micBtn?.classList.add('recording');
    if (micBtn) micBtn.textContent = '⏹';

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      inputEl.value = transcript;
      // Stop recognition flags
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      recognition = null;
      void send();
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e);
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      recognition = null;
      
      if (e.error === 'not-allowed') {
        addMsg('bot', currentLang === 'hi' 
          ? 'माइक्रोफ़ोन की अनुमति नहीं दी गई। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन को अनुमति दें।'
          : currentLang === 'ta'
          ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் மைக்ரோஃபோன் அனுமதியை வழங்கவும்.'
          : 'Microphone access denied. Please allow microphone permission in browser settings.'
        );
      } else if (e.error === 'no-speech') {
        addMsg('bot', currentLang === 'hi'
          ? 'कोई आवाज़ नहीं सुनाई दी। कृपया फिर से प्रयास करें।'
          : currentLang === 'ta'
          ? 'குரல் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'No speech detected. Please try again.'
        );
      } else if (e.error === 'network') {
        addMsg('bot', currentLang === 'hi'
          ? 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।'
          : currentLang === 'ta'
          ? 'நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.'
          : 'Network error. Please check your internet connection.'
        );
      } else {
        addMsg('bot', 'Voice recognition error. Please try again.');
      }
    };

    recognition.onend = () => {
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      recognition = null;
    };
    
    try { 
      recognition.start(); 
    } catch (e) {
      console.error('Failed to start recognition:', e);
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      recognition = null;
    }
  }

  floatBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      inputEl.focus();
    } else {
      // Stop any ongoing voice when panel closes
      stopAllVoice();
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    stopAllVoice();
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      stopAllVoice();
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  });

  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value as LanguageCode;
    // Avoid overlapping speech when switching language
    cancelTTS();
    addMsg('bot', `Language switched to ${LANG_MAP[currentLang].label}`);
  });

  sendBtn.addEventListener('click', () => void send());

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      void send(); 
    }
  });

  if (micBtn) {
    micBtn.addEventListener('click', toggleRecording);
  }

  window.addEventListener('beforeunload', () => {
    stopAllVoice();
  });

  addMsg('bot', `Hi! I'm ${CONFIG.agent.name}. How can I help you today?`);
  
  console.log('=== SARVAM WIDGET INITIALIZED ===');
  console.log('Check console for API debug info when you send messages');
}










// import type { LanguageCode } from './types/widget';

// const LANG_MAP: Record<LanguageCode, { label: string; stt: string; tts: string }> = {
//   en: { label: 'English', stt: 'en-IN', tts: 'en-IN' },
//   hi: { label: 'हिंदी', stt: 'hi-IN', tts: 'hi-IN' },
//   ta: { label: 'தமிழ்', stt: 'ta-IN', tts: 'ta-IN' }
// };

// const DEFAULTS = {
//   position: 'bottom-right',
//   theme: { primaryColor: '#4F46E5', fontFamily: 'Inter, system-ui, sans-serif' },
//   agent: { name: 'SarvamBot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SarvamBot' },
//   enableVoice: true,
//   defaultLanguage: 'en',
//   context: 'You are a helpful AI assistant.'
// };

// const merge = (a: any, b: any) => {
//   const out = { ...a };
//   for (const k in b) {
//     if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) out[k] = merge(a[k] || {}, b[k]);
//     else out[k] = b[k];
//   }
//   return out;
// };

// const CONFIG = merge(DEFAULTS, (window as any).AgentWidgetConfig || {});

// async function chat(prompt: string, context: string, lang: LanguageCode): Promise<string> {
//   const API_KEY = import.meta.env?.VITE_SARVAM_API_KEY || '';
  
//   if (!API_KEY) {
//     console.warn('No API key found. Set VITE_SARVAM_API_KEY in .env file');
//     return `Demo mode: "${prompt}" - Please add your Sarvam API key to get real AI responses.`;
//   }

//   console.log('=== SARVAM API REQUEST ===');
//   console.log('API Key present:', API_KEY ? `Yes (${API_KEY.substring(0, 15)}...)` : 'No');
//   console.log('Language:', lang);
//   console.log('Prompt:', prompt);

//   // According to Sarvam API docs, try these configurations
//   const apiConfigs = [
//     {
//       name: 'Sarvam Chat API (v1)',
//       url: 'https://api.sarvam.ai/v1/chat/completions',
//       headers: {
//         'Content-Type': 'application/json',
//         'api-subscription-key': API_KEY
//       },
//       body: {
//         model: 'sarvam-m',
//         messages: [
//           { role: 'system', content: context },
//           { role: 'user', content: prompt }
//         ]
//       }
//     },
//     {
//       name: 'Sarvam Chat API (Authorization Bearer)',
//       url: 'https://api.sarvam.ai/v1/chat/completions',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${API_KEY}`
//       },
//       body: {
//         model: 'sarvam-m',
//         messages: [
//           { role: 'system', content: context },
//           { role: 'user', content: prompt }
//         ]
//       }
//     },
//     {
//       name: 'Sarvam Translate + Generate (fallback)',
//       url: 'https://api.sarvam.ai/translate',
//       headers: {
//         'Content-Type': 'application/json',
//         'api-subscription-key': API_KEY
//       },
//       body: {
//         input: prompt,
//         source_language_code: LANG_MAP[lang].stt,
//         target_language_code: LANG_MAP[lang].stt,
//         speaker_gender: 'Male',
//         mode: 'formal',
//         model: 'mayura:v1',
//         enable_preprocessing: true
//       }
//     }
//   ];

//   for (const config of apiConfigs) {
//     try {
//       console.log(`\nTrying: ${config.name}`);
//       console.log('URL:', config.url);
//       console.log('Headers:', JSON.stringify(config.headers, null, 2));
//       console.log('Body:', JSON.stringify(config.body, null, 2));

//       const response = await fetch(config.url, {
//         method: 'POST',
//         headers: Object.fromEntries(
//           Object.entries(config.headers).filter(([_, v]) => v !== undefined)
//         ) as HeadersInit,
//         body: JSON.stringify(config.body)
//       });

//       console.log('Response Status:', response.status, response.statusText);
      
//       const responseText = await response.text();
//       console.log('Response Body:', responseText);

//       if (response.ok) {
//         const data = JSON.parse(responseText);
//         console.log('✅ SUCCESS with', config.name);
        
//         // Try different response formats
//         let reply = 
//           data?.choices?.[0]?.message?.content ||
//           data?.message?.content ||
//           data?.response ||
//           data?.translated_text ||
//           data?.text ||
//           JSON.stringify(data);
        
//         if (reply && reply !== '{}') {
//           // Clean LaTeX and special formatting before returning
//           reply = reply
//             .replace(/\\\(/g, '')                    // Remove \(
//             .replace(/\\\)/g, '')                    // Remove \)
//             .replace(/\\\[/g, '')                    // Remove \[
//             .replace(/\\\]/g, '')                    // Remove \]
//             .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')  // \frac{9}{3} -> 9/3
//             .replace(/\\text\{([^}]+)\}/g, '$1')     // \text{...} -> ...
//             .replace(/\\\\/g, '')                    // Remove \\
//             .replace(/\\/g, '')                      // Remove remaining backslashes
//             .trim();
          
//           return reply;
//         }
//       } else {
//         console.error(`❌ Failed with status ${response.status}:`, responseText);
//       }
//     } catch (error) {
//       console.error(`❌ Error with ${config.name}:`, error);
//     }
//   }

//   console.log('=== ALL API ATTEMPTS FAILED ===');
//   console.log('Please check:');
//   console.log('1. Is your API key correct? Current:', API_KEY.substring(0, 15) + '...');
//   console.log('2. Visit https://docs.sarvam.ai for API documentation');
//   console.log('3. Check if you have API credits/quota remaining');
//   console.log('4. Verify your subscription includes chat completions');

//   // Return intelligent fallback
//   return generateSmartFallback(prompt, lang);
// }

// function generateSmartFallback(prompt: string, lang: LanguageCode): string {
//   const lower = prompt.toLowerCase();
  
//   const responses: Record<string, Record<LanguageCode, string>> = {
//     greeting: {
//       en: "Hello! I'm SarvamBot. I'm currently in offline mode, but I can still help with basic questions. How can I assist you?",
//       hi: "नमस्ते! मैं SarvamBot हूं। मैं वर्तमान में ऑफ़लाइन मोड में हूं, लेकिन फिर भी बुनियादी सवालों में मदद कर सकता हूं। मैं आपकी कैसे मदद कर सकता हूं?",
//       ta: "வணக்கம்! நான் SarvamBot. நான் தற்போது ஆஃப்லைன் பயன்முறையில் இருக்கிறேன், ஆனால் அடிப்படை கேள்விகளுக்கு இன்னும் உதவ முடியும். நான் உங்களுக்கு எப்படி உதவ முடியும்?"
//     },
//     identity: {
//       en: "I'm SarvamBot, an AI assistant created by Sarvam AI. I can communicate in English, Hindi, and Tamil. I'm designed to help answer questions and have conversations.",
//       hi: "मैं SarvamBot हूं, Sarvam AI द्वारा बनाया गया एक AI सहायक। मैं अंग्रेजी, हिंदी और तमिल में संवाद कर सकता हूं। मैं सवालों के जवाब देने और बातचीत करने में मदद के लिए डिज़ाइन किया गया हूं।",
//       ta: "நான் SarvamBot, Sarvam AI ஆல் உருவாக்கப்பட்ட ஒரு AI உதவியாளர். நான் ஆங்கிலம், இந்தி மற்றும் தமிழில் தொடர்பு கொள்ள முடியும். கேள்விகளுக்கு பதிலளிக்கவும் உரையாடல்களை நடத்தவும் நான் வடிவமைக்கப்பட்டுள்ளேன்."
//     },
//     capability: {
//       en: "I can help you with:\n• Answering questions\n• Having conversations in multiple languages\n• Providing information on various topics\n• Translating between English, Hindi, and Tamil\n\nNote: I'm currently in offline mode. For full AI capabilities, please ensure the Sarvam API is properly configured.",
//       hi: "मैं आपकी इनमें मदद कर सकता हूं:\n• सवालों के जवाब देना\n• कई भाषाओं में बातचीत करना\n• विभिन्न विषयों पर जानकारी प्रदान करना\n• अंग्रेजी, हिंदी और तमिल के बीच अनुवाद करना\n\nनोट: मैं वर्तमान में ऑफ़लाइन मोड में हूं। पूर्ण AI क्षमताओं के लिए, कृपया सुनिश्चित करें कि Sarvam API ठीक से कॉन्फ़िगर किया गया है।",
//       ta: "நான் உங்களுக்கு இவற்றில் உதவ முடியும்:\n• கேள்விகளுக்கு பதிலளித்தல்\n• பல மொழிகளில் உரையாடல்கள்\n• பல்வேறு தலைப்புகளில் தகவல் வழங்குதல்\n• ஆங்கிலம், இந்தி மற்றும் தமிழ் இடையே மொழிபெயர்த்தல்\n\nகுறிப்பு: நான் தற்போது ஆஃப்லைன் பயன்முறையில் இருக்கிறேன். முழு AI திறன்களுக்கு, Sarvam API சரியாக உள்ளமைக்கப்பட்டுள்ளதா என்பதை உறுதிப்படுத்தவும்."
//     },
//     weather: {
//       en: "I apologize, but I don't have access to real-time weather data in offline mode. For accurate weather information, please check a weather service or wait until the API connection is restored.",
//       hi: "मुझे खेद है, लेकिन ऑफ़लाइन मोड में मेरे पास वास्तविक समय के मौसम डेटा तक पहुंच नहीं है। सटीक मौसम की जानकारी के लिए, कृपया किसी मौसम सेवा की जांच करें या API कनेक्शन बहाल होने तक प्रतीक्षा करें।",
//       ta: "மன்னிக்கவும், ஆஃப்லைன் பயன்முறையில் எனக்கு நேரடி வானிலை தரவு அணுகல் இல்லை. துல்லியமான வானிலை தகவலுக்கு, தயவுசெய்து வானிலை சேவையை சரிபார்க்கவும் அல்லது API இணைப்பு மீட்டமைக்கப்படும் வரை காத்திருக்கவும்."
//     },
//     time: {
//       en: `The current time is ${new Date().toLocaleTimeString()}. The date is ${new Date().toLocaleDateString()}.`,
//       hi: `वर्तमान समय ${new Date().toLocaleTimeString('hi-IN')} है। तारीख ${new Date().toLocaleDateString('hi-IN')} है।`,
//       ta: `தற்போதைய நேரம் ${new Date().toLocaleTimeString('ta-IN')}. தேதி ${new Date().toLocaleDateString('ta-IN')}.`
//     },
//     thanks: {
//       en: "You're welcome! Is there anything else I can help you with?",
//       hi: "आपका स्वागत है! क्या कुछ और है जिसमें मैं आपकी मदद कर सकता हूं?",
//       ta: "வரவேற்கிறோம்! வேறு ஏதாவது நான் உதவ முடியுமா?"
//     }
//   };

//   // Match patterns
//   if (lower.match(/^(hi|hello|hey|namaste|வணக்கம்|नमस्ते)/)) {
//     return responses.greeting[lang];
//   }
//   if (lower.match(/(who|what|naam|பெயர்|नाम).*(you|are|तुम|நீ)/)) {
//     return responses.identity[lang];
//   }
//   if (lower.match(/(can you|help|capability|क्या.*सकते|திறன்|உதவி)/)) {
//     return responses.capability[lang];
//   }
//   if (lower.match(/(weather|मौसम|வானிலை)/)) {
//     return responses.weather[lang];
//   }
//   if (lower.match(/(time|date|समय|तारीख|நேரம்|தேதி)/)) {
//     return responses.time[lang];
//   }
//   if (lower.match(/(thank|धन्यवाद|நன்றி)/)) {
//     return responses.thanks[lang];
//   }

//   // Default response
//   const defaults: Record<LanguageCode, string> = {
//     en: `I understand you asked: "${prompt}"\n\nI'm currently in offline mode and cannot access the full AI capabilities. However, I can help with:\n• Basic conversations\n• Language information\n• Time and date\n\nFor complex questions, please check the browser console (F12) to see why the API connection failed, or contact support to verify your Sarvam API configuration.`,
//     hi: `मैं समझता हूं कि आपने पूछा: "${prompt}"\n\nमैं वर्तमान में ऑफ़लाइन मोड में हूं और पूर्ण AI क्षमताओं तक पहुंच नहीं सकता। हालांकि, मैं इनमें मदद कर सकता हूं:\n• बुनियादी बातचीत\n• भाषा जानकारी\n• समय और तारीख\n\nजटिल सवालों के लिए, कृपया ब्राउज़र कंसोल (F12) की जांच करें यह देखने के लिए कि API कनेक्शन क्यों विफल रहा, या अपने Sarvam API कॉन्फ़िगरेशन को सत्यापित करने के लिए सहायता से संपर्क करें।`,
//     ta: `நீங்கள் கேட்டது எனக்குப் புரிகிறது: "${prompt}"\n\nநான் தற்போது ஆஃப்லைன் பயன்முறையில் இருக்கிறேன் மற்றும் முழு AI திறன்களை அணுக முடியாது. இருப்பினும், நான் இவற்றில் உதவ முடியும்:\n• அடிப்படை உரையாடல்கள்\n• மொழி தகவல்\n• நேரம் மற்றும் தேதி\n\nசிக்கலான கேள்விகளுக்கு, API இணைப்பு ஏன் தோல்வியடைந்தது என்பதைப் பார்க்க உலாவி கன்சோலை (F12) சரிபார்க்கவும், அல்லது உங்கள் Sarvam API உள்ளமைவை சரிபார்க்க ஆதரவைத் தொடர்பு கொள்ளவும்.`
//   };

//   return defaults[lang];
// }

// // // Helper function to convert base64 to Blob
// function base64ToBlob(base64: string, mimeType: string): Blob {
//   const byteCharacters = atob(base64);
//   const byteNumbers = new Array(byteCharacters.length);
//   for (let i = 0; i < byteCharacters.length; i++) {
//     byteNumbers[i] = byteCharacters.charCodeAt(i);
//   }
//   const byteArray = new Uint8Array(byteNumbers);
//   return new Blob([byteArray], { type: mimeType });
// }

// // // ...existing code...

// async function speak(text: string, lang: LanguageCode) {
//   try {
//     // Clean text first
//     let cleanText = text
//       .replace(/\*\*\*/g, '')
//       .replace(/\*\*/g, '')
//       .replace(/\*/g, '')
//       .replace(/___/g, '')
//       .replace(/__/g, '')
//       .replace(/_/g, '')
//       .replace(/~~~/g, '')
//       .replace(/~~/g, '')
//       .replace(/`{1,3}[^`]*`{1,3}/g, '')
//       .replace(/`/g, '')
//       .replace(/#{1,6}\s*/g, '')
//       .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
//       .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
//       .replace(/^>\s*/gm, '')
//       .replace(/^[-*+]\s+/gm, '')
//       .replace(/^\d+\.\s+/gm, '')
//       .replace(/[•●○■□▪▫]/g, '')
//       .replace(/[-–—]/g, ' ')
//       .replace(/[<>]/g, '')
//       .replace(/\|/g, ' ')
//       .replace(/\\/g, '')
//       .replace(/\n{3,}/g, '. ')
//       .replace(/\n{2}/g, '. ')
//       .replace(/\n/g, ', ')
//       .replace(/\s{2,}/g, ' ')
//       .trim();

//     if (!cleanText) {
//       console.warn('No text to speak after cleaning');
//       return;
//     }

//     const API_KEY = import.meta.env?.VITE_SARVAM_API_KEY || '';
    
//     // If no API key or English, use browser TTS
//     if (!API_KEY || lang === 'en') {
//       if ('speechSynthesis' in window) {
//         const utter = new SpeechSynthesisUtterance(cleanText);
//         utter.lang = LANG_MAP[lang].tts;
//         utter.rate = 0.9;
//         utter.pitch = 1;
//         window.speechSynthesis.cancel();
//         window.speechSynthesis.speak(utter);
//       }
//       return;
//     }

//     // Use Sarvam TTS API for Hindi and Tamil
//     console.log('Using Sarvam TTS API for', lang);
//     console.log('Text to speak:', cleanText);
    
//     // Select appropriate speaker for each language
//     const speakerMap: Record<LanguageCode, string> = {
//       en: 'anushka',
//       hi: 'anushka',  // Changed from 'meera' to 'anushka' (valid Hindi speaker)
//       ta: 'anushka'   // Changed from 'aarvi' to 'anushka' (works for Tamil too)
//     };
    
//     const response = await fetch('https://api.sarvam.ai/text-to-speech', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'api-subscription-key': API_KEY
//       },
//       body: JSON.stringify({
//         inputs: [cleanText],
//         target_language_code: LANG_MAP[lang].tts,
//         speaker: speakerMap[lang],  // Use valid speaker name
//         pitch: 0,
//         pace: 1.0,
//         loudness: 1.5,
//         speech_sample_rate: 8000,
//         enable_preprocessing: true,
//         model: 'bulbul:v2'  // Changed from 'bulbul:v1' to 'bulbul:v2'
//       })
//     });

//     console.log('TTS Response status:', response.status);
    
//     if (response.ok) {
//       const data = await response.json();
//       console.log('TTS Response data:', data);
      
//       // The API returns base64 encoded audio
//       if (data.audios && data.audios[0]) {
//         const audioBase64 = data.audios[0];
//         const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
//         const audioUrl = URL.createObjectURL(audioBlob);
//         const audio = new Audio(audioUrl);
        
//         audio.onended = () => {
//           URL.revokeObjectURL(audioUrl);
//         };
        
//         audio.onerror = (e) => {
//           console.error('Audio playback error:', e);
//           // Fallback to browser TTS
//           if ('speechSynthesis' in window) {
//             const utter = new SpeechSynthesisUtterance(cleanText);
//             utter.lang = LANG_MAP[lang].tts;
//             utter.rate = 0.9;
//             window.speechSynthesis.cancel();
//             window.speechSynthesis.speak(utter);
//           }
//         };
        
//         await audio.play();
//         console.log('✅ Sarvam TTS played successfully');
//       } else {
//         console.error('No audio data in response');
//         throw new Error('No audio data');
//       }
//     } else {
//       const errorText = await response.text();
//       console.error('Sarvam TTS API error:', errorText);
//       throw new Error('TTS API failed');
//     }
//   } catch (e) {
//     console.error('TTS error:', e);
//     // Fallback to browser TTS on error
//     const fallbackText = text
//       .replace(/\*/g, '')
//       .replace(/[•●○■□▪▫]/g, '')
//       .replace(/\n/g, ' ')
//       .trim();
      
//     if ('speechSynthesis' in window) {
//       const utter = new SpeechSynthesisUtterance(fallbackText);
//       utter.lang = LANG_MAP[lang].tts;
//       utter.rate = 0.9;
//       window.speechSynthesis.cancel();
//       window.speechSynthesis.speak(utter);
//     }
//   }
// }

// // ...existing code...

// function createRecognizer(lang: LanguageCode) {
//   const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
//   if (!SR) return null;
//   const rec = new SR();
//   rec.lang = LANG_MAP[lang].stt;
//   rec.interimResults = false;
//   rec.maxAlternatives = 1;
//   rec.continuous = false;
//   return rec;
// }

// if (!(window as any).__AgentWidgetInitialized) {
//   (window as any).__AgentWidgetInitialized = true;

//   const container = document.createElement('div');
//   container.setAttribute('data-agent-widget-root', 'true');
//   container.style.position = 'fixed';
//   container.style.zIndex = '2147483647';
//   container.style[CONFIG.position.includes('bottom') ? 'bottom' : 'top'] = '20px';
//   container.style[CONFIG.position.includes('right') ? 'right' : 'left'] = '20px';
//   document.body.appendChild(container);

//   const host = document.createElement('div');
//   const shadow = host.attachShadow({ mode: 'open' });
//   container.appendChild(host);

//   const styles = document.createElement('style');
//   styles.textContent = `
//     :host { all: initial; }
//     *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//     .btn { 
//       background: ${CONFIG.theme.primaryColor}; 
//       color: #fff; 
//       border: none; 
//       border-radius: 9999px; 
//       cursor: pointer;
//       font-family: ${CONFIG.theme.fontFamily};
//       transition: transform 0.2s, box-shadow 0.2s;
//     }
//     .btn:hover { transform: scale(1.05); }
//     .btn:active { transform: scale(0.95); }
//     .floating-btn { 
//       width: 60px; 
//       height: 60px; 
//       display: flex; 
//       align-items: center; 
//       justify-content: center; 
//       box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//     }
//     .floating-btn:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
//     .panel {
//       position: absolute;
//       ${CONFIG.position.includes('bottom') ? 'bottom: 76px;' : 'top: 76px;'}
//       ${CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
//       width: 380px; 
//       max-width: calc(100vw - 40px);
//       height: 580px;
//       max-height: calc(100vh - 120px);
//       background: #fff; 
//       border-radius: 16px;
//       box-shadow: 0 20px 60px rgba(0,0,0,0.3);
//       display: none; 
//       flex-direction: column;
//       overflow: hidden; 
//       font-family: ${CONFIG.theme.fontFamily};
//       animation: slideIn 0.3s ease-out;
//     }
//     @keyframes slideIn {
//       from { opacity: 0; transform: translateY(10px); }
//       to { opacity: 1; transform: translateY(0); }
//     }
//     .panel.open { display: flex; }
//     .header { 
//       display: flex; 
//       align-items: center; 
//       justify-content: space-between; 
//       padding: 16px; 
//       border-bottom: 1px solid #e5e7eb;
//       background: linear-gradient(135deg, ${CONFIG.theme.primaryColor}15, transparent);
//       flex-shrink: 0;
//     }
//     .agent { display: flex; align-items: center; gap: 12px; }
//     .agent img { width: 40px; height: 40px; border-radius: 50%; border: 2px solid ${CONFIG.theme.primaryColor}40; }
//     .agent .info { display: flex; flex-direction: column; }
//     .agent .name { font-weight: 700; color: #111827; font-size: 16px; }
//     .agent .status { font-size: 12px; color: #10b981; }
//     .controls { display: flex; gap: 8px; align-items: center; }
//     .close { 
//       background: transparent; 
//       border: none; 
//       font-size: 20px; 
//       cursor: pointer; 
//       color: #6b7280;
//       width: 32px;
//       height: 32px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       border-radius: 8px;
//       transition: background 0.2s;
//     }
//     .close:hover { background: #f3f4f6; color: #111827; }
//     .messages { 
//       padding: 16px; 
//       flex: 1;
//       overflow-y: auto; 
//       background: #f9fafb;
//       display: flex;
//       flex-direction: column;
//       gap: 12px;
//     }
//     .messages::-webkit-scrollbar { width: 6px; }
//     .messages::-webkit-scrollbar-track { background: transparent; }
//     .messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
//     .msg { display: flex; gap: 8px; animation: fadeIn 0.3s; }
//     @keyframes fadeIn {
//       from { opacity: 0; transform: translateY(5px); }
//       to { opacity: 1; transform: translateY(0); }
//     }
//     .msg .bubble { 
//       padding: 12px 16px; 
//       border-radius: 16px; 
//       max-width: 75%; 
//       line-height: 1.5; 
//       font-size: 14px; 
//       white-space: pre-wrap;
//       word-wrap: break-word;
//     }
//     .msg.user { justify-content: flex-end; }
//     .msg.user .bubble { 
//       background: ${CONFIG.theme.primaryColor}; 
//       color: #fff; 
//       border-bottom-right-radius: 4px;
//       box-shadow: 0 2px 8px ${CONFIG.theme.primaryColor}40;
//     }
//     .msg.bot .bubble { 
//       background: #fff; 
//       color: #111827; 
//       border: 1px solid #e5e7eb; 
//       border-bottom-left-radius: 4px;
//       box-shadow: 0 1px 3px rgba(0,0,0,0.1);
//     }
//     .input-bar { 
//       display: flex; 
//       gap: 8px; 
//       padding: 16px; 
//       border-top: 1px solid #e5e7eb; 
//       align-items: center; 
//       background: #fff;
//       flex-shrink: 0;
//     }
//     .input { flex: 1; display: flex; gap: 8px; align-items: center; }
//     .input input { 
//       flex: 1; 
//       padding: 12px 16px; 
//       border: 1px solid #e5e7eb; 
//       border-radius: 12px; 
//       font-size: 14px; 
//       outline: none;
//       font-family: ${CONFIG.theme.fontFamily};
//       transition: border-color 0.2s;
//     }
//     .input input:focus { border-color: ${CONFIG.theme.primaryColor}; }
//     .send { 
//       padding: 12px 20px; 
//       border-radius: 12px;
//       font-weight: 600;
//       font-size: 14px;
//     }
//     .send:disabled { opacity: 0.5; cursor: not-allowed; }
//     .lang { 
//       padding: 8px 12px; 
//       border-radius: 8px; 
//       border: 1px solid #e5e7eb; 
//       background: #fff; 
//       font-size: 12px;
//       cursor: pointer;
//       font-family: ${CONFIG.theme.fontFamily};
//       transition: border-color 0.2s;
//     }
//     .lang:hover { border-color: ${CONFIG.theme.primaryColor}; }
//     .mic { 
//       padding: 12px; 
//       border-radius: 12px; 
//       background: #111827; 
//       color: #fff; 
//       border: none; 
//       cursor: pointer;
//       font-size: 16px;
//       transition: background 0.2s;
//       min-width: 44px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }
//     .mic:hover { background: #1f2937; }
//     .mic.recording { 
//       background: #ef4444; 
//       animation: pulse 1s infinite;
//     }
//     @keyframes pulse {
//       0%, 100% { opacity: 1; }
//       50% { opacity: 0.7; }
//     }
//     .hint { 
//       color: #6b7280; 
//       font-size: 11px; 
//       padding: 0 16px 12px 16px;
//       text-align: center;
//       flex-shrink: 0;
//     }
//   `;
//   shadow.appendChild(styles);

//   const wrapper = document.createElement('div');
//   shadow.appendChild(wrapper);

//   const floatBtn = document.createElement('button');
//   floatBtn.className = 'btn floating-btn';
//   floatBtn.title = 'Chat with ' + CONFIG.agent.name;
//   floatBtn.innerHTML = CONFIG.agent.avatar
//     ? `<img src="${CONFIG.agent.avatar}" alt="avatar" style="width:32px;height:32px;border-radius:50%;">`
//     : '💬';
//   wrapper.appendChild(floatBtn);

//   const panel = document.createElement('div');
//   panel.className = 'panel';
//   panel.setAttribute('aria-hidden', 'true');
//   wrapper.appendChild(panel);

//   const header = document.createElement('div');
//   header.className = 'header';
//   header.innerHTML = `
//     <div class="agent">
//       <img src="${CONFIG.agent.avatar}" alt="avatar" />
//       <div class="info">
//         <div class="name">${CONFIG.agent.name}</div>
//         <div class="status">● Online</div>
//       </div>
//     </div>
//     <div class="controls">
//       <select class="lang" title="Change Language">
//         ${Object.entries(LANG_MAP).map(([k, v]) =>
//           `<option value="${k}" ${k === CONFIG.defaultLanguage ? 'selected' : ''}>${v.label}</option>`
//         ).join('')}
//       </select>
//       <button class="close" title="Close">✕</button>
//     </div>
//   `;
//   panel.appendChild(header);

//   const messages = document.createElement('div');
//   messages.className = 'messages';
//   panel.appendChild(messages);

//   const hint = document.createElement('div');
//   hint.className = 'hint';
//   hint.textContent = CONFIG.enableVoice 
//     ? 'Click 🎤 to use voice (microphone permission required)'
//     : 'Powered by Sarvam AI';
//   panel.appendChild(hint);


//   const inputBar = document.createElement('div');
//   inputBar.className = 'input-bar';
//   inputBar.innerHTML = `
//     <div class="input">
//       <input type="text" placeholder="Type your message..." />
//       <button class="send btn">Send</button>
//     </div>
//     ${CONFIG.enableVoice ? `<button class="mic" title="Voice Input">🎤</button>` : ''}
//   `;
//   panel.appendChild(inputBar);

//   const inputEl = inputBar.querySelector('input') as HTMLInputElement;
//   const sendBtn = inputBar.querySelector('.send') as HTMLButtonElement;
//   const micBtn = inputBar.querySelector('.mic') as HTMLButtonElement | null;
//   const langSelect = header.querySelector('.lang') as HTMLSelectElement;
//   const closeBtn = header.querySelector('.close') as HTMLButtonElement;

//   let currentLang: LanguageCode = CONFIG.defaultLanguage as LanguageCode;
//   let isOpen = false;
//   let isRecording = false;
//   let isSending = false;
//   let recognition: any = null;

//   const scrollToBottom = () => { 
//     setTimeout(() => messages.scrollTop = messages.scrollHeight, 50);
//   };
  
//   const addMsg = (role: 'user' | 'bot', text: string) => {
//     const row = document.createElement('div'); 
//     row.className = `msg ${role}`;
//     const bubble = document.createElement('div'); 
//     bubble.className = 'bubble'; 
//     bubble.textContent = text;
//     row.appendChild(bubble); 
//     messages.appendChild(row); 
//     scrollToBottom();
//     return row;
//   };

//   async function send() {
//     const text = inputEl.value.trim();
//     if (!text || isSending) return;
    
//     isSending = true;
//     inputEl.value = '';
//     inputEl.disabled = true;
//     sendBtn.disabled = true;
//     sendBtn.textContent = '...';
    
//     addMsg('user', text);
//     const thinkingMsg = addMsg('bot', 'Thinking...');

//     try {
//       const reply = await chat(text, CONFIG.context, currentLang);
//       thinkingMsg.remove();
//       addMsg('bot', reply);
//       speak(reply, currentLang);
//     } catch (error) {
//       console.error('Send error:', error);
//       thinkingMsg.remove();
//       addMsg('bot', 'Sorry, something went wrong. Please try again.');
//     } finally {
//       isSending = false;
//       inputEl.disabled = false;
//       sendBtn.disabled = false;
//       sendBtn.textContent = 'Send';
//       inputEl.focus();
//     }
//   }

//   function toggleRecording() {
//     if (isRecording) {
//       try { recognition?.stop(); } catch {}
//       isRecording = false;
//       micBtn?.classList.remove('recording');
//       if (micBtn) micBtn.textContent = '🎤';
//       return;
//     }
    
//     recognition = createRecognizer(currentLang);
//     if (!recognition) {
//       addMsg('bot', 'Voice recognition is not supported in your browser. Please use Chrome or Edge.');
//       return;
//     }
    
//     isRecording = true;
//     micBtn?.classList.add('recording');
//     if (micBtn) micBtn.textContent = '⏹';

//     recognition.onresult = (e: any) => {
//       const transcript = e.results[0][0].transcript;
//       inputEl.value = transcript;
//       isRecording = false;
//       micBtn?.classList.remove('recording');
//       if (micBtn) micBtn.textContent = '🎤';
//       void send();
//     };
    
//     // ...existing code...

//     recognition.onerror = (e: any) => {
//       console.error('Speech recognition error:', e);
//       isRecording = false;
//       micBtn?.classList.remove('recording');
//       if (micBtn) micBtn.textContent = '🎤';
      
//       // Handle specific error types
//       if (e.error === 'not-allowed') {
//         addMsg('bot', currentLang === 'hi' 
//           ? 'माइक्रोफ़ोन की अनुमति नहीं दी गई। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन को अनुमति दें।'
//           : currentLang === 'ta'
//           ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் மைக்ரோஃபோன் அனுமதியை வழங்கவும்.'
//           : 'Microphone access denied. Please allow microphone permission in browser settings.'
//         );
//       } else if (e.error === 'no-speech') {
//         addMsg('bot', currentLang === 'hi'
//           ? 'कोई आवाज़ नहीं सुनाई दी। कृपया फिर से प्रयास करें।'
//           : currentLang === 'ta'
//           ? 'குரல் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
//           : 'No speech detected. Please try again.'
//         );
//       } else if (e.error === 'network') {
//         addMsg('bot', currentLang === 'hi'
//           ? 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।'
//           : currentLang === 'ta'
//           ? 'நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.'
//           : 'Network error. Please check your internet connection.'
//         );
//       } else {
//         addMsg('bot', 'Voice recognition error. Please try again.');
//       }
//     };

// // ...existing code...
    
//     recognition.onend = () => {
//       isRecording = false;
//       micBtn?.classList.remove('recording');
//       if (micBtn) micBtn.textContent = '🎤';
//     };
    
//     try { 
//       recognition.start(); 
//     } catch (e) {
//       console.error('Failed to start recognition:', e);
//       isRecording = false;
//       micBtn?.classList.remove('recording');
//       if (micBtn) micBtn.textContent = '🎤';
//     }
//   }

//   floatBtn.addEventListener('click', () => {
//     isOpen = !isOpen;
//     if (isOpen) {
//       panel.classList.add('open');
//       panel.setAttribute('aria-hidden', 'false');
//       inputEl.focus();
//     } else {
//       panel.classList.remove('open');
//       panel.setAttribute('aria-hidden', 'true');
//     }
//   });

//   closeBtn.addEventListener('click', () => {
//     isOpen = false;
//     panel.classList.remove('open');
//     panel.setAttribute('aria-hidden', 'true');
//   });

//   document.addEventListener('keydown', (e) => {
//     if (e.key === 'Escape' && isOpen) {
//       isOpen = false;
//       panel.classList.remove('open');
//       panel.setAttribute('aria-hidden', 'true');
//     }
//   });

//   langSelect.addEventListener('change', () => {
//     currentLang = langSelect.value as LanguageCode;
//     addMsg('bot', `Language switched to ${LANG_MAP[currentLang].label}`);
//   });

//   sendBtn.addEventListener('click', () => void send());

//   inputEl.addEventListener('keydown', (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) { 
//       e.preventDefault(); 
//       void send(); 
//     }
//   });

//   if (micBtn) {
//     micBtn.addEventListener('click', toggleRecording);
//   }

//   addMsg('bot', `Hi! I'm ${CONFIG.agent.name}. How can I help you today?`);
  
//   console.log('=== SARVAM WIDGET INITIALIZED ===');
//   console.log('Check console for API debug info when you send messages');
// }