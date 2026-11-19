import { respond, aiMode } from '../services/ai.js';
import { readJSON, writeJSON } from '../lib/storage.js';
import { esc, buzz } from '../lib/util.js';

const WELCOME = { role: 'ai', text: "I'm your Tutor. I explain ideas step by step and ask you questions so you do the thinking. I never write your homework. Ask me about a term from your notes.", steps: [] };
const saved = readJSON('chat', null);
let messages = Array.isArray(saved) && saved.length ? saved : [WELCOME];
let context = readJSON('chat-context', null), busy = false, error = '';
const listeners = new Set();
const update = () => listeners.forEach((listener) => listener());
const persist = () => {
  if (!writeJSON('chat', messages.slice(-40)) || !writeJSON('chat-context', context)) {
    error = 'Unable to save this conversation on this device.';
  }
};

export function setTutorContext(next) {
  context = next;
  persist();
  update();
}

const stepHtml = (s) => `<section class="tstep ${s.question ? 'q' : ''}"><h4>${esc(s.title)}</h4>
  ${s.body ? `<p>${esc(s.body)}</p>` : ''}
  ${s.items ? `<ol>${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>` : ''}
  ${s.question ? `<p class="question">${esc(s.question)}</p>` : ''}</section>`;
const msgHtml = (m) => m.role === 'user'
  ? `<div class="msg user"><span class="sr-only">You: </span>${esc(m.text)}</div>`
  : `<div class="msg ai${m.refused ? ' refused' : ''}"><span class="sr-only">Tutor: </span>
      ${m.refused ? '<span class="badge shield">Academic integrity</span>' : ''}${m.beyond ? '<span class="chip outline">Beyond your teacher\'s notes</span>' : ''}
      ${m.notice ? `<p class="step-meta">${esc(m.notice)}</p>` : ''}
      <p>${esc(m.refused ? m.intro : m.text)}</p>${(m.steps || []).map(stepHtml).join('')}</div>`;

async function send(text) {
  text = text.trim();
  if (!text || busy) return;
  const history = messages.slice();
  messages.push({ role: 'user', text });
  busy = true; error = ''; persist(); update();
  try {
    const result = await respond(text, history, context);
    messages.push({ role: 'ai', ...result });
    if (result.refused) buzz([30, 60, 30]);
  } catch (reason) {
    console.error('Tutor response failed:', reason);
    error = 'The tutor could not respond. Please try again.';
  } finally {
    messages = messages.slice(-40);
    busy = false; persist(); update();
  }
}

export function mountTutorChat(container, { compact = false } = {}) {
  container.innerHTML = `
    <p class="step-meta mode">Mode: ${aiMode() === 'live' ? 'Live AI' : 'Offline coach (no API key needed)'} · Guardrail always on</p>
    <div class="chat-context"></div>
    <div class="log" role="log" aria-live="polite" aria-label="Conversation"></div>
    <p class="step-meta chat-error" role="status" hidden></p>
    <form class="composer"><input name="chat-input" aria-label="Message your tutor" autocomplete="off" maxlength="500" placeholder="Ask about a concept…" />
      <button class="btn primary" type="submit">Send</button></form>
    ${compact ? '<button class="btn ghost sm" type="button" data-open-tutor>Continue in Tutor AI</button>' : '<button class="btn ghost sm" type="button" data-clear-chat>Clear chat</button>'}`;
  const log = container.querySelector('.log'), input = container.querySelector('[name=chat-input]');
  const paint = () => {
    log.innerHTML = messages.map(msgHtml).join('') + (busy ? '<div class="msg ai typing" aria-label="Tutor is typing"><i></i><i></i><i></i></div>' : '');
    log.scrollTop = log.scrollHeight;
    container.querySelector('.chat-context').innerHTML = context
      ? `<span class="step-meta">Studying: ${esc(context.term)} · ${esc(context.title)}</span> <button class="btn ghost sm" type="button" data-clear-context>Change topic</button>` : '';
    const status = container.querySelector('.chat-error');
    status.hidden = !error; status.textContent = error;
    container.querySelector('[type=submit]').disabled = busy;
    const clear = container.querySelector('[data-clear-chat]');
    if (clear) clear.disabled = busy;
  };
  const submit = (event) => {
    event.preventDefault();
    if (!input.value.trim() || busy) return;
    const text = input.value; input.value = ''; send(text);
  };
  const click = (event) => {
    if (event.target.closest('[data-clear-context]')) setTutorContext(null);
    if (event.target.closest('[data-clear-chat]') && !busy) { messages = [WELCOME]; error = ''; persist(); update(); }
    if (event.target.closest('[data-open-tutor]')) {
      container.closest('dialog')?.close();
      location.hash = '#/tutor';
    }
  };
  container.addEventListener('submit', submit);
  container.addEventListener('click', click);
  listeners.add(paint); paint();
  return () => { listeners.delete(paint); container.removeEventListener('submit', submit); container.removeEventListener('click', click); };
}

export function askTutor(text) { return send(text); }
