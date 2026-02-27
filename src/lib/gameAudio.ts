/**
 * PICKEVENT - Game Audio Effects
 * Procedural suspense/roulette sounds via Web Audio API
 */

let audioCtx: AudioContext | null = null;
let activeNodes: { stop: () => void }[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playRouletteSound(durationMs: number): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const dur = durationMs / 1000;

    // Tick sound - rapid clicking that slows down
    const tickCount = 60;
    for (let i = 0; i < tickCount; i++) {
      // Exponential slowdown
      const progress = i / tickCount;
      const timeOffset = progress * progress * dur * 0.9;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Rising pitch for suspense
      osc.frequency.value = 400 + progress * 600;
      osc.type = 'sine';

      const tickStart = now + timeOffset;
      gain.gain.setValueAtTime(0, tickStart);
      gain.gain.linearRampToValueAtTime(0.15, tickStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, tickStart + 0.05);

      osc.start(tickStart);
      osc.stop(tickStart + 0.06);
    }

    // Suspense drone underneath
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(80, now);
    drone.frequency.linearRampToValueAtTime(200, now + dur * 0.9);
    droneGain.gain.setValueAtTime(0.04, now);
    droneGain.gain.linearRampToValueAtTime(0.08, now + dur * 0.8);
    droneGain.gain.linearRampToValueAtTime(0, now + dur);
    drone.start(now);
    drone.stop(now + dur);

    activeNodes.push({
      stop: () => {
        try { drone.stop(); } catch {}
      }
    });
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

export function playRevealSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Triumphant chord
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.05;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
      osc.start(start);
      osc.stop(start + 1.6);
    });
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

export function stopAllAudio(): void {
  activeNodes.forEach(n => n.stop());
  activeNodes = [];
}
