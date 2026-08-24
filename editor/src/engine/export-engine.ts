// Export engine: renders the project frame-by-frame to an off-screen canvas
// and encodes it using MediaRecorder + canvas.captureStream().

import { EXPORT_RESOLUTIONS, ExportSettings, MediaFile, Project } from '../types';
import { VideoEngine } from './video-engine';

export interface ExportProgress {
  frame: number;
  totalFrames: number;
  percent: number;
  stage: 'preparing' | 'rendering' | 'encoding' | 'done' | 'error';
  message?: string;
}

const QUALITY_BITRATE: Record<ExportSettings['quality'], number> = {
  low: 2_500_000,
  medium: 6_000_000,
  high: 12_000_000,
  maximum: 24_000_000,
};

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return 'video/webm';
}

export function computeExportDimensions(project: Project, settings: ExportSettings): { width: number; height: number } {
  const targetHeight = EXPORT_RESOLUTIONS[settings.resolution];
  const aspect = project.width / project.height;
  let height = targetHeight;
  let width = Math.round(height * aspect);
  if (width % 2 !== 0) width += 1;
  if (height % 2 !== 0) height += 1;
  return { width, height };
}

export class ExportEngine {
  private canvas: HTMLCanvasElement;
  private engine: VideoEngine;
  private cancelled = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.engine = new VideoEngine(this.canvas);
  }

  cancel() {
    this.cancelled = true;
  }

  async export(
    project: Project,
    mediaLibrary: MediaFile[],
    settings: ExportSettings,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob> {
    this.cancelled = false;
    const { width, height } = computeExportDimensions(project, settings);
    this.canvas.width = width;
    this.canvas.height = height;

    onProgress({ frame: 0, totalFrames: 0, percent: 0, stage: 'preparing' });

    // preload all media referenced by clips
    const usedMediaIds = new Set<string>();
    project.tracks.forEach((t) => t.clips.forEach((c) => usedMediaIds.add(c.mediaId)));
    for (const media of mediaLibrary) {
      if (usedMediaIds.has(media.id)) {
        try {
          await this.engine.loadMedia(media);
        } catch {
          // continue without this media
        }
      }
    }

    const fps = settings.fps;
    const duration = project.duration;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));

    const stream = this.canvas.captureStream(0); // manual frame emission
    const videoTrack = stream.getVideoTracks()[0] as any;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: QUALITY_BITRATE[settings.quality],
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const recordingDone = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start();

    onProgress({ frame: 0, totalFrames, percent: 0, stage: 'rendering' });

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.cancelled) {
        recorder.stop();
        throw new Error('Export cancelled');
      }
      const time = frame / fps;
      this.engine.renderFrame(time, project, mediaLibrary);

      if (typeof videoTrack.requestFrame === 'function') {
        videoTrack.requestFrame();
      }

      // yield to allow the frame to be captured & UI to update
      await new Promise((r) => setTimeout(r, 1000 / fps));

      if (frame % 3 === 0 || frame === totalFrames - 1) {
        onProgress({
          frame,
          totalFrames,
          percent: Math.round(((frame + 1) / totalFrames) * 90),
          stage: 'rendering',
        });
      }
    }

    onProgress({ frame: totalFrames, totalFrames, percent: 92, stage: 'encoding' });
    recorder.stop();
    await recordingDone;

    onProgress({ frame: totalFrames, totalFrames, percent: 100, stage: 'done' });

    const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
    return blob;
  }

  destroy() {
    this.engine.destroy();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
