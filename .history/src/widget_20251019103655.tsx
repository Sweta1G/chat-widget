import type { LanguageCode } from '../src/types/widget';

const LANG_MAP: Record<LanguageCode, { label: string; stt: string; tts: string }> = {
  en: { label: 'English', stt: 'en-US', tts: 'en-US' },
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

async function chat(prompt: string, context: string, lang: LanguageCode): Promise<string> {
  const API_KEY = import.meta.env?.VITE_SARVAM_API_KEY || '';
  if (!API_KEY) {
    const pre = lang === 'hi' ? 'उत्तर:' : lang === 'ta' ? 'பதில்:' : 'Answer:';
    return `${pre} ${prompt}`;
  }
  try {
    const res = await fetch('https://api.sarvam.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'sarvam-2b',
        messages: [
          { role: 'system', content: `${context} Respond in language code: ${lang}.` },
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (e) {
    console.warn('AI error:', e);
    return 'There was an error contacting the AI.';
  }
}

function speak(text: string, lang: LanguageCode) {
  try {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_MAP[lang].tts;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {}
}

function createRecognizer(lang: LanguageCode) {
  const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = LANG_MAP[lang].stt;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  return rec;
}

if (!(window as any).__AgentWidgetInitialized) {
  (window as any).__AgentWidgetInitialized = true;
  const CONFIG = merge(DEFAULTS, (window as any).AgentWidgetConfig || {});

  const container = document.createElement('div');
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
    *, *::before, *::after { box-sizing: border-box; }
    .btn { background: ${CONFIG.theme.primaryColor}; color: #fff; border: none; border-radius: 9999px; cursor: pointer; }
    .floating-btn { width: 56px; height: 56px; display:flex; align-items:center; justify-content:center; box-shadow: 0 10px 20px rgba(0,0,0,.15); }
    .panel {
      position: absolute;
      ${CONFIG.position.includes('bottom') ? 'bottom: 72px;' : 'top: 72px;'}
      ${CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
      width: 360px; max-height: 520px; background: #fff; border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,.2); display: none; overflow: hidden; font-family: ${CONFIG.theme.fontFamily};
    }
    .header { display:flex; align-items:center; justify-content:space-between; padding:12px; border-bottom:1px solid #eee;
      background: linear-gradient(180deg, ${CONFIG.theme.primaryColor}1A, transparent);
    }
    .agent { display:flex; align-items:center; gap:10px; }
    .agent img { width: 32px; height: 32px; border-radius: 50%; }
    .agent .name { font-weight:700; color:#111827; font-size:14px; }
    .controls { display:flex; gap:8px; align-items:center; }
    .close { background: transparent; border: none; font-size: 18px; cursor: pointer; }
    .messages { padding: 12px; height: 340px; overflow-y: auto; background: #fafafa; }
    .msg { display:flex; gap:8px; margin-bottom: 10px; }
    .msg .bubble { padding:10px 12px; border-radius:12px; max-width:80%; line-height:1.35; font-size:14px; white-space:pre-wrap; }
    .msg.user { justify-content: flex-end; }
    .msg.user .bubble { background: ${CONFIG.theme.primaryColor}; color: #fff; border-bottom-right-radius: 4px; }
    .msg.bot .bubble { background: #fff; color:#111827; border: 1px solid #eee; border-bottom-left-radius: 4px; }
    .input-bar { display:flex; gap:8px; padding:10px; border-top:1px solid #eee; align-items:center; background:#fff; }
    .input { flex:1; display:flex; gap:8px; }
    .input input { flex:1; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; font-size:14px; outline:none; }
    .send { padding:10px 14px; border-radius:10px; }
    .lang { padding:8px; border-radius:8px; border:1px solid #e5e7eb; background:#fff; font-size:12px; }
    .mic { padding:10px; border-radius:10px; background:#111827; color:#fff; border:none; cursor:pointer; }
    .mic.recording { background: #ef4444; }
    .hint { color:#6b7280; font-size:12px; padding: 0 12px 10px 12px; }
  `;
  shadow.appendChild(styles);

  const wrapper = document.createElement('div');
  shadow.appendChild(wrapper);

  const floatBtn = document.createElement('button');
  floatBtn.className = 'btn floating-btn';
  floatBtn.innerHTML = CONFIG.agent.avatar
    ? `<img src="${CONFIG.agent.avatar}" alt="avatar" style="width:28px;height:28px;border-radius:50%;background:#fff;padding:2px;">`
    : '💬';
  wrapper.appendChild(floatBtn);

  const panel = document.createElement('div');
  panel.className = 'panel';
  wrapper.appendChild(panel);

  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <div class="agent">
      <img src="${CONFIG.agent.avatar}" alt="avatar" />
      <div>
        <div class="name">${CONFIG.agent.name}</div>
        <div style="font-size:12px;color:#6b7280;">Multi-language Assistant</div>
      </div>
    </div>
    <div class="controls">
      <select class="lang">
        ${Object.entries(LANG_MAP).map(([k, v]) =>
          `<option value="${k}" ${k === CONFIG.defaultLanguage ? 'selected' : ''}>${v.label}</option>`
        ).join('')}
      </select>
      <button class="close">✕</button>
    </div>
  `;
  panel.appendChild(header);

  const messages = document.createElement('div');
  messages.className = 'messages';
  panel.appendChild(messages);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Type a message or use the mic. ESC to close.';
  panel.appendChild(hint);

  const inputBar = document.createElement('div');
  inputBar.className = 'input-bar';
  inputBar.innerHTML = `
    <div class="input">
      <input type="text" placeholder="Ask me anything..." />
      <button class="send btn">Send</button>
    </div>
    ${CONFIG.enableVoice ? `<button class="mic">🎤</button>` : ``}
  `;
  panel.appendChild(inputBar);

  const inputEl = inputBar.querySelector('input') as HTMLInputElement;
  const sendBtn = inputBar.querySelector('.send') as HTMLButtonElement;
  const micBtn = inputBar.querySelector('.mic') as HTMLButtonElement | null;
  const langSelect = header.querySelector('.lang') as HTMLSelectElement;
  const closeBtn = header.querySelector('.close') as HTMLButtonElement;

  let currentLang: LanguageCode = CONFIG.defaultLanguage;
  let isOpen = false;
  let isRecording = false;
  let recognition: any = null;

  const scrollToBottom = () => { messages.scrollTop = messages.scrollHeight; };
  const addMsg = (role: 'user' | 'bot', text: string) => {
    const row = document.createElement('div'); row.className = `msg ${role}`;
    const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = text;
    row.appendChild(bubble); messages.appendChild(row); scrollToBottom();
  };
  
  async function chat(prompt: string, context: string, lang: LanguageCode): Promise<string> {
    const API_KEY = import.meta.env?.VITE_SARVAM_API_KEY || '';
    if (!API_KEY) {
        // Mock response when no API key
        const pre = lang === 'hi' ? 'उत्तर:' : lang === 'ta' ? 'பதில்:' : 'Answer:';
        return `${pre} ${prompt}`;
    }
    try {
        const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'api-subscription-key': API_KEY  // Changed from Authorization
        },
        body: JSON.stringify({
            model: 'sarvam-2b',
            messages: [
            { role: 'system', content: `${context} Respond in language code: ${lang}.` },
            { role: 'user', content: prompt }
            ]
        })
        });
        if (!res.ok) {
        console.error('API Error:', await res.text());
        throw new Error('API request failed');
        }
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (e) {
        console.error('AI error:', e);
        // Return fallback response instead of error
        const pre = lang === 'hi' ? 'उत्तर:' : lang === 'ta' ? 'பதில்:' : 'Answer:';
        return `${pre} ${prompt} (API unavailable - showing mock response)`;
    }
    }
  async function send() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addMsg('user', text);
    addMsg('bot', 'Thinking…');

    // const last = messages.querySelector('.msg.bot .bubble:last-child') as HTMLDivElement;
    // const reply = await chat(text, CONFIG.context, currentLang);
    // if (last) last.textContent = reply;
    // speak(reply, currentLang);
    const thinkingRow = document.createElement('div');
    thinkingRow.className = 'msg bot';
    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'bubble';
    thinkingBubble.textContent = 'Thinking…';
    thinkingRow.appendChild(thinkingBubble);
    messages.appendChild(thinkingRow);
    scrollToBottom();

    try {
        const reply = await chat(text, CONFIG.context, currentLang);
        // Remove thinking message
        thinkingRow.remove();
        // Add actual reply
        addMsg('bot', reply);
        speak(reply, currentLang);
    } catch (error) {
        console.error('Send error:', error);
        thinkingRow.remove();
        addMsg('bot', 'Sorry, something went wrong. Please try again.');
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
      addMsg('bot', 'Voice not supported in this browser.');
      return;
    }
    isRecording = true;
    micBtn?.classList.add('recording');
    if (micBtn) micBtn.textContent = '■';

    recognition.onresult = (e: any) => {
      inputEl.value = e.results[0][0].transcript;
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
      void send();
    };
    recognition.onerror = () => {
      isRecording = false;
      micBtn?.classList.remove('recording');
      if (micBtn) micBtn.textContent = '🎤';
    };
    try { recognition.start(); } catch {}
  }

  floatBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    if (isOpen) inputEl.focus();
  });
  closeBtn.addEventListener('click', () => {
    isOpen = false;
    panel.style.display = 'none';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      panel.style.display = 'none';
    }
  });
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value as LanguageCode;
  });
  sendBtn.addEventListener('click', () => void send());
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); void send(); }
  });
  if (micBtn) micBtn.addEventListener('click', toggleRecording);

  addMsg('bot', `Hi, I'm ${CONFIG.agent.name}. How can I help you?`);
}