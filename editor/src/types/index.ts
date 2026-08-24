// CosmicDrift Studio — core data model types

export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'sticker' | 'gif';
export type TrackType = 'video' | 'audio' | 'text' | 'overlay';
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '4:3';
export type PanelId =
  | 'media'
  | 'text'
  | 'audio'
  | 'effects'
  | 'transitions'
  | 'stickers'
  | 'filters'
  | 'adjust'
  | 'captions'
  | 'ai'
  | 'templates';

export interface Keyframe {
  id: string;
  time: number; // relative to clip start, seconds
  property: string;
  value: number;
  easing: EasingType;
}

export interface Effect {
  id: string;
  type: string;
  name: string;
  category: 'basic' | 'motion' | 'stylized';
  params: Record<string, number>;
  enabled: boolean;
}

export interface Transition {
  id: string;
  type: string;
  duration: number;
  params: Record<string, number>;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  color: string;
  gradient?: { colors: string[]; angle: number };
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  backgroundColor: string;
  backgroundOpacity: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  opacity: number;
  animation: string;
  animationDuration: number;
}

export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface Clip {
  id: string;
  type: ClipType;
  name: string;
  trackId: string;
  startTime: number; // position on timeline (seconds)
  duration: number; // seconds, on timeline
  trimStart: number; // seconds trimmed from source start
  trimEnd: number; // seconds trimmed from source end
  originalDuration: number; // seconds, full source duration

  // Media reference
  mediaId: string;
  thumbnailUrl?: string;

  // Transform
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;

  // Video/Audio specific
  speed: number;
  volume: number;
  muted: boolean;
  reversed: boolean;

  // Text specific
  text?: string;
  textStyle?: TextStyle;

  // Effects & Transitions
  effects: Effect[];
  filters: Record<string, number>;
  transitionIn?: Transition;
  transitionOut?: Transition;

  // Keyframes
  keyframes: Keyframe[];

  // Crop (0-1 fraction of source)
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;

  // Flip
  flipX: boolean;
  flipY: boolean;

  // Fade
  fadeInDuration: number;
  fadeOutDuration: number;

  locked: boolean;
  selected?: boolean;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  order: number;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  height: number;
  clips: Clip[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  tracks: Track[];
  duration: number;
  backgroundColor: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'gif';
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  blobUrl?: string;
  file?: File;
  waveform?: number[];
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '1440p' | '4k';
  fps: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high' | 'maximum';
  format: 'mp4' | 'webm';
  width: number;
  height: number;
}

export interface HistoryAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
}

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '4:3': { width: 1440, height: 1080 },
};

export const EXPORT_RESOLUTIONS: Record<ExportSettings['resolution'], number> = {
  '720p': 720,
  '1080p': 1080,
  '1440p': 1440,
  '4k': 2160,
};
