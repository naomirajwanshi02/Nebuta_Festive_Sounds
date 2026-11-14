// The sound note strip: a music-app style player for one track.
// Play / pause, ±10 s, a seek bar, time played on the left and time left on the right.
// Optionally the last TRIM_END seconds of the voice note can be cut (2 for this note): the track ends there and every
// time on screen is measured against the trimmed length.

export const TRIM_END = 2;

const fmt = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  s = Math.round(s);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const ICON_PLAY = 'M8 5.5v13l11-6.5z';
const ICON_PAUSE = 'M7 5h3.6v14H7zM13.4 5H17v14h-3.6z';
const ICON_AGAIN = 'M12 5a7 7 0 1 1-7 7h2.4A4.6 4.6 0 1 0 12 7.4V10L7.6 6.2 12 2.4z';

export function createPlayer(audio, $){
  let dragging = false;
  let done = false; // reached the trimmed end
  const ui = $('player');
  const len = () => (isFinite(audio.duration) ? Math.max(0, audio.duration - TRIM_END) : 0);

  function checkEnd(){
    const d = len();
    if (!done && d > 0 && audio.currentTime >= d){
      done = true;
      audio.pause();
      audio.currentTime = d;
      state();
    }
  }
  function paint(){
    const d = len(), t = Math.min(audio.currentTime, d);
    const p = d > 0 ? t / d : 0;
    if (!dragging) $('seek').value = Math.round(p * 1000);
    const shown = dragging ? ($('seek').value / 1000) * d : t;
    $('seek').style.setProperty('--p', `${(dragging ? $('seek').value / 10 : p * 100).toFixed(2)}%`);
    $('tNow').textContent = fmt(shown);
    $('tLeft').textContent = '-' + fmt(d - shown);
  }
  function state(){
    const ended = done || audio.ended;
    const playing = !audio.paused && !ended;
    ui.classList.toggle('playing', playing);
    $('playIcon').setAttribute('d', playing ? ICON_PAUSE : ended ? ICON_AGAIN : ICON_PLAY);
    $('playBtn').setAttribute('aria-label', playing ? 'Pause' : ended ? 'Play again' : 'Play');
    $('trackState').textContent = playing ? 'Playing' : ended ? 'Finished' : 'Paused';
  }

  const play = () => {
    if (done || audio.ended || audio.currentTime >= len() - 0.05){ done = false; audio.currentTime = 0; }
    return audio.play().catch((e) => { console.warn(e); state(); });
  };
  const toggle = () => { if (audio.paused || done || audio.ended) play(); else audio.pause(); };
  const skip = (s) => {
    const d = len();
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + s), d);
    done = false; checkEnd(); paint(); state();
  };

  $('playBtn').addEventListener('click', toggle);
  $('back10').addEventListener('click', () => skip(-10));
  $('fwd10').addEventListener('click', () => skip(10));
  $('seek').addEventListener('input', () => { dragging = true; paint(); });
  $('seek').addEventListener('change', () => {
    audio.currentTime = ($('seek').value / 1000) * len();
    dragging = false; done = false; checkEnd(); paint(); state();
  });
  ['timeupdate', 'loadedmetadata', 'durationchange', 'seeked'].forEach((e) => audio.addEventListener(e, () => { checkEnd(); paint(); }));
  ['play', 'pause', 'ended', 'playing'].forEach((e) => audio.addEventListener(e, state));
  // smooth progress between timeupdate events, and a precise stop at the trimmed end
  (function tick(){ if (!audio.paused){ checkEnd(); if (!dragging) paint(); } requestAnimationFrame(tick); })();
  paint(); state();

  return { play, pause: () => audio.pause(), toggle };
}
