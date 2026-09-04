import { writeFileSync, mkdirSync, watch } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'dist');

const source = `(() => {
  const SCRIPT = document.currentScript;
  const API = (SCRIPT && SCRIPT.getAttribute('data-api')) || 'http://localhost:3001';
  const TITLE = (SCRIPT && SCRIPT.getAttribute('data-title')) || 'پشتیبانی هوشمند';
  const sessionKey = 'aval_chat_session';
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = 'web_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(sessionKey, sessionId);
  }

  const style = document.createElement('style');
  style.textContent = \`
    .aval-launcher{position:fixed;bottom:20px;left:20px;z-index:99999;border:0;border-radius:999px;background:#0f5c4c;color:#fff;padding:14px 18px;font:600 14px Vazirmatn,Tahoma,sans-serif;cursor:pointer;box-shadow:0 12px 30px rgba(15,92,76,.35)}
    .aval-panel{position:fixed;bottom:80px;left:20px;width:min(360px,calc(100vw - 24px));height:480px;background:#fffcf7;border:1px solid #d9d1c4;border-radius:18px;z-index:99999;display:none;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(28,25,21,.18);font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl}
    .aval-panel.open{display:flex}
    .aval-head{padding:14px 16px;background:linear-gradient(135deg,#0f5c4c,#1a8a72);color:#fff;font-weight:700}
    .aval-msgs{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f7f3ec}
    .aval-msg{max-width:85%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.6}
    .aval-msg.user{align-self:flex-start;background:#efe8dc}
    .aval-msg.bot{align-self:flex-end;background:#dceee8}
    .aval-form{display:flex;gap:8px;padding:12px;border-top:1px solid #d9d1c4;background:#fff}
    .aval-form input{flex:1;border:1px solid #d9d1c4;border-radius:12px;padding:10px 12px}
    .aval-form button{border:0;border-radius:12px;background:#0f5c4c;color:#fff;padding:0 14px;cursor:pointer}
  \`;
  document.head.appendChild(style);

  const launcher = document.createElement('button');
  launcher.className = 'aval-launcher';
  launcher.textContent = 'چت';
  const panel = document.createElement('div');
  panel.className = 'aval-panel';
  panel.innerHTML = \`
    <div class="aval-head">\${TITLE}</div>
    <div class="aval-msgs" id="aval-msgs"></div>
    <form class="aval-form" id="aval-form">
      <input id="aval-input" placeholder="پیام خود را بنویسید..." autocomplete="off" />
      <button type="submit">ارسال</button>
    </form>
  \`;
  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const msgs = panel.querySelector('#aval-msgs');
  const form = panel.querySelector('#aval-form');
  const input = panel.querySelector('#aval-input');

  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = 'aval-msg ' + (role === 'user' ? 'user' : 'bot');
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  launcher.addEventListener('click', () => panel.classList.toggle('open'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    addMsg('user', content);
    try {
      const res = await fetch(API + '/api/channels/web/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content }),
      });
      const data = await res.json();
      addMsg('bot', data.reply || 'پاسخی دریافت نشد');
    } catch (err) {
      addMsg('bot', 'خطا در ارتباط با سرور');
    }
  });

  addMsg('bot', 'سلام! چطور می‌توانم کمکتان کنم؟');
})();
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'chat-widget.js'), source);
console.log('Built widget -> dist/chat-widget.js');

if (process.argv.includes('--watch')) {
  watch(join(__dirname, 'build.mjs'), () => {
    writeFileSync(join(outDir, 'chat-widget.js'), source);
    console.log('Rebuilt widget');
  });
}
