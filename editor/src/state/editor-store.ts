import { v4 as uuidv4 } from 'uuid';
import {
  ASPECT_RATIO_DIMENSIONS,
  AspectRatio,
  Clip,
  Effect,
  Keyframe,
  MediaFile,
  PanelId,
  Project,
  Track,
  TrackType,
} from '../types';
import { HistoryEntry, HistoryManager } from '../utils/history';

// ---------------------------------------------------------------------------
// Default factories
// ---------------------------------------------------------------------------

export function createDefaultProject(name = 'Untitled Project'): Project {
  const now = Date.now();
  const dims = ASPECT_RATIO_DIMENSIONS['16:9'];
  return {
    id: uuidv4(),
    name,
    createdAt: now,
    updatedAt: now,
    aspectRatio: '16:9',
    width: dims.width,
    height: dims.height,
    fps: 30,
    backgroundColor: '#000000',
    duration: 0,
    tracks: [
      { id: uuidv4(), type: 'text', name: 'Text', order: 3, muted: false, locked: false, visible: true, height: 56, clips: [] },
      { id: uuidv4(), type: 'overlay', name: 'Overlay', order: 2, muted: false, locked: false, visible: true, height: 56, clips: [] },
      { id: uuidv4(), type: 'video', name: 'Video 1', order: 1, muted: false, locked: false, visible: true, height: 72, clips: [] },
      { id: uuidv4(), type: 'audio', name: 'Audio 1', order: 0, muted: false, locked: false, visible: true, height: 56, clips: [] },
    ],
  };
}

export function createClip(partial: Partial<Clip> & { type: Clip['type']; trackId: string; mediaId: string }): Clip {
  return {
    id: uuidv4(),
    name: partial.name || 'Clip',
    startTime: 0,
    duration: 5,
    trimStart: 0,
    trimEnd: 0,
    originalDuration: 5,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    speed: 1,
    volume: 1,
    muted: false,
    reversed: false,
    effects: [],
    filters: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      temperature: 0,
      tint: 0,
      highlights: 0,
      shadows: 0,
      vignette: 0,
      blur: 0,
      sharpen: 0,
      hue: 0,
      grain: 0,
    },
    keyframes: [],
    cropTop: 0,
    cropBottom: 0,
    cropLeft: 0,
    cropRight: 0,
    flipX: false,
    flipY: false,
    fadeInDuration: 0,
    fadeOutDuration: 0,
    locked: false,
    ...partial,
  };
}

export function defaultTextStyle() {
  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 48,
    fontWeight: 700,
    fontStyle: 'normal' as const,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 0,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    textAlign: 'center' as const,
    letterSpacing: 0,
    lineHeight: 1.2,
    opacity: 1,
    animation: 'none',
    animationDuration: 0.5,
  };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface EditorState {
  project: Project;
  mediaLibrary: MediaFile[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  clipboard: Clip | null;

  playing: boolean;
  currentTime: number;

  activePanel: PanelId;
  zoom: number; // pixels per second on timeline
  snapEnabled: boolean;
  theme: 'dark' | 'light';

  canUndo: boolean;
  canRedo: boolean;
}

export function initialEditorState(): EditorState {
  return {
    project: createDefaultProject(),
    mediaLibrary: [],
    selectedClipId: null,
    selectedTrackId: null,
    clipboard: null,
    playing: false,
    currentTime: 0,
    activePanel: 'media',
    zoom: 60,
    snapEnabled: true,
    theme: 'dark',
    canUndo: false,
    canRedo: false,
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type EditorAction =
  | { type: 'ADD_TRACK'; trackType: TrackType; name?: string }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'UPDATE_TRACK'; trackId: string; patch: Partial<Track> }
  | { type: 'REORDER_TRACKS'; trackIds: string[] }
  | { type: 'ADD_CLIP'; clip: Clip }
  | { type: 'REMOVE_CLIP'; clipId: string }
  | { type: 'UPDATE_CLIP'; clipId: string; patch: Partial<Clip> }
  | { type: 'MOVE_CLIP'; clipId: string; trackId: string; startTime: number }
  | { type: 'SPLIT_CLIP'; clipId: string; time: number }
  | { type: 'DUPLICATE_CLIP'; clipId: string }
  | { type: 'TRIM_CLIP'; clipId: string; trimStart?: number; trimEnd?: number; startTime?: number; duration?: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: Effect }
  | { type: 'REMOVE_EFFECT'; clipId: string; effectId: string }
  | { type: 'UPDATE_EFFECT'; clipId: string; effectId: string; patch: Partial<Effect> }
  | { type: 'ADD_KEYFRAME'; clipId: string; keyframe: Keyframe }
  | { type: 'REMOVE_KEYFRAME'; clipId: string; keyframeId: string }
  | { type: 'UPDATE_KEYFRAME'; clipId: string; keyframeId: string; patch: Partial<Keyframe> }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SELECT_CLIP'; clipId: string | null }
  | { type: 'SELECT_TRACK'; trackId: string | null }
  | { type: 'DESELECT_ALL' }
  | { type: 'COPY_CLIP'; clipId: string }
  | { type: 'PASTE_CLIP'; trackId: string; startTime: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_SNAP'; snap: boolean }
  | { type: 'SET_ACTIVE_PANEL'; panel: PanelId }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'ADD_MEDIA'; media: MediaFile[] }
  | { type: 'REMOVE_MEDIA'; mediaId: string }
  | { type: 'SET_PROJECT'; project: Project }
  | { type: 'NEW_PROJECT'; name?: string }
  | { type: 'RENAME_PROJECT'; name: string }
  | { type: 'SET_ASPECT_RATIO'; aspectRatio: AspectRatio };

function recalcDuration(project: Project): number {
  let max = 0;
  project.tracks.forEach((t) =>
    t.clips.forEach((c) => {
      max = Math.max(max, c.startTime + c.duration);
    })
  );
  return max;
}

function updateTrackClips(project: Project, trackId: string, fn: (clips: Clip[]) => Clip[]): Project {
  const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, clips: fn(t.clips) } : t));
  const next = { ...project, tracks, updatedAt: Date.now() };
  next.duration = recalcDuration(next);
  return next;
}

