import React, { useCallback, useRef, useState } from 'react';
import { EditorProvider, useEditor } from './state/EditorContext';
import { Preview } from './components/Preview/Preview';
import { Timeline } from './components/Timeline/Timeline';
import { LeftPanel } from './components/Panels/LeftPanel';
import { Inspector } from './components/Panels/Inspector';
import { ExportDialog } from './components/Panels/ExportDialog';
import { VideoEngine } from './engine/video-engine';
import { AudioEngine } from './engine/audio-engine';
import { useKeyboardShortcuts } from './utils/keyboard-shortcuts';
import { saveProject, listProjects } from './utils/storage';
import { importFiles, isAcceptedFile } from './utils/media-import';
import { createClip } from './state/editor-store';
import { MediaFile, Project } from './types';
import './App.css';

// ─────────────────────────────────────────────────────────────────────────────
// Welcome Screen — first thing user sees
// ─────────────────────────────────────────────────────────────────────────────

const WelcomeScreen: React.FC<{ onStartEditing: () => void }> = ({ onStartEditing }) => {
  const { state, dispatch } = useEditor();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    listProjects().then((projects) => {
      setRecentProjects(projects.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6));
    }).catch(() => {});
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const accepted = Array.from(files).filter(isAcceptedFile);
    if (accepted.length === 0) return;
    setLoading(true);
    try {
      const imported = await importFiles(accepted);
      dispatch({ type: 'ADD_MEDIA', media: imported });

      // Automatically add first media to timeline
      for (const media of imported) {
        const trackType = media.type === 'audio' ? 'audio' : 'video';
        const track = state.project.tracks.find((t) => t.type === trackType);
        if (track) {
          const duration = media.type === 'image' ? 5 : media.duration || 5;
          const lastClipEnd = track.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
          const clip = createClip({
            type: media.type === 'gif' ? 'gif' : (media.type as any),
            trackId: track.id,
            mediaId: media.id,
            name: media.name,
            startTime: lastClipEnd,
            duration,
            originalDuration: media.duration || duration,
            thumbnailUrl: media.thumbnailUrl,
          });
          dispatch({ type: 'ADD_CLIP', clip });
        }
      }
      onStartEditing();
    } finally {
      setLoading(false);
    }
  }, [dispatch, state.project.tracks, onStartEditing]);

  const handleLoadProject = (project: Project) => {
    dispatch({ type: 'SET_PROJECT', project });
    onStartEditing();
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-bg" />
      <div className="welcome-content">
        <div className="welcome-logo">
          <span className="welcome-logo-mark">◈</span>
          <h1 className="welcome-title">CosmicDrift Studio</h1>
          <p className="welcome-subtitle">Professional Video Editor</p>
        </div>

        <div
          className={`welcome-dropzone ${dragOver ? 'dragover' : ''} ${loading ? 'loading' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => !loading && fileInputRef.current?.click()}
        >
          {loading ? (
            <>
              <div className="welcome-spinner" />
              <p className="welcome-drop-text">Завантаження медіа...</p>
            </>
          ) : (
            <>
              <div className="welcome-drop-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2.5"/>
                  <path d="M24 52h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="32" cy="34" r="8" stroke="currentColor" strokeWidth="2.5"/>
                  <path d="M32 26v-6m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="welcome-drop-text">Додай відео або фото</p>
              <p className="welcome-drop-hint">Перетягни файл сюди або натисни для вибору</p>
              <p className="welcome-drop-formats">MP4, WebM, MOV, PNG, JPG, GIF, MP3, WAV</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <div className="welcome-actions">
          <button className="welcome-btn-secondary" onClick={onStartEditing}>
            Відкрити порожній проект
          </button>
        </div>

        {recentProjects.length > 0 && (
          <div className="welcome-recent">
            <h3>Нещодавні проекти</h3>
            <div className="welcome-recent-grid">
              {recentProjects.map((p) => (
                <button key={p.id} className="welcome-project-card" onClick={() => handleLoadProject(p)}>
                  <div className="welcome-project-thumb">
                    <span>{p.aspectRatio}</span>
                  </div>
                  <div className="welcome-project-info">
                    <div className="welcome-project-name">{p.name}</div>
                    <div className="welcome-project-date">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="welcome-features">
          <div className="welcome-feature">
            <span>✂️</span>
            <span>Trim & Split</span>
          </div>
          <div className="welcome-feature">
            <span>🎨</span>
            <span>Фільтри</span>
          </div>
          <div className="welcome-feature">
            <span>🔤</span>
            <span>Текст</span>
          </div>
          <div className="welcome-feature">
            <span>🎵</span>
            <span>Аудіо</span>
          </div>
          <div className="welcome-feature">
            <span>✨</span>
            <span>Ефекти</span>
          </div>
          <div className="welcome-feature">
            <span>⬆️</span>
            <span>Експорт</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Top Toolbar
// ─────────────────────────────────────────────────────────────────────────────

const TopToolbar: React.FC<{ onExport: () => void; onBack: () => void }> = ({ onExport, onBack }) => {
  const { state, dispatch } = useEditor();
  const { project, canUndo, canRedo, theme } = state;
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveProject(project);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="top-toolbar">
      <div className="top-toolbar-left">
        <button className="tb-btn tb-btn-back" onClick={onBack} title="Назад на головну">
          ← Назад
        </button>
        <div className="brand">
          <span className="brand-mark">◈</span>
          <span className="brand-name">CosmicDrift</span>
        </div>
        <input
          className="project-name-input"
          value={project.name}
          onChange={(e) => dispatch({ type: 'RENAME_PROJECT', name: e.target.value })}
        />
      </div>
      <div className="top-toolbar-center">
        <button className="tb-btn" onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo} title="Undo (Ctrl+Z)">↶</button>
        <button className="tb-btn" onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">↷</button>
      </div>
      <div className="top-toolbar-right">
        <button
          className="tb-btn"
          onClick={() => dispatch({ type: 'SET_THEME', theme: theme === 'dark' ? 'light' : 'dark' })}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="tb-btn" onClick={handleSave} title="Save (Ctrl+S)">
          {saved ? '✓' : '💾'}
        </button>
        <button className="tb-btn tb-btn-primary" onClick={onExport} title="Export (Ctrl+E)">
          ⬆ Експорт
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Editor Shell
// ─────────────────────────────────────────────────────────────────────────────

const EditorShell: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, dispatch, getSelectedClip } = useEditor();
  const videoEngineRef = useRef<VideoEngine | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(280);
  const [timelineHeight, setTimelineHeight] = useState(260);

  const selectedClip = getSelectedClip();

  useKeyboardShortcuts({
    onPlayPause: () => dispatch({ type: 'SET_PLAYING', playing: !state.playing }),
    onUndo: () => dispatch({ type: 'UNDO' }),
    onRedo: () => dispatch({ type: 'REDO' }),
    onDelete: () => selectedClip && dispatch({ type: 'REMOVE_CLIP', clipId: selectedClip.id }),
    onCopy: () => selectedClip && dispatch({ type: 'COPY_CLIP', clipId: selectedClip.id }),
    onPaste: () => {
      if (state.clipboard) {
        const track = state.project.tracks.find((t) => t.id === state.clipboard!.trackId) || state.project.tracks[0];
        dispatch({ type: 'PASTE_CLIP', trackId: track.id, startTime: state.currentTime });
      }
    },
    onDuplicate: () => selectedClip && dispatch({ type: 'DUPLICATE_CLIP', clipId: selectedClip.id }),
    onSplit: () => selectedClip && dispatch({ type: 'SPLIT_CLIP', clipId: selectedClip.id, time: state.currentTime }),
    onStepBack: () => dispatch({ type: 'SET_CURRENT_TIME', time: Math.max(0, state.currentTime - 1 / state.project.fps) }),
    onStepForward: () => dispatch({ type: 'SET_CURRENT_TIME', time: Math.min(state.project.duration, state.currentTime + 1 / state.project.fps) }),
    onZoomIn: () => dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 20 }),
    onZoomOut: () => dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 20 }),
    onSave: () => saveProject(state.project),
    onExport: () => setExportOpen(true),
  });

  const startResizeLeft = (e: React.PointerEvent) => {
    const startX = e.clientX;
    const startW = leftWidth;
    const move = (ev: PointerEvent) => setLeftWidth(Math.max(220, Math.min(480, startW + (ev.clientX - startX))));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResizeRight = (e: React.PointerEvent) => {
    const startX = e.clientX;
    const startW = rightWidth;
    const move = (ev: PointerEvent) => setRightWidth(Math.max(220, Math.min(420, startW - (ev.clientX - startX))));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResizeTimeline = (e: React.PointerEvent) => {
    const startY = e.clientY;
    const startH = timelineHeight;
    const move = (ev: PointerEvent) => setTimelineHeight(Math.max(150, Math.min(500, startH - (ev.clientY - startY))));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="app-root" data-theme={state.theme}>
      <TopToolbar onExport={() => setExportOpen(true)} onBack={onBack} />
      <div className="app-body">
        <div className="app-main-row" style={{ height: `calc(100% - ${timelineHeight}px)` }}>
          <div className="panel-col" style={{ width: leftWidth }}>
            <LeftPanel />
          </div>
          <div className="resize-handle vertical" onPointerDown={startResizeLeft} />
          <div className="preview-col">
            <Preview videoEngineRef={videoEngineRef} audioEngineRef={audioEngineRef} />
          </div>
          <div className="resize-handle vertical" onPointerDown={startResizeRight} />
          <div className="panel-col" style={{ width: rightWidth }}>
            <Inspector />
          </div>
        </div>
        <div className="resize-handle horizontal" onPointerDown={startResizeTimeline} />
        <div className="app-timeline-row" style={{ height: timelineHeight }}>
          <Timeline />
        </div>
      </div>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// App Router — Welcome vs Editor
// ─────────────────────────────────────────────────────────────────────────────

const AppRouter: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'editor'>('welcome');

  return view === 'welcome'
    ? <WelcomeScreen onStartEditing={() => setView('editor')} />
    : <EditorShell onBack={() => setView('welcome')} />;
};

const App: React.FC = () => (
  <EditorProvider>
    <AppRouter />
  </EditorProvider>
);

export default App;
