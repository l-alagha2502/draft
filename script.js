const modes = {
  pomodoro: { name: 'Classic Pomodoro', focus: 25, rest: 5 },
  rule5217: { name: '52 / 17 Rule', focus: 52, rest: 17 },
  ultradian: { name: '90-Minute Ultradian', focus: 90, rest: 20 },
  rule50: { name: 'Rule of 50', focus: 50, rest: 10 },
  desktime: { name: 'Desktime 112 / 26', focus: 112, rest: 26 }
};

const root = document.documentElement;
const display = document.querySelector('#timer-display');
const startButton = document.querySelector('#start-button');
const startLabel = document.querySelector('#start-label');
const stateLabel = document.querySelector('#timer-state');
const sessionLabel = document.querySelector('#session-label');
const completedCount = document.querySelector('#completed-count');
const themeToggle = document.querySelector('#theme-toggle');
const modeDialog = document.querySelector('#mode-dialog');
const modePickerValue = document.querySelector('#mode-picker-value');
let selectedMode = localStorage.getItem('draft-mode') || 'pomodoro';
let isFocus = true;
let isRunning = false;
let secondsLeft = modes[selectedMode].focus * 60;
let intervalId = null;
let completed = Number(localStorage.getItem('draft-completed') || 0);

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#0E0E11' : '#FAF9F6');
  localStorage.setItem('draft-theme', theme);
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function render() {
  const time = formatTime(secondsLeft);
  display.textContent = time;
  document.title = isRunning ? `(${time}) Draft.` : 'Draft.';
  sessionLabel.textContent = isFocus ? 'Focus session' : 'Recovery session';
  startLabel.textContent = isRunning ? 'Pause focus' : 'Start focus';
  startButton.querySelector('.play-glyph').style.transform = isRunning ? 'rotate(90deg)' : '';
  stateLabel.textContent = isRunning ? (isFocus ? 'In the zone' : 'Take your time') : (isFocus ? 'Ready when you are' : 'A small pause');
  completedCount.textContent = completed;
  modePickerValue.textContent = modes[selectedMode].name;
}

function beep() {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.45);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.5);
  } catch (error) { /* Audio is optional when unavailable. */ }
}

function nextSession() {
  beep();
  if (isFocus) completed += 1;
  localStorage.setItem('draft-completed', completed);
  isFocus = !isFocus;
  secondsLeft = (isFocus ? modes[selectedMode].focus : modes[selectedMode].rest) * 60;
  render();
}

function setRunning(value) {
  isRunning = value;
  window.clearInterval(intervalId);
  if (isRunning) {
    intervalId = window.setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) nextSession();
      render();
    }, 1000);
  }
  render();
}

function selectMode(modeKey) {
  selectedMode = modeKey;
  isFocus = true;
  secondsLeft = modes[modeKey].focus * 60;
  setRunning(false);
  localStorage.setItem('draft-mode', modeKey);
  document.querySelectorAll('.mode-item').forEach((item) => {
    const active = item.dataset.mode === modeKey;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', active);
  });
  modeDialog.hidden = true;
}

themeToggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
startButton.addEventListener('click', () => setRunning(!isRunning));
document.querySelector('#reset-button').addEventListener('click', () => {
  isFocus = true;
  secondsLeft = modes[selectedMode].focus * 60;
  setRunning(false);
});
document.querySelector('#skip-button').addEventListener('click', nextSession);
document.querySelector('#mode-picker').addEventListener('click', () => { modeDialog.hidden = false; });
document.querySelector('#mode-dialog-close').addEventListener('click', () => { modeDialog.hidden = true; });
modeDialog.addEventListener('click', (event) => { if (event.target === modeDialog) modeDialog.hidden = true; });
document.querySelectorAll('.mode-item').forEach((item) => item.addEventListener('click', () => selectMode(item.dataset.mode)));
document.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea, select')) return;
  if (event.code === 'Space') { event.preventDefault(); setRunning(!isRunning); }
  if (event.key.toLowerCase() === 'r') { isFocus = true; secondsLeft = modes[selectedMode].focus * 60; setRunning(false); }
  if (event.key === 'Escape') modeDialog.hidden = true;
});

applyTheme(localStorage.getItem('draft-theme') || 'light');
selectMode(selectedMode);