function findClip(project: Project, clipId: string): { clip: Clip; track: Track } | null {
  for (const track of project.tracks) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) return { clip, track };
  }
  return null;
}

function updateClipInProject(project: Project, clipId: string, fn: (clip: Clip) => Clip): Project {
  const found = findClip(project, clipId);
  if (!found) return project;
  return updateTrackClips(project, found.track.id, (clips) =>
    clips.map((c) => (c.id === clipId ? fn(c) : c))
  );
}

export function projectReducer(project: Project, action: EditorAction): Project {
  switch (action.type) {
    case 'ADD_TRACK': {
      const order = project.tracks.length
        ? Math.max(...project.tracks.map((t) => t.order)) + 1
        : 0;
      const track: Track = {
        id: uuidv4(),
        type: action.trackType,
        name: action.name || `${action.trackType[0].toUpperCase()}${action.trackType.slice(1)} ${project.tracks.filter((t) => t.type === action.trackType).length + 1}`,
        order,
        muted: false,
        locked: false,
        visible: true,
        height: action.trackType === 'video' ? 72 : 56,
        clips: [],
      };
      return { ...project, tracks: [...project.tracks, track], updatedAt: Date.now() };
    }
    case 'REMOVE_TRACK':
      return {
        ...project,
        tracks: project.tracks.filter((t) => t.id !== action.trackId),
        updatedAt: Date.now(),
      };
    case 'UPDATE_TRACK':
      return {
        ...project,
        tracks: project.tracks.map((t) => (t.id === action.trackId ? { ...t, ...action.patch } : t)),
        updatedAt: Date.now(),
      };
    case 'REORDER_TRACKS': {
      const order = action.trackIds;
      return {
        ...project,
        tracks: project.tracks
          .map((t) => ({ ...t, order: order.indexOf(t.id) }))
          .sort((a, b) => a.order - b.order),
        updatedAt: Date.now(),
      };
    }
    case 'ADD_CLIP':
      return updateTrackClips(project, action.clip.trackId, (clips) => [...clips, action.clip]);
    case 'REMOVE_CLIP': {
      const found = findClip(project, action.clipId);
      if (!found) return project;
      return updateTrackClips(project, found.track.id, (clips) =>
        clips.filter((c) => c.id !== action.clipId)
      );
    }
    case 'UPDATE_CLIP':
      return updateClipInProject(project, action.clipId, (c) => ({ ...c, ...action.patch }));
    case 'MOVE_CLIP': {
      const found = findClip(project, action.clipId);
      if (!found) return project;
      if (found.track.id === action.trackId) {
        return updateTrackClips(project, action.trackId, (clips) =>
          clips.map((c) => (c.id === action.clipId ? { ...c, startTime: action.startTime } : c))
        );
      }
      // moving across tracks
      const clip = { ...found.clip, trackId: action.trackId, startTime: action.startTime };
      let next = updateTrackClips(project, found.track.id, (clips) =>
        clips.filter((c) => c.id !== action.clipId)
      );
      next = updateTrackClips(next, action.trackId, (clips) => [...clips, clip]);
      return next;
    }
    case 'SPLIT_CLIP': {
      const found = findClip(project, action.clipId);
      if (!found) return project;
      const { clip } = found;
      const splitOffset = action.time - clip.startTime;
      if (splitOffset <= 0 || splitOffset >= clip.duration) return project;
      const firstDuration = splitOffset;
      const secondDuration = clip.duration - splitOffset;
      const first: Clip = { ...clip, duration: firstDuration, trimEnd: clip.trimEnd + secondDuration * clip.speed };
      const second: Clip = {
        ...clip,
        id: uuidv4(),
        startTime: action.time,
        duration: secondDuration,
        trimStart: clip.trimStart + firstDuration * clip.speed,
      };
      return updateTrackClips(project, found.track.id, (clips) => {
        const withoutOld = clips.filter((c) => c.id !== action.clipId);
        return [...withoutOld, first, second];
      });
    }
    case 'DUPLICATE_CLIP': {
      const found = findClip(project, action.clipId);
      if (!found) return project;
      const copy: Clip = {
        ...found.clip,
        id: uuidv4(),
        startTime: found.clip.startTime + found.clip.duration + 0.2,
      };
      return updateTrackClips(project, found.track.id, (clips) => [...clips, copy]);
    }
    case 'TRIM_CLIP':
      return updateClipInProject(project, action.clipId, (c) => ({
        ...c,
        trimStart: action.trimStart ?? c.trimStart,
        trimEnd: action.trimEnd ?? c.trimEnd,
        startTime: action.startTime ?? c.startTime,
        duration: action.duration ?? c.duration,
      }));
    case 'ADD_EFFECT':
      return updateClipInProject(project, action.clipId, (c) => ({
        ...c,
        effects: [...c.effects, action.effect],
      }));
    case 'REMOVE_EFFECT':
      return updateClipInProject(project, action.clipId, (c) => ({
        ...c,
        effects: c.effects.filter((e) => e.id !== action.effectId),
      }));
    case 'UPDATE_EFFECT':
      return updateClipInProject(project, action.clipId, (c) => ({
        ...c,
        effects: c.effects.map((e) => (e.id === action.effectId ? { ...e, ...action.patch } : e)),
      }));
    case 'ADD_KEYFRAME':
      return updateClipInProject(project, action.clipId, (c) => ({
        ...c,
        keyframes: [...c.keyframes, action.keyframe].sort((a, b) => a.time - b.time),
      }));
    case 'REMOVE_KEYFRAME':
      return updateClipInProject(project, action.clipId, (c) => ({
        ...c,
        keyframes: c.keyframes.filter((k) => k.id !== action.keyframeId),
      }));
    case 'UPDATE_KEYFRAME':
      return updateClipInProject(project, action.clipId, (c) => ({
        ...c,
        keyframes: c.keyframes
          .map((k) => (k.id === action.keyframeId ? { ...k, ...action.patch } : k))
          .sort((a, b) => a.time - b.time),
      }));
    case 'SET_ASPECT_RATIO': {
      const dims = ASPECT_RATIO_DIMENSIONS[action.aspectRatio];
      return { ...project, aspectRatio: action.aspectRatio, width: dims.width, height: dims.height, updatedAt: Date.now() };
    }
    case 'RENAME_PROJECT':
      return { ...project, name: action.name, updatedAt: Date.now() };
    default:
      return project;
  }
}

