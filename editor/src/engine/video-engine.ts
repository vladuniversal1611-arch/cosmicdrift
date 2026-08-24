// Core canvas-based rendering / compositing engine for the preview.

import { Clip, EasingType, Effect, Keyframe, MediaFile, Project, Track } from '../types';

type MediaEl = HTMLVideoElement | HTMLImageElement;

function applyEasing(t: number, easing: EasingType): number {
  switch (easing) {
    case 'easeIn':
      return t * t;
    case 'easeOut':
      return 1 - (1 - t) * (1 - t);
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default:
      return t;
  }
}

function interpolateKeyframes(keyframes: Keyframe[], time: number, property: string, fallback: number): number {
  const relevant = keyframes.filter((k) => k.property === property).sort((a, b) => a.time - b.time);
  if (relevant.length === 0) return fallback;
  if (time <= relevant[0].time) return relevant[0].value;
  if (time >= relevant[relevant.length - 1].time) return relevant[relevant.length - 1].value;
  for (let i = 0; i < relevant.length - 1; i++) {
    const a = relevant[i];
    const b = relevant[i + 1];
    if (time >= a.time && time <= b.time) {
      const span = b.time - a.time || 1;
      const t = applyEasing((time - a.time) / span, b.easing);
      return a.value + (b.value - a.value) * t;
    }
  }
  return fallback;
}

function cssFilterString(filters: Record<string, number>): string {
  const parts: string[] = [];
  const brightness = 1 + (filters.brightness || 0) / 100;
  const contrast = 1 + (filters.contrast || 0) / 100;
  const saturate = 1 + (filters.saturation || 0) / 100;
  parts.push(`brightness(${Math.max(0, brightness)})`);
  parts.push(`contrast(${Math.max(0, contrast)})`);
  parts.push(`saturate(${Math.max(0, saturate)})`);
  if (filters.hue) parts.push(`hue-rotate(${filters.hue}deg)`);
  if (filters.blur) parts.push(`blur(${Math.max(0, filters.blur) / 10}px)`);
  if (filters.exposure) parts.push(`brightness(${1 + filters.exposure / 150})`);
  if (filters.tint) parts.push(`sepia(${Math.min(1, Math.abs(filters.tint) / 100)})`);
  return parts.join(' ');
}

