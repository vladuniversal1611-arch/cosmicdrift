import React from 'react';
import { IconButton } from '../common/Controls';

interface TimelineToolbarProps {
  zoom: number;
  onZoomChange: (z: number) => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddTrack: (type: 'video' | 'audio' | 'text' | 'overlay') => void;
  canSplit: boolean;
  canDelete: boolean;
  undoEnabled: boolean;
  redoEnabled: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  zoom,
  onZoomChange,
  snapEnabled,
  onToggleSnap,
  onSplit,
  onDelete,
  onDuplicate,
  onAddTrack,
  canSplit,
  canDelete,
  undoEnabled,
  redoEnabled,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="timeline-toolbar">
      <div className="tl-toolbar-group">
        <IconButton title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!undoEnabled}>↶</IconButton>
        <IconButton title="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!redoEnabled}>↷</IconButton>
      </div>
      <div className="tl-toolbar-divider" />
      <div className="tl-toolbar-group">
        <IconButton title="Split at playhead (S)" onClick={onSplit} disabled={!canSplit}>✂️</IconButton>
        <IconButton title="Duplicate (Ctrl+D)" onClick={onDuplicate} disabled={!canDelete}>⧉</IconButton>
        <IconButton title="Delete (Del)" onClick={onDelete} disabled={!canDelete}>🗑️</IconButton>
      </div>
      <div className="tl-toolbar-divider" />
      <div className="tl-toolbar-group">
        <IconButton title="Add video track" onClick={() => onAddTrack('video')}>🎬+</IconButton>
        <IconButton title="Add audio track" onClick={() => onAddTrack('audio')}>🎵+</IconButton>
        <IconButton title="Add text track" onClick={() => onAddTrack('text')}>🔤+</IconButton>
      </div>
      <div className="tl-toolbar-divider" />
      <IconButton title="Toggle snapping" onClick={onToggleSnap} active={snapEnabled}>🧲</IconButton>
      <div className="tl-toolbar-spacer" />
      <div className="tl-zoom-control">
        <IconButton title="Zoom out" onClick={() => onZoomChange(zoom - 15)}>−</IconButton>
        <input
          type="range"
          min={10}
          max={400}
          value={zoom}
          onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
        />
        <IconButton title="Zoom in" onClick={() => onZoomChange(zoom + 15)}>+</IconButton>
      </div>
    </div>
  );
};
