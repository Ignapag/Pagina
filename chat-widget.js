// ============================================================
//  CHAT WIDGET - Positivo Hogar
//  Integración con webhook (n8n u otro servicio)
// ============================================================

(function () {
  'use strict';

  // ── CONFIGURACIÓN ──────────────────────────────────────────
  const CONFIG = {
    // 🔧 REEMPLAZÁ ESTA URL POR LA DE TU WEBHOOK DE N8N
    webhookUrl: 'https://n8n-vyvn.srv1467043.hstgr.cloud/webhook/Modelo-IA-Pagina',

    // Mensaje de bienvenida al abrir el chat
    welcomeMessage: '¡Hola! 👋 Soy el asistente virtual de Positivo Hogar. ¿En qué puedo ayudarte hoy?',

    // Chips de sugerencias rápidas (máximo 4 recomendado)
    suggestions: [
      '📺 Televisores en oferta',
      '❄️ Aires acondicionados',
      '📍 ¿Dónde están ubicados?',
    ],

    // Nombre del bot y empresa
    botName: 'Asistente Positivo',
    storeName: 'Positivo Hogar',

    // Tiempo de espera antes de mostrar "escribiendo..." (ms)
    typingDelay: 600,

    // Sesión: identificador único por usuario (se guarda en sessionStorage)
    sessionKey: 'positivo_chat_session',
  };
  // ──────────────────────────────────────────────────────────

  // Estado
  let isOpen = false;
  let isTyping = false;
  let messageHistory = [];
  let sessionId = getOrCreateSession();

  // ── SESIÓN ────────────────────────────────────────────────

  function getOrCreateSession() {
    let id = sessionStorage.getItem(CONFIG.sessionKey);
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem(CONFIG.sessionKey, id);
    }
    return id;
  }

  // ── SVG ICONS ─────────────────────────────────────────────

  const SVG_BOT = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" fill="white" opacity="0.9"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
    <circle cx="9" cy="8" r="1" fill="#e63946"/>
    <circle cx="15" cy="8" r="1" fill="#e63946"/>
  </svg>`;

  const SVG_BOT_SMALL = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="5" fill="white" opacity="0.9"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
  </svg>`;

  const SVG_CLOSE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`;

  const SVG_SEND = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>`;

  // ── CREAR DOM ─────────────────────────────────────────────

  function buildWidget() {
    // Inyectar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'chat-widget.css';
    document.head.appendChild(link);

    // Botón flotante
    const fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', 'Abrir chat de consultas');
    fab.innerHTML = `
      <span class="chat-fab-icon chat-fab-icon-avatar">${SVG_BOT}</span>
      <span class="chat-fab-icon chat-fab-icon-close">${SVG_CLOSE}</span>
      <span class="chat-badge" id="chat-badge" style="display:none;">1</span>
    `;

    // Panel
    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat de consultas');
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-avatar">${SVG_BOT}</div>
        <div class="chat-header-info">
          <p class="chat-header-name">${CONFIG.botName}</p>
          <div class="chat-header-status">
            <span class="chat-header-dot"></span>
            <span class="chat-header-status-text">En línea · ${CONFIG.storeName}</span>
          </div>
        </div>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-suggestions" id="chat-suggestions"></div>
      <div class="chat-input-area">
        <textarea 
          class="chat-input" 
          id="chat-input" 
          placeholder="Consultá sobre productos..."
          rows="1"
          aria-label="Escribir mensaje"
        ></textarea>
        <button class="chat-send-btn" id="chat-send-btn" aria-label="Enviar mensaje" disabled>
          ${SVG_SEND}
        </button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    return { fab, panel };
  }

  // ── MENSAJES ──────────────────────────────────────────────

  function addMessage(text, sender = 'bot') {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;

    if (sender === 'bot') {
      msg.innerHTML = `
        <div class="chat-msg-avatar">${SVG_BOT_SMALL}</div>
        <div class="chat-bubble">${formatBotText(text)}</div>
      `;
    } else {
      msg.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div>`;
    }

    container.appendChild(msg);
    scrollToBottom();

    messageHistory.push({ role: sender === 'bot' ? 'assistant' : 'user', content: text });
  }

  function showTyping() {
    const container = document.getElementById('chat-messages');
    if (!container || isTyping) return;
    isTyping = true;

    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'chat-typing-indicator';
    typing.innerHTML = `
      <div class="chat-msg-avatar">${SVG_BOT_SMALL}</div>
      <div class="chat-typing-dots">
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
      </div>
    `;
    container.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) indicator.remove();
    isTyping = false;
  }

  function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  // ── SUGERENCIAS ───────────────────────────────────────────

  function renderSuggestions() {
    const suggestionsEl = document.getElementById('chat-suggestions');
    if (!suggestionsEl) return;

    suggestionsEl.innerHTML = '';
    CONFIG.suggestions.forEach(text => {
      const chip = document.createElement('button');
      chip.className = 'chat-suggestion-chip';
      chip.textContent = text;
      chip.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita cerrar el chat al hacer click
        sendMessage(text);
      });
      suggestionsEl.appendChild(chip);
    });
  }

  // ── WEBHOOK ───────────────────────────────────────────────

  async function sendToWebhook(userMessage) {
    const payload = {
      sessionId,
      message: userMessage,
      history: messageHistory.slice(-10), // Últimos 10 mensajes de contexto
      timestamp: new Date().toISOString(),
      source: 'positivo-hogar-widget',
    };

    const response = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    // Leer como texto primero para evitar crash si no es JSON válido
    const rawText = await response.text();
    if (!rawText || rawText.trim() === '') {
      throw new Error('Respuesta vacía del servidor');
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // Si no es JSON, devolver el texto directo
      return rawText.trim();
    }

    // Compatible con distintos formatos de respuesta de n8n:
    // "texto" | { output } | { message } | { text } | [{ text }] | [{ output }]
    if (typeof data === 'string') return data;

    // Array (formato Last Node de n8n): [{ text: "..." }]
    if (Array.isArray(data)) {
      const first = data[0];
      if (!first) return JSON.stringify(data);
      return first.output ?? first.message ?? first.text ?? first.reply ?? first.response ??
             JSON.stringify(first);
    }

    // Objeto simple
    return data.output ?? data.message ?? data.text ?? data.reply ?? data.response ??
           JSON.stringify(data);
  }

  // ── ENVIAR MENSAJE ────────────────────────────────────────

  async function sendMessage(text) {
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    const trimmed = (text || '').trim();
    if (!trimmed) return;

    // Ocultar sugerencias al enviar cualquier mensaje
    const suggestionsEl = document.getElementById('chat-suggestions');
    if (suggestionsEl) suggestionsEl.innerHTML = '';

    // Mostrar mensaje del usuario
    addMessage(trimmed, 'user');

    // Limpiar input y deshabilitar mientras espera
    if (inputEl) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      inputEl.disabled = true;
    }
    if (sendBtn) sendBtn.disabled = true;

    // Typing delay
    await sleep(CONFIG.typingDelay);
    showTyping();

    try {
      const respuesta = await sendToWebhook(trimmed);
      hideTyping();
      addMessage(respuesta, 'bot');
    } catch (err) {
      console.error('[ChatWidget] Error al contactar webhook:', err);
      hideTyping();
      addMessage(
        'Lo siento, hubo un problema al procesar tu consulta. Por favor, intentá de nuevo o contactanos por WhatsApp. 😊',
        'bot'
      );
    } finally {
      if (inputEl) inputEl.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl) inputEl.focus();
    }
  }

  // ── ABRIR / CERRAR ────────────────────────────────────────

  let welcomeShown = false;

  function toggleChat(fab, panel) {
    isOpen = !isOpen;
    fab.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);

    // Ocultar badge
    const badge = document.getElementById('chat-badge');
    if (badge) badge.style.display = 'none';

    if (isOpen) {
      // Mostrar mensaje de bienvenida la primera vez
      if (!welcomeShown) {
        welcomeShown = true;
        setTimeout(() => {
          addMessage(CONFIG.welcomeMessage, 'bot');
          renderSuggestions();
        }, 180);
      }
      setTimeout(() => {
        const inputEl = document.getElementById('chat-input');
        if (inputEl) inputEl.focus();
      }, 350);
    }
  }

  // ── AUTO-RESIZE TEXTAREA ──────────────────────────────────

  function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
  }

  // ── HELPERS ───────────────────────────────────────────────

  // Convierte Markdown básico a HTML limpio para el chat
  function formatBotText(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // saltos de línea primero
      .replace(/\n/g, '<br>')
      // **negrita** (incluyendo texto con <br> adentro)
      .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
      // *cursiva*
      .replace(/\*([^*<]+?)\*/g, '<em>$1</em>');
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── INICIALIZAR ───────────────────────────────────────────

  function init() {
    const { fab, panel } = buildWidget();

    // Abrir/cerrar al hacer click en el FAB
    fab.addEventListener('click', () => toggleChat(fab, panel));

    // Cerrar al hacer click fuera del panel (solo desktop)
    document.addEventListener('click', (e) => {
      if (isOpen && !panel.contains(e.target) && !fab.contains(e.target)) {
        if (window.innerWidth > 420) {
          toggleChat(fab, panel);
        }
      }
    });

    // Enviar con Enter (Shift+Enter = salto de línea)
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    if (inputEl) {
      inputEl.addEventListener('input', () => {
        autoResizeTextarea(inputEl);
        if (sendBtn) {
          sendBtn.disabled = inputEl.value.trim().length === 0;
        }
      });

      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(inputEl.value);
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (inputEl) sendMessage(inputEl.value);
      });
    }

    // Mostrar badge después de 4 segundos si el chat está cerrado
    setTimeout(() => {
      if (!isOpen) {
        const badge = document.getElementById('chat-badge');
        if (badge) badge.style.display = 'flex';
      }
    }, 4000);
  }

  // Esperar al DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();