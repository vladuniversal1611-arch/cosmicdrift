import React from 'react';

interface PlayheadProps {
  time: number;
  zoom: number;
  height: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ time, zoom, height }) => {
  return (
    <div className="playhead" style={{ left: time * zoom, height }}>
      <div className="playhead-handle" />
      <div className="playhead-line" />
    </div>
  );
};
