import React, { useRef, useState } from 'react';
import { Clip, MediaFile } from '../../types';

interface ClipBlockProps {
  clip: Clip;
  zoom: number;
  selected: boolean;
  media?: MediaFile;
  trackLocked: boolean;
  onSelect: () => void;
  onMove: (newStartTime: number) => void;
  onTrim: (edge: 'start' | 'end', deltaSeconds: number) => void;
  onSplit: (time: number) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const CLIP_COLORS: Record<Clip['type'], string> = {
  video: 'linear-gradient(180deg, #7c3aed, #5b21b6)',
  audio: 'linear-gradient(180deg, #06b6d4, #0891b2)',
  image: 'linear-gradient(180deg, #10b981, #047857)',
  text: 'linear-gradient(180deg, #f59e0b, #b45309)',
  sticker: 'linear-gradient(180deg, #ec4899, #be185d)',
  gif: 'linear-gradient(180deg, #ec4899, #be185d)',
};

export const ClipBlock: React.FC<ClipBlockProps> = ({
  clip,
  zoom,
  selected,
  media,
  trackLocked,
  onSelect,
  onMove,
  onTrim,
  onSplit,
  onDoubleClick,
  onContextMenu,
}) => {
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [trimming, setTrimming] = useState<'start' | 'end' | null>(null);
  const dragState = useRef<{ startX: number; origStart: number } | null>(null);

  const left = clip.startTime * zoom + dragOffsetPx;
  const width = Math.max(4, clip.duration * zoom);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (trackLocked || clip.locked) return;
    if ((e.target as HTMLElement).dataset.handle) return;
    e.stopPropagation();
    onSelect();
    dragState.current = { startX: e.clientX, origStart: clip.startTime };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const onMoveHandler = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      setDragOffsetPx(dx);
    };
    const onUpHandler = (ev: PointerEvent) => {
      if (dragState.current) {
        const dx = ev.clientX - dragState.current.startX;
        const deltaSeconds = dx / zoom;
        const newStart = Math.max(0, dragState.current.origStart + deltaSeconds);
        onMove(newStart);
      }
      setDragOffsetPx(0);
      dragState.current = null;
      window.removeEventListener('pointermove', onMoveHandler);
      window.removeEventListener('pointerup', onUpHandler);
    };
    window.addEventListener('pointermove', onMoveHandler);
    window.addEventListener('pointerup', onUpHandler);
  };

  const handleTrimPointerDown = (edge: 'start' | 'end') => (e: React.PointerEvent) => {
    if (trackLocked || clip.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setTrimming(edge);
    const startX = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const onMoveHandler = (ev: PointerEvent) => {
      // visual only; committed on pointer up
    };
    const onUpHandler = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const deltaSeconds = dx / zoom;
      onTrim(edge, deltaSeconds);
      setTrimming(null);
      window.removeEventListener('pointermove', onMoveHandler);
      window.removeEventListener('pointerup', onUpHandler);
    };
    window.addEventListener('pointermove', onMoveHandler);
    window.addEventListener('pointerup', onUpHandler);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.altKey) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickTime = clip.startTime + (e.clientX - rect.left) / zoom;
      onSplit(clickTime);
    } else {
      onDoubleClick();
    }
  };

  return (
    <div
      className={`clip-block ${selected ? 'selected' : ''} ${trimming ? 'trimming' : ''} ${clip.locked ? 'locked' : ''}`}
      style={{
        left,
        width,
        background: CLIP_COLORS[clip.type],
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      title={clip.name}
    >
      {!trackLocked && !clip.locked && (
        <>
          <div className="clip-trim-handle left" data-handle onPointerDown={handleTrimPointerDown('start')} />
          <div className="clip-trim-handle right" data-handle onPointerDown={handleTrimPointerDown('end')} />
        </>
      )}
      <div className="clip-content">
        {clip.type === 'video' && media?.thumbnailUrl && (
          <div
            className="clip-thumb-strip"
            style={{ backgroundImage: `url(${media.thumbnailUrl})` }}
          />
        )}
        {clip.type === 'audio' && media?.waveform && (
          <svg className="clip-waveform" viewBox={`0 0 ${media.waveform.length} 40`} preserveAspectRatio="none">
            {media.waveform.map((v, i) => (
              <rect key={i} x={i} y={20 - v * 18} width={0.8} height={v * 36} fill="rgba(255,255,255,0.65)" />
            ))}
          </svg>
        )}
        <span className="clip-label">
          {clip.type === 'text' ? '🔤' : clip.type === 'video' ? '🎬' : clip.type === 'audio' ? '🎵' : clip.type === 'image' ? '🖼️' : '✨'} {clip.name}
        </span>
      </div>
      {clip.fadeInDuration > 0 && <div className="clip-fade fade-in" style={{ width: clip.fadeInDuration * zoom }} />}
      {clip.fadeOutDuration > 0 && <div className="clip-fade fade-out" style={{ width: clip.fadeOutDuration * zoom }} />}
      {clip.locked && <span className="clip-lock-badge">🔒</span>}
    </div>
  );
};
