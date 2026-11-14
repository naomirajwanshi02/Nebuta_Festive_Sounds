// Nebuta Festive Sounds: allow the camera → scan the Nebuta float picture →
// a short explanatory note → OK starts the sound note, and the notes at the top
// (the float, then the festival) slide over one another every 12 seconds.
//
// ?demo=1     skip the picture (camera still on as the background)
// ?preview=1  no camera at all

import { NOTES, NOTE_MS } from './data.js';
import { scan, stopScan, scanning, plainCamera } from './scan.js';
import { createPlayer } from './player.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const S = { phase: 'perm', inView: false, note: 0, noteT: 0, noteStart: 0 };

const overlay = (id, on) => $(id).classList.toggle('on', on);
const show = (id) => document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* no vibration */ } };
const pop = (el) => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

const audio = $('audio');
const player = createPlayer(audio, $);

// ------------------------------------------------------------ 0 · camera permission
async function cameraGranted(){
  try { return (await navigator.permissions?.query({ name: 'camera' }))?.state === 'granted'; } catch { return false; }
}
async function openPerm(){
  S.phase = 'perm';
  overlay('guide', false);
  if (await cameraGranted()) return openScan();
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){
    $('permStatus').textContent = 'This browser cannot use the camera here. Open the page over https in Safari or Chrome.';
    $('permBtn').disabled = true;
  }
  show('perm');
}
async function askCamera(){
  $('permBtn').disabled = true;
  $('permStatus').textContent = 'Waiting for you to tap “Allow”…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    stream.getTracks().forEach((t) => t.stop());
    $('permStatus').textContent = '';
    show(null);
    openScan();
  } catch (err) {
    console.error(err);
    $('permStatus').textContent = err?.name === 'NotAllowedError'
      ? 'The camera was blocked. Tap the “aA” or lock icon next to the address, allow the camera for this site, then tap Allow camera again.'
      : 'The camera did not start. Close other apps that use the camera and try again.';
  } finally { $('permBtn').disabled = false; }
}

// ------------------------------------------------------------ 1 · find the picture
async function openScan(){
  S.phase = 'scan';
  show(null); overlay('hud', false); overlay('guide', true);
  $('scanRetry').hidden = true;
  if (scanning()){ $('scanStatus').textContent = 'Looking for the picture…'; return; }
  $('scanStatus').textContent = 'Starting camera…';
  try {
    await scan($('ar'), { onStatus: (t) => { if (S.phase === 'scan') $('scanStatus').textContent = t; }, onFound, onLost });
  } catch (err) {
    console.error(err);
    const msg = String(err?.message || err?.name || err || '');
    $('scanStatus').textContent = /mind|fetch|404/i.test(msg) ? `Could not load the picture data (${msg}).`
      : 'Camera not available. Allow camera access for this site in your browser settings, then tap Try again.';
    $('scanRetry').hidden = false;
  }
}
function onFound(){
  S.inView = true;
  setHint();
  if (S.phase !== 'scan') return;
  S.phase = 'found';
  overlay('guide', false);
  buzz(40);
  overlay('found', true);
  setTimeout(() => { overlay('found', false); openIntro(); }, 1300);
}
function onLost(){ S.inView = false; setHint(); }

// ------------------------------------------------------------ 2 · explanatory note
function openIntro(){
  S.phase = 'intro';
  overlay('guide', false);
  $('camStatus').textContent = '';
  show('intro');
}

// OK: the tap also unlocks audio playback on phones.
async function begin(){
  $('goBtn').disabled = true;
  player.play();
  // if the camera is not running yet (skipped the picture), ask for it now
  if (!scanning() && !q.has('preview') && !$('ar').querySelector('video')){
    try { await plainCamera($('ar')); }
    catch (err) {
      console.error(err);
      $('camStatus').textContent = 'The camera did not start, so there is no AR view. You can still listen.';
      $('ar').classList.add('preview');
      await new Promise((r) => setTimeout(r, 1600));
    }
  }
  $('goBtn').disabled = false;
  S.phase = 'listen';
  show(null);
  overlay('hud', true);
  pop($('player'));
  buildNotes();
  goNote(0);
  setHint();
}

// ------------------------------------------------------------ 3 · the notes at the top
function buildNotes(){
  if ($('noteTrack').children.length) return;
  $('noteTrack').innerHTML = NOTES.map((n, i) => `
    <article class="note" id="note${i}" aria-roledescription="slide" aria-label="${i + 1} of ${NOTES.length}">
      <h2>${n.title} <small>${n.jp}</small></h2>
      <p>${n.text}</p>
    </article>`).join('');
  $('noteDots').innerHTML = NOTES.map((n, i) => `<button role="tab" aria-label="${n.title}" data-i="${i}"></button>`).join('');
  $('noteDots').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => goNote(+b.dataset.i)));
  // swipe left / right
  let x0 = null;
  $('notes').addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  $('notes').addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) goNote(S.note + (dx < 0 ? 1 : -1));
  });
}
function goNote(i){
  S.note = (i + NOTES.length) % NOTES.length;
  $('noteTrack').style.transform = `translateX(${-100 * S.note}%)`;
  NOTES.forEach((_, k) => $(`note${k}`).setAttribute('aria-hidden', k !== S.note));
  $('noteDots').querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-selected', k === S.note));
  clearTimeout(S.noteT);
  S.noteT = setTimeout(() => { if (S.phase === 'listen') goNote(S.note + 1); }, NOTE_MS);
}

function setHint(){
  const h = $('hint');
  if (q.has('preview') || $('ar').classList.contains('preview')){ h.textContent = 'Listening without the camera'; h.classList.remove('live'); return; }
  if (!scanning()){ h.textContent = 'Camera on'; h.classList.add('live'); return; }
  h.classList.toggle('live', S.inView);
  h.textContent = S.inView ? 'Nebuta float in view' : 'Picture out of view · the sounds keep playing';
}

// ------------------------------------------------------------ wiring
$('permBtn').addEventListener('click', askCamera);
$('scanRetry').addEventListener('click', () => { stopScan(); openScan(); });
$('scanSkip').addEventListener('click', () => { stopScan(); overlay('guide', false); openIntro(); });
$('goBtn').addEventListener('click', begin);
$('closeBtn').addEventListener('click', () => { player.pause(); clearTimeout(S.noteT); overlay('hud', false); openScan(); });
$('errBtn').addEventListener('click', () => { $('err').hidden = true; location.reload(); });

// MindAR's own listeners can throw after a failed camera start; the screen already says what to do.
const fromTracker = (s) => /mind-?ar/i.test(String(s));
addEventListener('error', (e) => { const s = e.error?.stack || e.message; if (fromTracker(s + e.filename)) return; $('errText').textContent = String(s); $('err').hidden = false; });
addEventListener('unhandledrejection', (e) => { const s = e.reason?.stack || e.reason; if (fromTracker(s)) return; $('errText').textContent = String(s); $('err').hidden = false; });

window.__nebuta = { S, goNote, begin, audio };

if (q.has('preview')){ $('ar').classList.add('preview'); openIntro(); }
else if (q.has('demo')) openIntro();
else openPerm();
