// Image recognition: MindAR image tracking (mind-ar 1.2.5 + three 0.160.0, the same pins
// as Noh_Masks and Ramen_Builder) watches the back camera for the Nebuta float picture.
// Unlike Noh_Masks it keeps running after the picture is found: the live camera is the
// only background of this AR experience, and found / lost drive the status pill.

const params = new URLSearchParams(location.search);
export const TARGET_SRC = params.get('target') || './targets.mind';

let current = null;

export async function scan(container, { onStatus, onFound, onLost }){
  stopScan();
  onStatus('Loading the scanner…');
  const { MindARThree } = await import('mindar-image-three');
  const mindar = new MindARThree({
    container, imageTargetSrc: TARGET_SRC, uiScanning: 'no', uiLoading: 'no', uiError: 'no',
    filterMinCF: 0.001, filterBeta: 1000, warmupTolerance: 3, missTolerance: 10,
  });
  current = mindar;
  const anchor = mindar.addAnchor(0);
  anchor.onTargetFound = () => onFound();
  anchor.onTargetLost = () => onLost?.();
  onStatus('Starting camera…');
  try { await mindar.start(); }
  catch (e){ stopScan(); throw e || new Error('camera unavailable'); }
  mindar.renderer.setAnimationLoop(() => mindar.renderer.render(mindar.scene, mindar.camera));
  onStatus('Looking for the picture…');
}

export const scanning = () => !!current;

export function stopScan(){
  if (!current) return;
  const m = current;
  current = null;
  try { m.renderer.setAnimationLoop(null); } catch { /* fine */ }
  try { m.controller.stopProcessVideo(); } catch { /* fine */ }
  try { m.stop(); } catch { /* never started */ }
  try { m.renderer.dispose(); } catch { /* fine */ }
  const c = m.container;
  if (c){ c.querySelectorAll('video').forEach((v) => v.srcObject?.getTracks?.().forEach((t) => t.stop())); c.innerHTML = ''; }
}

// ?demo=1 skips the picture but keeps the camera as the background.
export async function plainCamera(container){
  stopScan();
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  const v = document.createElement('video');
  Object.assign(v, { srcObject: stream, muted: true, playsInline: true, autoplay: true });
  v.setAttribute('playsinline', '');
  v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
  container.innerHTML = ''; container.appendChild(v);
  await v.play().catch(() => {});
}
