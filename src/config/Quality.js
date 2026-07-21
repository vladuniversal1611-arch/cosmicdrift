/**
 * Quality.js
 * -----------------------------------------------------------------------------
 * A single mutable runtime object for quality + accessibility flags that hot
 * paths read every frame. Config is frozen (authoring defaults); this is the
 * live, player-adjustable layer the SettingsSystem writes to. Keeping it in one
 * place means the renderer, particles, crystals and effects all respond to
 * "Low Performance Mode", "Reduced Motion", "Color-Blind Mode" and "Large UI"
 * without threading settings through every call.
 * -----------------------------------------------------------------------------
 */
import { Config } from './Config.js';

export const Quality = {
  /** Enable expensive glow / shadow passes. */
  highQuality: Config.render.highQuality,
  /** Hard cap on live particles. */
  maxParticles: 400,
  /** 0 = no motion FX, 1 = full. Scales shake / flash / particle counts. */
  animationScale: 1,
  /** Draw distinguishing symbols on crystals for colour-blind players. */
  colorBlind: false,
  /** Multiplier for UI text / button sizing (Large UI mode). */
  uiScale: 1,
};

/**
 * Recompute Quality from a SettingsSystem snapshot. Called on init and whenever
 * an accessibility/performance setting changes.
 */
export function applyQuality(settings) {
  if (!settings) return;
  const lowPerf = !!settings.get('lowPerformance');
  const reduced = !!settings.get('reducedMotion');
  const intensity = settings.get('animationIntensity');
  Quality.highQuality = !lowPerf;
  Quality.maxParticles = lowPerf ? 140 : 400;
  Quality.animationScale = reduced ? 0 : (lowPerf ? 0.6 : 1) * (intensity ?? 1);
  Quality.colorBlind = !!settings.get('colorBlind');
  Quality.uiScale = settings.get('largeUI') ? 1.16 : 1;
}
