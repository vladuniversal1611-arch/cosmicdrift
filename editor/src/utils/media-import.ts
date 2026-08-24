// Media import: reads files, decodes metadata, generates thumbnails/waveforms.

import { v4 as uuidv4 } from 'uuid';
import { MediaFile } from '../types';

const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogv'];
const AUDIO_EXT = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'];
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg'];
const GIF_EXT = ['gif'];

function extOf(name: string): string {
  const parts = name.split('.');
  return parts[parts.length - 1].toLowerCase();
}

function detectType(file: File): MediaFile['type'] {
  const ext = extOf(file.name);
  if (file.type.startsWith('video/') || VIDEO_EXT.includes(ext)) return 'video';
  if (file.type.startsWith('audio/') || AUDIO_EXT.includes(ext)) return 'audio';
  if (GIF_EXT.includes(ext) || file.type === 'image/gif') return 'gif';
  if (file.type.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image';
  return 'video';
}

function generateVideoThumbnail(url: string): Promise<{
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;

    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      const seekTo = Math.min(0.1, video.duration / 2 || 0);
      video.currentTime = seekTo;
    };

    const onSeeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      cleanup();
      video.removeEventListener('seeked', onSeeked);
      resolve({
        thumbnailUrl,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video for thumbnail generation'));
    };

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
  });
}

function generateImageMeta(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
    audio.addEventListener('error', () => reject(new Error('Failed to load audio')));
  });
}

export async function generateWaveform(file: File, samples = 200): Promise<number[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];
    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      waveform.push(sum / blockSize);
    }
    audioCtx.close();
    const max = Math.max(...waveform, 0.0001);
    return waveform.map((v) => v / max);
  } catch (e) {
    return new Array(samples).fill(0.3);
  }
}

export async function importFile(file: File): Promise<MediaFile> {
  const id = uuidv4();
  const blobUrl = URL.createObjectURL(file);
  const type = detectType(file);

  const base: MediaFile = {
    id,
    name: file.name,
    type,
    size: file.size,
    blobUrl,
    file,
  };

  try {
    if (type === 'video') {
      const meta = await generateVideoThumbnail(blobUrl);
      return { ...base, ...meta };
    }
    if (type === 'image' || type === 'gif') {
      const meta = await generateImageMeta(blobUrl);
      return { ...base, ...meta, thumbnailUrl: blobUrl };
    }
    if (type === 'audio') {
      const duration = await getAudioDuration(blobUrl);
      const waveform = await generateWaveform(file);
      return { ...base, duration, waveform };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Media metadata extraction failed', e);
  }
  return base;
}

export async function importFiles(files: FileList | File[]): Promise<MediaFile[]> {
  const list = Array.from(files);
  const results: MediaFile[] = [];
  for (const file of list) {
    try {
      results.push(await importFile(file));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to import', file.name, e);
    }
  }
  return results;
}

export function isAcceptedFile(file: File): boolean {
  const ext = extOf(file.name);
  return (
    VIDEO_EXT.includes(ext) ||
    AUDIO_EXT.includes(ext) ||
    IMAGE_EXT.includes(ext) ||
    GIF_EXT.includes(ext) ||
    file.type.startsWith('video/') ||
    file.type.startsWith('audio/') ||
    file.type.startsWith('image/')
  );
}
