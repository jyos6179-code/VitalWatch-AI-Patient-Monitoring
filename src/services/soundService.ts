/**
 * Web Audio API synthesized medical telemetry sounds
 * Clean tones conforming to medical alarm ergonomics (soft sine chimes)
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft single ping (new vital tick or selection)
  public playPing() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio autoplay policy catch
    }
  }

  // Medium warning tone (two soft chimes)
  public playWarning() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const playTone = (freq: number, startDelay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + startDelay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + 0.2);
      };

      playTone(659.25, 0); // E5
      playTone(523.25, 0.16); // C5
    } catch {
      // Graceful fallback
    }
  }

  // Critical alarm chime (triad pulse)
  public playCriticalAlarm() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const playChime = (freq: number, startDelay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + startDelay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + 0.24);
      };

      playChime(784.0, 0); // G5
      playChime(659.25, 0.14); // E5
      playChime(880.0, 0.28); // A5
    } catch {
      // Graceful fallback
    }
  }
}

export const soundService = new SoundService();
