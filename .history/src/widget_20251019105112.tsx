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

// Initialize CONFIG globally
const CONFIG = merge(DEFAULTS, (window as any).AgentWidgetConfig || {});

async function chat(prompt: string, context: string, lang: LanguageCode): Promise<string> {
  const API_KEY = import.meta.env?.VITE_SARVAM_API_KEY || '';
  
  if (!API_KEY) {
    return `Demo Response: "${prompt}" (Add VITE_SARVAM_API_KEY to .env for real AI)`;
  }

  try {
    console.log('Sending request to Sarvam API...');
    console.log('API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
    
    const requestBody = {
      model: 'sarvam-2b',
      messages: [
        {
          role: 'system',
          content: context
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      console.error('API Error Response:', responseText);
      throw new Error(`API Error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    const reply = data?.choices?.[0]?.message?.content || data?.message?.content || data?.response;
    
    if (!reply) {
      console.error('Unexpected API response structure:', data);
      throw new Error('No response content from API');
    }

    return reply.trim();
  } catch (error) {
    console.error('Chat error:', error);
    
    // Provide intelligent fallback responses
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('नमस्ते') || lowerPrompt.includes('வணக்கம்')) {
      return lang === 'hi' 
        ? 'नमस्ते! मैं SarvamBot हूं। मैं आपकी कैसे मदद कर सकता हूं?'
        : lang === 'ta'
        ? 'வணக்கம்! நான் SarvamBot. நான் உங்களுக்கு எப்படி உதவ முடியும்?'
        : 'Hello! I\'m SarvamBot. How can I help you today?';
    }
    
    if (lowerPrompt.includes('name') || lowerPrompt.includes('who') || lowerPrompt.includes('what are you')) {
      return lang === 'hi'
        ? 'मैं SarvamBot हूं, एक AI सहायक जो Sarvam AI द्वारा संचालित है। मैं अंग्रेजी, हिंदी और तमिल में बात कर सकता हूं।'
        : lang === 'ta'
        ? 'நான் SarvamBot, Sarvam AI மூலம் இயக்கப்படும் ஒரு AI உதவியாளர். நான் ஆங்கிலம், இந்தி மற்றும் தமிழில் பேச முடியும்.'
        : 'I\'m SarvamBot, an AI assistant powered by Sarvam AI. I can speak in English, Hindi, and Tamil.';
    }
    
    if (lowerPrompt.includes('how are you')) {
      return lang === 'hi'
        ? 'मैं अच्छा हूं, धन्यवाद! आप कैसे हैं?'
        : lang === 'ta'
        ? 'நான் நன்றாக இருக்கிறேன், நன்றி! நீங்கள் எப்படி இருக்கிறீர்கள்?'
        : 'I\'m doing great, thank you! How are you?';
    }
    
    if (lowerPrompt.includes('help')) {
      return lang === 'hi'
        ? 'मैं आपकी विभिन्न प्रश्नों में मदद कर सकता हूं। बस मुझसे कुछ भी पूछें!'
        : lang === 'ta'
        ? 'நான் பல்வேறு கேள்விகளில் உங்களுக்கு உதவ முடியும். என்னிடம் எதையும் கேளுங்கள்!'
        : 'I can help you with various questions. Just ask me anything!';
    }
    
    // Generic fallback
    return lang === 'hi'
      ? `क्षमा करें, वर्तमान में मैं AI सेवा से कनेक्ट नहीं हो पा रहा हूं। लेकिन मैं आपकी बुनियादी मदद कर सकता हूं। कृपया कुछ और पूछें या बाद में पुनः प्रयास करें।`
      : lang === 'ta'
      ? `மன்னிக்கவும், தற்போது நான் AI சேவையுடன் இணைக்க முடியவில்லை. ஆனால் நான் அடிப்படை உதவியை வழங்க முடியும். தயவுசெய்து வேறு ஏதாவது கேளுங்கள் அல்லது பிறகு முயற்சிக்கவும்.`
      : `I apologize for the connection issue with the AI service. However, I can still help with basic questions. Please try asking something else, or check the browser console (F12) for detailed error logs.`;
  }
}

function speak(text: string, lang: LanguageCode) {
  try {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_MAP[lang].tts;
    utter.rate = 0.9;
    utter.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.error('TTS error:', e);
  }
}

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
  hint.textContent = 'Powered by Sarvam AI • Press ESC to close';
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
      speak(reply, currentLang);
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
      try { recognition?.stop(); } catch {}
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      return;
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
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      void send();
    };
    
    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e);
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      addMsg('bot', 'Voice recognition error. Please try again.');
    };
    
    recognition.onend = () => {
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
    };
    
    try { 
      recognition.start(); 
    } catch (e) {
      console.error('Failed to start recognition:', e);
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
    }
  }

  floatBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      inputEl.focus();
    } else {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  });

  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value as LanguageCode;
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

  addMsg('bot', `Hi! I'm ${CONFIG.agent.name}. How can I help you today?`);
}