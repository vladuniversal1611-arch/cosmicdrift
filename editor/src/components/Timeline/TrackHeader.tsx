import React from 'react';
import { Track } from '../../types';

interface TrackHeaderProps {
  track: Track;
  onUpdate: (patch: Partial<Track>) => void;
  onRemove: () => void;
  selected: boolean;
  onSelect: () => void;
}

const TRACK_ICONS: Record<Track['type'], string> = {
  video: '🎬',
  audio: '🎵',
  text: '🔤',
  overlay: '🖼️',
};

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track, onUpdate, onRemove, selected, onSelect }) => {
  return (
    <div
      className={`track-header ${selected ? 'selected' : ''}`}
      style={{ height: track.height }}
      onClick={onSelect}
    >
      <span className="track-icon">{TRACK_ICONS[track.type]}</span>
      <input
        className="track-name-input"
        value={track.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="track-controls">
        <button
          className={`track-mini-btn ${track.muted ? 'active-warn' : ''}`}
          title={track.muted ? 'Unmute' : 'Mute'}
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ muted: !track.muted });
          }}
        >
          {track.muted ? '🔇' : '🔊'}
        </button>
        <button
          className={`track-mini-btn ${track.locked ? 'active-warn' : ''}`}
          title={track.locked ? 'Unlock' : 'Lock'}
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ locked: !track.locked });
          }}
        >
          {track.locked ? '🔒' : '🔓'}
        </button>
        <button
          className="track-mini-btn"
          title={track.visible ? 'Hide' : 'Show'}
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ visible: !track.visible });
          }}
        >
          {track.visible ? '👁️' : '🚫'}
        </button>
        <button
          className="track-mini-btn track-remove"
          title="Delete track"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
