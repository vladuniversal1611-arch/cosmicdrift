import React from 'react';
import { formatDuration } from '../../utils/format';

interface TimeRulerProps {
  zoom: number; // px per second
  duration: number;
  onSeek: (time: number) => void;
  scrollLeft: number;
  width: number;
}

function pickInterval(zoom: number): number {
  const targetPx = 80;
  const raw = targetPx / zoom;
  const options = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
  return options.find((o) => o >= raw) || 300;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ zoom, duration, onSeek, width }) => {
  const interval = pickInterval(zoom);
  const totalTime = Math.max(duration + 20, width / zoom);
  const ticks: number[] = [];
  for (let t = 0; t <= totalTime; t += interval) ticks.push(t);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    onSeek(Math.max(0, x / zoom));
  };

  return (
    <div className="time-ruler" style={{ width: totalTime * zoom }} onClick={handleClick}>
      {ticks.map((t) => (
        <div key={t} className="ruler-tick" style={{ left: t * zoom }}>
          <div className="ruler-tick-line" />
          <span className="ruler-tick-label">{formatDuration(t)}</span>
        </div>
      ))}
    </div>
  );
};
