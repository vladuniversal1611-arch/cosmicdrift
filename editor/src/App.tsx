import React, { useRef, useState } from 'react';
import { EditorProvider, useEditor } from './state/EditorContext';
import { Preview } from './components/Preview/Preview';
import { Timeline } from './components/Timeline/Timeline';
import { LeftPanel } from './components/Panels/LeftPanel';
import { Inspector } from './components/Panels/Inspector';
import { ExportDialog } from './components/Panels/ExportDialog';
import { VideoEngine } from './engine/video-engine';
import { AudioEngine } from './engine/audio-engine';
import { useKeyboardShortcuts } from './utils/keyboard-shortcuts';
import { saveProject } from './utils/storage';
import './App.css';

const TopToolbar: React.FC<{ onExport: () => void }> = ({ onExport }) => {
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
        <div className="brand">
          <span className="brand-mark">◈</span>
          <span className="brand-name">CosmicDrift Studio</span>
        </div>
        <input
          className="project-name-input"
          value={project.name}
          onChange={(e) => dispatch({ type: 'RENAME_PROJECT', name: e.target.value })}
        />
      </div>
      <div className="top-toolbar-center">
        <button className="tb-btn" onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo} title="Undo (Ctrl+Z)">↶ Undo</button>
        <button className="tb-btn" onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">↷ Redo</button>
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
          {saved ? '✓ Saved' : '💾 Save'}
        </button>
        <button className="tb-btn tb-btn-primary" onClick={onExport} title="Export (Ctrl+E)">
          ⬆ Export
        </button>
      </div>
    </div>
  );
};

const EditorShell: React.FC = () => {
  const { state, dispatch, getSelectedClip } = useEditor();
  const videoEngineRef = useRef<VideoEngine | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(300);
  const [timelineHeight, setTimelineHeight] = useState(280);

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
    const move = (ev: PointerEvent) => setLeftWidth(Math.max(240, Math.min(520, startW + (ev.clientX - startX))));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResizeRight = (e: React.PointerEvent) => {
    const startX = e.clientX;
    const startW = rightWidth;
    const move = (ev: PointerEvent) => setRightWidth(Math.max(240, Math.min(480, startW - (ev.clientX - startX))));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResizeTimeline = (e: React.PointerEvent) => {
    const startY = e.clientY;
    const startH = timelineHeight;
    const move = (ev: PointerEvent) => setTimelineHeight(Math.max(160, Math.min(560, startH - (ev.clientY - startY))));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="app-root" data-theme={state.theme}>
      <TopToolbar onExport={() => setExportOpen(true)} />
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

const App: React.FC = () => (
  <EditorProvider>
    <EditorShell />
  </EditorProvider>
);

export default App;
