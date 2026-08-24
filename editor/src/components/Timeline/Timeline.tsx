import React, { useMemo, useRef, useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { createClip, defaultTextStyle } from '../../state/editor-store';
import { Clip } from '../../types';
import { TimeRuler } from './TimeRuler';
import { TrackHeader } from './TrackHeader';
import { TrackRow } from './TrackRow';
import { Playhead } from './Playhead';
import { TimelineToolbar } from './TimelineToolbar';
import { v4 as uuidv4 } from 'uuid';
import './Timeline.css';

export const Timeline: React.FC = () => {
  const { state, dispatch } = useEditor();
  const { project, mediaLibrary, currentTime, selectedClipId, zoom, snapEnabled, canUndo, canRedo } = state;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);

  const sortedTracks = useMemo(
    () => [...project.tracks].sort((a, b) => b.order - a.order),
    [project.tracks]
  );

  const totalWidth = Math.max(1200, (project.duration + 30) * zoom);

  const snapPoints = useMemo(() => {
    const points: number[] = [currentTime, 0];
    project.tracks.forEach((t) =>
      t.clips.forEach((c) => {
        if (c.id !== selectedClipId) {
          points.push(c.startTime);
          points.push(c.startTime + c.duration);
        }
      })
    );
    return points;
  }, [project.tracks, currentTime, selectedClipId]);

  const handleSeek = (time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', time: Math.max(0, time) });
  };

  const handleSelectClip = (clipId: string) => {
    dispatch({ type: 'SELECT_CLIP', clipId });
  };

  const handleMoveClip = (clipId: string, newStartTime: number) => {
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === clipId));
    if (!track) return;
    dispatch({ type: 'MOVE_CLIP', clipId, trackId: track.id, startTime: Math.max(0, newStartTime) });
  };

  const handleTrimClip = (clipId: string, edge: 'start' | 'end', deltaSeconds: number) => {
    const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === clipId);
    if (!clip) return;
    if (edge === 'start') {
      const maxDelta = clip.duration - 0.1;
      const clamped = Math.max(-clip.trimStart, Math.min(maxDelta, deltaSeconds));
      dispatch({
        type: 'TRIM_CLIP',
        clipId,
        startTime: clip.startTime + clamped,
        duration: clip.duration - clamped,
        trimStart: clip.trimStart + clamped,
      });
    } else {
      const maxAvailable = clip.originalDuration - clip.trimStart - clip.trimEnd - clip.duration;
      const clamped = Math.max(-(clip.duration - 0.1), Math.min(maxAvailable > 0 ? maxAvailable : 100, deltaSeconds));
      dispatch({
        type: 'TRIM_CLIP',
        clipId,
        duration: clip.duration + clamped,
        trimEnd: Math.max(0, clip.trimEnd - clamped),
      });
    }
  };

  const handleSplitClip = (clipId: string, time: number) => {
    dispatch({ type: 'SPLIT_CLIP', clipId, time });
  };

  const handleEditClip = (clipId: string) => {
    dispatch({ type: 'SELECT_CLIP', clipId });
  };

  const handleDropMedia = (trackId: string, mediaId: string, startTime: number) => {
    const media = mediaLibrary.find((m) => m.id === mediaId);
    if (!media) return;
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const duration = media.type === 'image' ? 5 : media.duration || 5;
    const clip: Clip = createClip({
      type: media.type === 'gif' ? 'gif' : (media.type as any),
      trackId,
      mediaId,
      name: media.name,
      startTime,
      duration,
      originalDuration: media.duration || duration,
      width: 100,
      height: 100,
      thumbnailUrl: media.thumbnailUrl,
    });
    dispatch({ type: 'ADD_CLIP', clip });
  };

  const handleAddTrack = (type: 'video' | 'audio' | 'text' | 'overlay') => {
    dispatch({ type: 'ADD_TRACK', trackType: type });
  };

  const handleSplitAtPlayhead = () => {
    if (!selectedClipId) return;
    dispatch({ type: 'SPLIT_CLIP', clipId: selectedClipId, time: currentTime });
  };

  const handleDeleteSelected = () => {
    if (selectedClipId) dispatch({ type: 'REMOVE_CLIP', clipId: selectedClipId });
  };

  const handleDuplicateSelected = () => {
    if (selectedClipId) dispatch({ type: 'DUPLICATE_CLIP', clipId: selectedClipId });
  };

  const handleAddTextClip = (trackId: string, startTime: number) => {
    const clip = createClip({
      type: 'text',
      trackId,
      mediaId: uuidv4(),
      name: 'Text',
      startTime,
      duration: 3,
      originalDuration: 3,
      width: 80,
      height: 30,
      text: 'Your text here',
      textStyle: defaultTextStyle(),
    });
    dispatch({ type: 'ADD_CLIP', clip });
  };

  return (
    <div className="timeline-panel" onClick={() => setContextMenu(null)}>
      <TimelineToolbar
        zoom={zoom}
        onZoomChange={(z) => dispatch({ type: 'SET_ZOOM', zoom: z })}
        snapEnabled={snapEnabled}
        onToggleSnap={() => dispatch({ type: 'SET_SNAP', snap: !snapEnabled })}
        onSplit={handleSplitAtPlayhead}
        onDelete={handleDeleteSelected}
        onDuplicate={handleDuplicateSelected}
        onAddTrack={handleAddTrack}
        canSplit={!!selectedClipId}
        canDelete={!!selectedClipId}
        undoEnabled={canUndo}
        redoEnabled={canRedo}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
      />
      <div className="timeline-body">
        <div className="track-headers-col">
          <div className="ruler-spacer" />
          {sortedTracks.map((track) => (
            <TrackHeader
              key={track.id}
              track={track}
              selected={state.selectedTrackId === track.id}
              onUpdate={(patch) => dispatch({ type: 'UPDATE_TRACK', trackId: track.id, patch })}
              onRemove={() => dispatch({ type: 'REMOVE_TRACK', trackId: track.id })}
              onSelect={() => dispatch({ type: 'SELECT_TRACK', trackId: track.id })}
            />
          ))}
        </div>
        <div className="timeline-scroll-area" ref={scrollRef}>
          <div className="ruler-sticky">
            <TimeRuler zoom={zoom} duration={project.duration} onSeek={handleSeek} width={totalWidth} scrollLeft={0} />
          </div>
          <div className="tracks-scroll-container" style={{ width: totalWidth }}>
            {sortedTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                zoom={zoom}
                selectedClipId={selectedClipId}
                mediaLibrary={mediaLibrary}
                snapPoints={snapPoints}
                snapEnabled={snapEnabled}
                totalWidth={totalWidth}
                onSelectClip={handleSelectClip}
                onMoveClip={handleMoveClip}
                onTrimClip={handleTrimClip}
                onSplitClip={handleSplitClip}
                onEditClip={handleEditClip}
                onDropMedia={(mediaId, startTime) => {
                  if (track.type === 'text') {
                    handleAddTextClip(track.id, startTime);
                  } else {
                    handleDropMedia(track.id, mediaId, startTime);
                  }
                }}
                onContextMenuClip={(e, clipId) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ x: e.clientX, y: e.clientY, clipId });
                }}
              />
            ))}
            <Playhead
              time={currentTime}
              zoom={zoom}
              height={sortedTracks.reduce((sum, t) => sum + t.height, 0)}
            />
          </div>
        </div>
      </div>
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { dispatch({ type: 'SELECT_CLIP', clipId: contextMenu.clipId }); dispatch({ type: 'SPLIT_CLIP', clipId: contextMenu.clipId, time: currentTime }); setContextMenu(null); }}>Split at playhead</button>
          <button onClick={() => { dispatch({ type: 'DUPLICATE_CLIP', clipId: contextMenu.clipId }); setContextMenu(null); }}>Duplicate</button>
          <button onClick={() => { dispatch({ type: 'COPY_CLIP', clipId: contextMenu.clipId }); setContextMenu(null); }}>Copy</button>
          <button className="danger" onClick={() => { dispatch({ type: 'REMOVE_CLIP', clipId: contextMenu.clipId }); setContextMenu(null); }}>Delete</button>
        </div>
      )}
    </div>
  );
};
