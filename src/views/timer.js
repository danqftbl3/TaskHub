import { getState, toggleStep } from '../lib/store.js';
import { getProfile } from '../lib/profile.js';
import { esc } from '../lib/util.js';
import { createFocusSound } from '../lib/focusSound.js';

let dialog, interval, deadline, remaining = 0, selected = '', finished = false, notify;
const sound = createFocusSound();
let soundPlaying = false;

function stopSound() {
  sound.stop(); soundPlaying = false;
  dialog.querySelector('[data-sound-toggle]').textContent = 'Play sound';
  dialog.querySelector('[data-sound-status]').textContent = 'Sound is off';
}

function refreshSessions(value = '') {
  const select = dialog.querySelector('[name=session]');
  const options = getState().assignments.flatMap((assignment) => assignment.steps.filter((step) => !step.done).map((step) =>
    `<option value="${esc(assignment.id)}:${esc(step.id)}" data-minutes="${step.minutes}">${esc(assignment.title)}: ${esc(step.title)} (${step.minutes} min)</option>`));
  select.innerHTML = `<option value="">No linked session</option>${options.join('')}`;
  select.value = value;
  if (select.selectedIndex < 0) select.value = '';
  selected = select.value;
  dialog.querySelector('[name=minutes]').value = select.selectedOptions[0]?.dataset.minutes || getProfile().prefs.sessionLen;
}

function renderTime() {
  if (deadline) remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const input = dialog.querySelector('[name=minutes]');
  const displaySeconds = remaining || (!finished && input.validity.valid ? Number(input.value) * 60 : 0);
  const minutes = Math.floor(displaySeconds / 60), seconds = displaySeconds % 60;
  dialog.querySelector('[data-time]').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  if (deadline && remaining === 0) {
    clearInterval(interval); deadline = null; finished = true;
    stopSound();
    dialog.querySelector('[data-status]').textContent = 'Time is up';
    notify?.('Focus session finished');
  }
  dialog.querySelector('[data-start]').textContent = deadline ? 'Pause' : remaining && !finished ? 'Resume' : 'Start focus';
  dialog.querySelector('[data-start]').disabled = finished;
  dialog.querySelector('[data-complete]').hidden = !finished || !selected;
  dialog.querySelector('[name=session]').disabled = !!deadline || remaining > 0 || finished;
  dialog.querySelector('[name=minutes]').disabled = !!deadline || remaining > 0 || finished;
}

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'timer-title');
  dialog.innerHTML = `<div class="modal-form focus-timer">
    <div class="modal-head"><h2 id="timer-title">Focus timer</h2><button class="icon-btn" type="button" data-close aria-label="Close">✕</button></div>
    <label class="field"><span>Study session</span><select name="session"></select></label>
    <label class="field"><span>Minutes</span><input name="minutes" type="number" min="1" max="180" required /></label>
    <div class="focus-sound">
      <label class="field"><span>Focus sound</span><select name="sound"><option value="white">White noise</option><option value="pink">Pink noise</option><option value="brown">Brown noise</option></select></label>
      <label class="field"><span>Volume</span><input name="volume" type="range" min="0" max="100" value="25" /></label>
      <button class="btn ghost sm" type="button" data-sound-toggle>Play sound</button>
      <p class="step-meta" data-sound-status role="status">Sound is off</p>
      <p class="step-meta">Sound continues when this window is closed and stops when the timer ends or resets.</p>
    </div>
    <div class="timer-clock" data-time role="timer" aria-label="Time remaining">00:00</div>
    <p class="step-meta timer-status" data-status aria-live="polite">Choose a session or set a length</p>
    <div class="timer-actions"><button class="btn primary" type="button" data-start>Start focus</button><button class="btn ghost" type="button" data-reset>Reset</button></div>
    <button class="btn primary" type="button" data-complete hidden>Mark session done</button>
  </div>`;
  document.body.append(dialog);
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.querySelector('[name=session]').addEventListener('change', (event) => {
    selected = event.target.value;
    const option = event.target.selectedOptions[0];
    if (option.dataset.minutes) dialog.querySelector('[name=minutes]').value = option.dataset.minutes;
    renderTime();
  });
  dialog.querySelector('[name=minutes]').addEventListener('input', renderTime);
  dialog.querySelector('[name=sound]').addEventListener('change', stopSound);
  dialog.querySelector('[name=volume]').addEventListener('input', (event) => sound.setVolume(Number(event.target.value) / 100));
  dialog.querySelector('[data-sound-toggle]').addEventListener('click', async (event) => {
    if (soundPlaying) { stopSound(); return; }
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const started = await sound.play(dialog.querySelector('[name=sound]').value, Number(dialog.querySelector('[name=volume]').value) / 100);
      if (!started) return;
      soundPlaying = true; button.textContent = 'Stop sound';
      dialog.querySelector('[data-sound-status]').textContent = 'Sound is playing';
    } catch (error) {
      console.error('Focus sound failed:', error);
      dialog.querySelector('[data-sound-status]').textContent = 'Could not play sound. Check your browser audio settings.';
    } finally { button.disabled = false; }
  });
  dialog.querySelector('[data-start]').addEventListener('click', () => {
    if (deadline) {
      renderTime();
      if (finished) return;
      remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      clearInterval(interval); deadline = null;
      dialog.querySelector('[data-status]').textContent = 'Paused';
    } else {
      const input = dialog.querySelector('[name=minutes]');
      if (!input.reportValidity()) return;
      if (!remaining) remaining = Number(input.value) * 60;
      selected = dialog.querySelector('[name=session]').value;
      deadline = Date.now() + remaining * 1000;
      dialog.querySelector('[data-status]').textContent = 'Focus session in progress';
      interval = setInterval(renderTime, 250);
    }
    renderTime();
  });
  dialog.querySelector('[data-reset]').addEventListener('click', () => {
    clearInterval(interval); deadline = null; remaining = 0; finished = false;
    stopSound();
    refreshSessions(selected);
    dialog.querySelector('[data-status]').textContent = 'Choose a session or set a length';
    renderTime();
  });
  dialog.querySelector('[data-complete]').addEventListener('click', () => {
    const [assignmentId, stepId] = selected.split(':');
    const step = getState().assignments.find((item) => item.id === assignmentId)?.steps.find((item) => item.id === stepId);
    if (step && !step.done) { toggleStep(assignmentId, stepId); notify?.('Session complete'); }
    else notify?.('This session is already complete or no longer available');
    selected = ''; dialog.querySelector('[data-complete]').hidden = true;
  });
}

export function openFocusTimer({ toast, assignmentId, stepId } = {}) {
  if (!dialog) build();
  notify = toast;
  if (!deadline && !remaining && !finished) {
    refreshSessions(assignmentId && stepId ? `${assignmentId}:${stepId}` : '');
  }
  renderTime();
  if (!dialog.open) dialog.showModal();
}