const HISTORY_ACTION_TYPES = new Set([
  'ADD_TRACK', 'REMOVE_TRACK', 'UPDATE_TRACK', 'REORDER_TRACKS',
  'ADD_CLIP', 'REMOVE_CLIP', 'UPDATE_CLIP', 'MOVE_CLIP', 'SPLIT_CLIP',
  'DUPLICATE_CLIP', 'TRIM_CLIP', 'ADD_EFFECT', 'REMOVE_EFFECT', 'UPDATE_EFFECT',
  'ADD_KEYFRAME', 'REMOVE_KEYFRAME', 'UPDATE_KEYFRAME', 'SET_ASPECT_RATIO',
  'RENAME_PROJECT', 'PASTE_CLIP',
]);

const historyManager = new HistoryManager();

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, playing: action.playing };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: Math.max(0, action.time) };
    case 'SET_DURATION':
      return { ...state, project: { ...state.project, duration: action.duration } };
    case 'SELECT_CLIP':
      return { ...state, selectedClipId: action.clipId, selectedTrackId: null };
    case 'SELECT_TRACK':
      return { ...state, selectedTrackId: action.trackId, selectedClipId: null };
    case 'DESELECT_ALL':
      return { ...state, selectedClipId: null, selectedTrackId: null };
    case 'COPY_CLIP': {
      const found = findClip(state.project, action.clipId);
      return { ...state, clipboard: found ? { ...found.clip } : state.clipboard };
    }
    case 'PASTE_CLIP': {
      if (!state.clipboard) return state;
      const before = state.project;
      const newClip: Clip = {
        ...state.clipboard,
        id: uuidv4(),
        trackId: action.trackId,
        startTime: action.startTime,
      };
      const after = updateTrackClips(state.project, action.trackId, (clips) => [...clips, newClip]);
      pushHistory(before, after, 'Paste clip');
      return { ...state, project: after, selectedClipId: newClip.id, canUndo: true, canRedo: false };
    }
    case 'UNDO': {
      const prev = historyManager.undo();
      if (!prev) return state;
      return { ...state, project: prev, canUndo: historyManager.canUndo(), canRedo: historyManager.canRedo() };
    }
    case 'REDO': {
      const next = historyManager.redo();
      if (!next) return state;
      return { ...state, project: next, canUndo: historyManager.canUndo(), canRedo: historyManager.canRedo() };
    }
    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(400, Math.max(10, action.zoom)) };
    case 'SET_SNAP':
      return { ...state, snapEnabled: action.snap };
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.panel };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'ADD_MEDIA':
      return { ...state, mediaLibrary: [...state.mediaLibrary, ...action.media] };
    case 'REMOVE_MEDIA':
      return { ...state, mediaLibrary: state.mediaLibrary.filter((m) => m.id !== action.mediaId) };
    case 'SET_PROJECT':
      historyManager.clear();
      return {
        ...state,
        project: action.project,
        selectedClipId: null,
        selectedTrackId: null,
        currentTime: 0,
        canUndo: false,
        canRedo: false,
      };
    case 'NEW_PROJECT':
      historyManager.clear();
      return {
        ...state,
        project: createDefaultProject(action.name),
        selectedClipId: null,
        selectedTrackId: null,
        currentTime: 0,
        canUndo: false,
        canRedo: false,
      };
    default: {
      if (HISTORY_ACTION_TYPES.has(action.type)) {
        const before = state.project;
        const after = projectReducer(before, action);
        if (after !== before) {
          pushHistory(before, after, describeAction(action));
          let selectedClipId = state.selectedClipId;
          if (action.type === 'REMOVE_CLIP' && (action as any).clipId === selectedClipId) {
            selectedClipId = null;
          }
          if (action.type === 'SPLIT_CLIP') {
            selectedClipId = state.selectedClipId;
          }
          if (action.type === 'ADD_CLIP') {
            selectedClipId = (action as any).clip.id;
          }
          if (action.type === 'DUPLICATE_CLIP') {
            const found = findClip(after, (action as any).clipId);
            selectedClipId = found ? selectedClipId : selectedClipId;
          }
          return { ...state, project: after, selectedClipId, canUndo: true, canRedo: false };
        }
        return state;
      }
      return state;
    }
  }
}