export class VideoEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaCache: Map<string, MediaEl> = new Map();
  private animationFrameId: number | null = null;
  private lastRenderedTime = -1;
  private playing = false;
  private playbackStartWallTime = 0;
  private playbackStartMediaTime = 0;

  onTimeUpdate: ((time: number) => void) | null = null;
  onEnded: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
  }

  async loadMedia(mediaFile: MediaFile): Promise<void> {
    if (this.mediaCache.has(mediaFile.id) || !mediaFile.blobUrl) return;
    return new Promise((resolve, reject) => {
      if (mediaFile.type === 'video') {
        const video = document.createElement('video');
        video.src = mediaFile.blobUrl!;
        video.crossOrigin = 'anonymous';
        video.muted = false;
        video.preload = 'auto';
        video.playsInline = true;
        video.addEventListener('loadeddata', () => resolve(), { once: true });
        video.addEventListener('error', () => reject(new Error('video load failed')), { once: true });
        this.mediaCache.set(mediaFile.id, video);
      } else if (mediaFile.type === 'image' || mediaFile.type === 'gif') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = mediaFile.blobUrl!;
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load failed'));
        this.mediaCache.set(mediaFile.id, img);
      } else {
        resolve();
      }
    });
  }

  unloadMedia(mediaId: string) {
    const el = this.mediaCache.get(mediaId);
    if (el instanceof HTMLVideoElement) {
      el.pause();
      el.src = '';
    }
    this.mediaCache.delete(mediaId);
  }

  getMediaElement(mediaId: string): MediaEl | undefined {
    return this.mediaCache.get(mediaId);
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  renderFrame(time: number, project: Project, mediaLibrary: MediaFile[]) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = project.backgroundColor || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sortedTracks = [...project.tracks].sort((a, b) => a.order - b.order);
    for (const track of sortedTracks) {
      if (!track.visible || track.type === 'audio') continue;
      const activeClip = track.clips.find(
        (c) => time >= c.startTime && time < c.startTime + c.duration
      );
      if (activeClip) {
        this.renderClip(activeClip, time, project, mediaLibrary, track);
      }
    }
    ctx.restore();
    this.lastRenderedTime = time;
  }

  private renderClip(clip: Clip, time: number, project: Project, mediaLibrary: MediaFile[], track: Track) {
    const { ctx, canvas } = this;
    const localTime = time - clip.startTime;

    // keyframe-driven properties (fallback to static clip properties)
    const x = interpolateKeyframes(clip.keyframes, localTime, 'x', clip.x);
    const y = interpolateKeyframes(clip.keyframes, localTime, 'y', clip.y);
    const scaleX = interpolateKeyframes(clip.keyframes, localTime, 'scaleX', clip.scaleX);
    const scaleY = interpolateKeyframes(clip.keyframes, localTime, 'scaleY', clip.scaleY);
    const rotation = interpolateKeyframes(clip.keyframes, localTime, 'rotation', clip.rotation);
    let opacity = interpolateKeyframes(clip.keyframes, localTime, 'opacity', clip.opacity);

    // fades
    if (clip.fadeInDuration > 0 && localTime < clip.fadeInDuration) {
      opacity *= localTime / clip.fadeInDuration;
    }
    if (clip.fadeOutDuration > 0 && localTime > clip.duration - clip.fadeOutDuration) {
      opacity *= Math.max(0, (clip.duration - localTime) / clip.fadeOutDuration);
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.filter = cssFilterString(clip.filters || {});

    const cx = (x / 100) * canvas.width + canvas.width / 2;
    const cy = (y / 100) * canvas.height + canvas.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scaleX * (clip.flipX ? -1 : 1), scaleY * (clip.flipY ? -1 : 1));

    if (clip.type === 'text') {
      this.renderText(clip, ctx, canvas);
    } else {
      const media = mediaLibrary.find((m) => m.id === clip.mediaId);
      const el = media ? this.mediaCache.get(media.id) : undefined;
      const drawW = (clip.width / 100) * canvas.width;
      const drawH = (clip.height / 100) * canvas.height;

      if (el instanceof HTMLVideoElement) {
        this.syncVideoTime(el, clip, localTime);
        this.drawMediaWithCrop(el, clip, drawW, drawH);
      } else if (el instanceof HTMLImageElement) {
        this.drawMediaWithCrop(el, clip, drawW, drawH);
      } else {
        // media not yet loaded — draw placeholder
        ctx.fillStyle = 'rgba(124, 58, 237, 0.25)';
        ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
      }
      this.applyStylizedEffects(clip, ctx, drawW, drawH);
      if (clip.type === 'video' && this.hasVignette(clip)) {
        this.drawVignette(ctx, drawW, drawH, clip.filters.vignette || 0);
      }
    }

    ctx.restore();
  }

  private hasVignette(clip: Clip) {
    return (clip.filters.vignette || 0) > 0;
  }

  private drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
    const grad = ctx.createRadialGradient(0, 0, Math.min(w, h) * 0.2, 0, 0, Math.max(w, h) * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${Math.min(1, amount / 100)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  private drawMediaWithCrop(el: MediaEl, clip: Clip, drawW: number, drawH: number) {
    const { ctx } = this;
    const naturalW = el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
    const naturalH = el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
    if (!naturalW || !naturalH) return;

    const sx = clip.cropLeft * naturalW;
    const sy = clip.cropTop * naturalH;
    const sw = naturalW * (1 - clip.cropLeft - clip.cropRight);
    const sh = naturalH * (1 - clip.cropTop - clip.cropBottom);

    try {
      ctx.drawImage(el, sx, sy, Math.max(1, sw), Math.max(1, sh), -drawW / 2, -drawH / 2, drawW, drawH);
    } catch (e) {
      // media may not be ready yet; ignore
    }
  }

  private applyStylizedEffects(clip: Clip, ctx: CanvasRenderingContext2D, w: number, h: number) {
    for (const effect of clip.effects) {
      if (!effect.enabled) continue;
      switch (effect.type) {
        case 'glow': {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (effect.params.intensity || 50) / 200;
          ctx.filter = `blur(${(effect.params.radius || 10)}px)`;
          ctx.drawImage(ctx.canvas, -w / 2, -h / 2, w, h, -w / 2, -h / 2, w, h);
          ctx.restore();
          break;
        }
        case 'noise': {
          // subtle overlay, cheap approximation
          ctx.save();
          ctx.globalAlpha = (effect.params.amount || 20) / 300;
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 40; i++) {
            ctx.fillRect(
              -w / 2 + Math.random() * w,
              -h / 2 + Math.random() * h,
              1,
              1
            );
          }
          ctx.restore();
          break;
        }
        default:
          break;
      }
    }
  }

  private renderText(clip: Clip, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const style = clip.textStyle;
    if (!style || !clip.text) return;
    const drawW = (clip.width / 100) * canvas.width;
    const drawH = (clip.height / 100) * canvas.height;

    ctx.globalAlpha *= style.opacity;

    if (style.backgroundOpacity > 0) {
      ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
      ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
    }

    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.textAlign = style.textAlign;
    ctx.textBaseline = 'middle';

    const lines = clip.text.split('\n');
    const lineHeight = style.fontSize * style.lineHeight;
    const totalHeight = lines.length * lineHeight;
    let startY = -totalHeight / 2 + lineHeight / 2;

    const alignX = style.textAlign === 'left' ? -drawW / 2 : style.textAlign === 'right' ? drawW / 2 : 0;

    for (const line of lines) {
      const chars = style.letterSpacing !== 0 ? line.split('') : [line];
      let drawText = line;

      if (style.shadowBlur > 0 || style.shadowOffsetX || style.shadowOffsetY) {
        ctx.shadowColor = style.shadowColor;
        ctx.shadowBlur = style.shadowBlur;
        ctx.shadowOffsetX = style.shadowOffsetX;
        ctx.shadowOffsetY = style.shadowOffsetY;
      }

      if (style.gradient) {
        const grad = ctx.createLinearGradient(-drawW / 2, 0, drawW / 2, 0);
        style.gradient.colors.forEach((c, i) =>
          grad.addColorStop(i / (style.gradient!.colors.length - 1 || 1), c)
        );
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = style.color;
      }

      if (style.strokeWidth > 0) {
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeStyle = style.strokeColor;
        ctx.strokeText(drawText, alignX, startY);
      }
      ctx.fillText(drawText, alignX, startY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      startY += lineHeight;
      void chars;
    }
  }

  private syncVideoTime(video: HTMLVideoElement, clip: Clip, localTime: number) {
    const speed = clip.speed || 1;
    let sourceTime = clip.trimStart + localTime * speed;
    if (clip.reversed) {
      sourceTime = clip.originalDuration - clip.trimEnd - localTime * speed;
    }
    sourceTime = Math.max(0, Math.min(video.duration || clip.originalDuration, sourceTime));
    if (!this.playing) {
      if (Math.abs(video.currentTime - sourceTime) > 0.05) {
        video.currentTime = sourceTime;
      }
    }
    video.volume = clip.muted ? 0 : Math.max(0, Math.min(1, clip.volume));
    video.playbackRate = Math.max(0.1, Math.min(4, speed));
  }

  // -------------------------------------------------------------------------
  // Playback
  // -------------------------------------------------------------------------

  play(getTime: () => number, project: Project, mediaLibrary: MediaFile[], duration: number) {
    this.playing = true;
    this.playbackStartWallTime = performance.now();
    this.playbackStartMediaTime = getTime();

    // start playing any active video elements
    this.syncMediaPlayback(getTime(), project, mediaLibrary, true);

    const step = () => {
      if (!this.playing) return;
      const elapsed = (performance.now() - this.playbackStartWallTime) / 1000;
      const time = this.playbackStartMediaTime + elapsed;
      if (time >= duration) {
        this.pause();
        this.onEnded?.();
        return;
      }
      this.renderFrame(time, project, mediaLibrary);
      this.onTimeUpdate?.(time);
      this.animationFrameId = requestAnimationFrame(step);
    };
    this.animationFrameId = requestAnimationFrame(step);
  }

  private syncMediaPlayback(time: number, project: Project, mediaLibrary: MediaFile[], play: boolean) {
    project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (clip.type !== 'video' && clip.type !== 'audio') return;
        const media = mediaLibrary.find((m) => m.id === clip.mediaId);
        if (!media) return;
        const el = this.mediaCache.get(media.id);
        if (!(el instanceof HTMLVideoElement)) return;
        const active = time >= clip.startTime && time < clip.startTime + clip.duration;
        if (active && play && !track.muted && !clip.muted) {
          this.syncVideoTime(el, clip, time - clip.startTime);
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      });
    });
  }

  pause() {
    this.playing = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.mediaCache.forEach((el) => {
      if (el instanceof HTMLVideoElement) el.pause();
    });
  }

  seek(time: number, project: Project, mediaLibrary: MediaFile[]) {
    this.renderFrame(time, project, mediaLibrary);
  }

  isPlaying() {
    return this.playing;
  }

  destroy() {
    this.pause();
    this.mediaCache.forEach((el) => {
      if (el instanceof HTMLVideoElement) {
        el.pause();
        el.src = '';
      }
    });
    this.mediaCache.clear();
  }
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((ch) => ch + ch).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export { interpolateKeyframes, applyEasing };
