(() => {
  const defaults = {
    position: 'bottom-right',
    theme: {
      primaryColor: '#4F46E5',
      bgColor: '#ffffff',
      textColor: '#111827',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    },
    agent: { name: 'Agent', avatar: '' },
    enableVoice: false,
    context: ''
  };

  const deepMerge = (a, b) => {
    const out = Array.isArray(a) ? [...a] : { ...a };
    for (const k of Object.keys(b || {})) {
      const v = b[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = deepMerge(a[k] || {}, v);
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  const cfg = deepMerge(defaults, window.AgentWidgetConfig || {});
  const uid = 'aw-' + Math.random().toString(36).slice(2, 8);

  function ensureStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-aw', uid);
    style.textContent = `
      :root {
        --aw-primary: ${cfg.theme.primaryColor};
        --aw-bg: ${cfg.theme.bgColor};
        --aw-text: ${cfg.theme.textColor};
        --aw-font: ${cfg.theme.fontFamily};
        --aw-shadow: 0 10px 30px rgba(0,0,0,0.12);
        --aw-radius: 16px;
        --aw-gap: 12px;
        --aw-size: 64px;
      }
      .aw-container {
        position: fixed;
        inset: auto 24px 24px auto;
        z-index: 2147483000;
        font-family: var(--aw-font);
        color: var(--aw-text);
      }
      .aw-container.pos-bottom-right { right: 24px; bottom: 24px; left: auto; top: auto; }
      .aw-container.pos-bottom-left { left: 24px; bottom: 24px; right: auto; top: auto; }
      .aw-container.pos-top-right { right: 24px; top: 24px; left: auto; bottom: auto; }
      .aw-container.pos-top-left { left: 24px; top: 24px; right: auto; bottom: auto; }

      .aw-button {
        display: flex; align-items: center; gap: 10px;
        background: var(--aw-bg);
        border: 1px solid rgba(0,0,0,0.06);
        box-shadow: var(--aw-shadow);
        border-radius: 999px;
        padding: 8px 12px 8px 8px;
        cursor: pointer;
        user-select: none;
        transition: transform .15s ease, box-shadow .15s ease;
      }
      .aw-button:hover { transform: translateY(-1px); box-shadow: 0 14px 34px rgba(0,0,0,0.16); }
      .aw-avatar {
        width: var(--aw-size); height: var(--aw-size);
        border-radius: 999px;
        background: var(--aw-primary);
        display: inline-flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 600; font-size: 20px;
        overflow: hidden;
      }
      .aw-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .aw-meta { display: flex; flex-direction: column; line-height: 1.15; }
      .aw-name { font-weight: 600; }
      .aw-sub { font-size: 12px; opacity: 0.75; }
      .aw-dot {
        width: 8px; height: 8px; border-radius: 999px;
        background: var(--aw-primary); margin-left: 6px;
      }

      .aw-panel {
        position: absolute;
        inset: auto 0 calc(100% + 12px) auto;
        width: min(360px, 90vw);
        background: var(--aw-bg);
        border: 1px solid rgba(0,0,0,0.06);
        box-shadow: var(--aw-shadow);
        border-radius: var(--aw-radius);
        overflow: hidden;
        display: none;
      }
      .aw-panel.open { display: grid; grid-template-rows: auto 1fr auto; }
      .aw-header { display: flex; align-items: center; gap: var(--aw-gap); padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.06); }
      .aw-title { font-weight: 600; }
      .aw-context { font-size: 12px; opacity: 0.7; }
      .aw-body { min-height: 220px; max-height: 60vh; overflow: auto; padding: 12px; }
      .aw-empty { font-size: 13px; opacity: 0.7; }
      .aw-footer { display: flex; align-items: center; gap: 8px; padding: 10px; border-top: 1px solid rgba(0,0,0,0.06); }
      .aw-input {
        flex: 1; border: 1px solid rgba(0,0,0,0.12);
        border-radius: 10px; padding: 10px 12px; outline: none;
      }
      .aw-send, .aw-mic {
        background: var(--aw-primary); color: #fff; border: 0; border-radius: 10px;
        padding: 10px 12px; cursor: pointer;
      }
      .aw-mic[hidden] { display: none; }
    `;
    document.head.appendChild(style);
  }

  function initials(name) {
    const parts = String(name || 'A').trim().split(/\s+/);
    const a = parts[0]?.[0] || 'A';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
  }

  function avatarSrc(name, avatar) {
    if (avatar) return avatar;
    const bg = cfg.theme.primaryColor.replace('#','');
    return `https://ui-avatars.com/api/?background=${bg}&color=fff&name=${encodeURIComponent(initials(name))}`;
  }

  function render() {
    ensureStyles();

    const wrap = document.createElement('div');
    wrap.className = `aw-container pos-${cfg.position}`;

    wrap.innerHTML = `
      <div class="aw-panel" data-aw="panel" role="dialog" aria-modal="false">
        <div class="aw-header">
          <div class="aw-avatar"><img data-aw="avatar" alt="avatar" src="${avatarSrc(cfg.agent.name, cfg.agent.avatar)}"></div>
          <div>
            <div class="aw-title" data-aw="name">${cfg.agent.name}</div>
            <div class="aw-context">${cfg.context || ''}</div>
          </div>
        </div>
        <div class="aw-body" data-aw="body">
          <div class="aw-empty">Ask me anything about your site, UI, or code.</div>
        </div>
        <div class="aw-footer">
          <input class="aw-input" data-aw="input" placeholder="Type a message..." />
          <button class="aw-mic" data-aw="mic"${cfg.enableVoice ? '' : ' hidden'} title="Voice input">🎤</button>
          <button class="aw-send" data-aw="send" title="Send">Send</button>
        </div>
      </div>

      <button class="aw-button" type="button" data-aw="toggle" aria-haspopup="dialog" aria-expanded="false">
        <span class="aw-avatar">${cfg.agent.avatar ? `<img data-aw="avatarBtn" alt="avatar" src="${avatarSrc(cfg.agent.name, cfg.agent.avatar)}">` : initials(cfg.agent.name)}</span>
        <span class="aw-meta">
          <span class="aw-name" data-aw="nameBtn">${cfg.agent.name}</span>
          <span class="aw-sub">Online <span class="aw-dot"></span></span>
        </span>
      </button>
    `;

    const panel = wrap.querySelector('[data-aw="panel"]');
    const toggle = wrap.querySelector('[data-aw="toggle"]');
    const input = wrap.querySelector('[data-aw="input"]');
    const send = wrap.querySelector('[data-aw="send"]');
    const mic = wrap.querySelector('[data-aw="mic"]');

    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      if (open) setTimeout(() => input?.focus(), 0);
    });

    const sendMessage = () => {
      const text = input.value.trim();
      if (!text) return;
      appendMsg('user', text);
      input.value = '';
      // Placeholder: simulate agent response
      setTimeout(() => appendMsg('agent', `You said: "${text}"`), 350);
    };

    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    if (mic && cfg.enableVoice) {
      mic.addEventListener('click', async () => {
        try {
          // Basic Web Speech API demo (if supported)
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SR) return alert('Voice not supported in this browser.');
          const r = new SR();
          r.lang = 'en-US';
          r.interimResults = false;
          r.maxAlternatives = 1;
          r.onresult = (ev) => {
            const transcript = ev.results[0][0].transcript;
            input.value = transcript;
            sendMessage();
          };
          r.start();
        } catch (e) {
          console.warn('Voice error:', e);
        }
      });
    }

    function appendMsg(role, text) {
      const body = wrap.querySelector('[data-aw="body"]');
      const empty = body.querySelector('.aw-empty');
      if (empty) empty.remove();
      const row = document.createElement('div');
      row.style.margin = '8px 0';
      row.innerHTML = role === 'user'
        ? `<div style="background: rgba(79,70,229,0.08); padding:10px 12px; border-radius:10px; max-width:85%;">${escapeHtml(text)}</div>`
        : `<div style="background:#f3f4f6; padding:10px 12px; border-radius:10px; max-width:85%;">${escapeHtml(text)}</div>`;
      body.appendChild(row);
      body.scrollTop = body.scrollHeight;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    document.body.appendChild(wrap);

    // Expose minimal runtime API
    window.AgentWidget = {
      updateConfig(next) {
        const newCfg = deepMerge(cfg, next || {});
        // Update CSS vars
        document.documentElement.style.setProperty('--aw-primary', newCfg.theme.primaryColor);
        document.documentElement.style.setProperty('--aw-bg', newCfg.theme.bgColor);
        document.documentElement.style.setProperty('--aw-text', newCfg.theme.textColor);
        document.documentElement.style.setProperty('--aw-font', newCfg.theme.fontFamily);
        // Update position
        wrap.className = `aw-container pos-${newCfg.position}`;
        // Update name/avatar/context
        wrap.querySelectorAll('[data-aw="name"],[data-aw="nameBtn"]').forEach(el => el.textContent = newCfg.agent.name);
        const newAvatar = avatarSrc(newCfg.agent.name, newCfg.agent.avatar);
        const avatarEl = wrap.querySelector('[data-aw="avatar"]');
        const avatarBtnEl = wrap.querySelector('[data-aw="avatarBtn"]');
        if (avatarEl) avatarEl.src = newAvatar;
        if (avatarBtnEl) avatarBtnEl.src = newAvatar;
        // Toggle mic
        const micBtn = wrap.querySelector('[data-aw="mic"]');
        if (micBtn) micBtn.hidden = !newCfg.enableVoice;
        // Persist to window
        window.AgentWidgetConfig = newCfg;
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
})();