function pushHistory(before: Project, after: Project, label: string) {
  const entry: HistoryEntry = {
    id: uuidv4(),
    label,
    timestamp: Date.now(),
    before,
    after,
  };
  historyManager.push(entry);
}

function describeAction(action: EditorAction): string {
  switch (action.type) {
    case 'ADD_TRACK': return 'Add track';
    case 'REMOVE_TRACK': return 'Remove track';
    case 'UPDATE_TRACK': return 'Update track';
    case 'ADD_CLIP': return 'Add clip';
    case 'REMOVE_CLIP': return 'Delete clip';
    case 'UPDATE_CLIP': return 'Update clip';
    case 'MOVE_CLIP': return 'Move clip';
    case 'SPLIT_CLIP': return 'Split clip';
    case 'DUPLICATE_CLIP': return 'Duplicate clip';
    case 'TRIM_CLIP': return 'Trim clip';
    case 'ADD_EFFECT': return 'Add effect';
    case 'REMOVE_EFFECT': return 'Remove effect';
    case 'UPDATE_EFFECT': return 'Update effect';
    case 'ADD_KEYFRAME': return 'Add keyframe';
    case 'REMOVE_KEYFRAME': return 'Remove keyframe';
    case 'UPDATE_KEYFRAME': return 'Update keyframe';
    case 'SET_ASPECT_RATIO': return 'Change aspect ratio';
    case 'RENAME_PROJECT': return 'Rename project';
    default: return 'Edit';
  }
}

export function getHistoryManager() {
  return historyManager;
}
