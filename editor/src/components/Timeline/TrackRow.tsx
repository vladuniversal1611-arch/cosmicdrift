import React from 'react';
import { Clip, MediaFile, Track } from '../../types';
import { ClipBlock } from './ClipBlock';

interface TrackRowProps {
  track: Track;
  zoom: number;
  selectedClipId: string | null;
  mediaLibrary: MediaFile[];
  snapPoints: number[];
  snapEnabled: boolean;
  onSelectClip: (clipId: string) => void;
  onMoveClip: (clipId: string, newStartTime: number) => void;
  onTrimClip: (clipId: string, edge: 'start' | 'end', deltaSeconds: number) => void;
  onSplitClip: (clipId: string, time: number) => void;
  onEditClip: (clipId: string) => void;
  onDropMedia: (mediaId: string, startTime: number) => void;
  onContextMenuClip: (e: React.MouseEvent, clipId: string) => void;
  totalWidth: number;
}

function applySnap(time: number, points: number[], zoom: number, enabled: boolean): number {
  if (!enabled) return time;
  const thresholdSeconds = 8 / zoom;
  let closest = time;
  let minDist = thresholdSeconds;
  for (const p of points) {
    const dist = Math.abs(p - time);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }
  return closest;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  zoom,
  selectedClipId,
  mediaLibrary,
  snapPoints,
  snapEnabled,
  onSelectClip,
  onMoveClip,
  onTrimClip,
  onSplitClip,
  onEditClip,
  onDropMedia,
  onContextMenuClip,
  totalWidth,
}) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData('application/x-media-id');
    if (!mediaId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawTime = (e.clientX - rect.left) / zoom;
    const snapped = applySnap(rawTime, snapPoints, zoom, snapEnabled);
    onDropMedia(mediaId, Math.max(0, snapped));
  };

  return (
    <div
      className={`track-row ${!track.visible ? 'hidden-track' : ''}`}
      style={{ height: track.height, width: totalWidth }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {track.clips.map((clip: Clip) => (
        <ClipBlock
          key={clip.id}
          clip={clip}
          zoom={zoom}
          selected={clip.id === selectedClipId}
          media={mediaLibrary.find((m) => m.id === clip.mediaId)}
          trackLocked={track.locked}
          onSelect={() => onSelectClip(clip.id)}
          onMove={(newStart) => onMoveClip(clip.id, applySnap(newStart, snapPoints, zoom, snapEnabled))}
          onTrim={(edge, delta) => onTrimClip(clip.id, edge, delta)}
          onSplit={(time) => onSplitClip(clip.id, time)}
          onDoubleClick={() => onEditClip(clip.id)}
          onContextMenu={(e) => onContextMenuClip(e, clip.id)}
        />
      ))}
    </div>
  );
};
