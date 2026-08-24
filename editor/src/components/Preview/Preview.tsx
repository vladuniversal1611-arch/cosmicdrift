import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor } from '../../state/EditorContext';
import { VideoEngine } from '../../engine/video-engine';
import { AudioEngine } from '../../engine/audio-engine';
import { formatTime } from '../../utils/format';
import './Preview.css';

interface PreviewProps {
  videoEngineRef: React.MutableRefObject<VideoEngine | null>;
  audioEngineRef: React.MutableRefObject<AudioEngine | null>;
}

export const Preview: React.FC<PreviewProps> = ({ videoEngineRef, audioEngineRef }) => {
  const { state, dispatch } = useEditor();
  const { project, mediaLibrary, currentTime, playing } = state;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize engines
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new VideoEngine(canvasRef.current);
    videoEngineRef.current = engine;
    let audioEngine: AudioEngine | null = null;
    try {
      audioEngine = new AudioEngine();
      audioEngineRef.current = audioEngine;
    } catch (e) {
      // audio context may fail before user gesture; created lazily elsewhere
    }
    return () => {
      engine.destroy();
      audioEngine?.destroy();
      videoEngineRef.current = null;
      audioEngineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize canvas to match project resolution
  useEffect(() => {
    videoEngineRef.current?.resize(project.width, project.height);
  }, [project.width, project.height, videoEngineRef]);

  // Fit canvas to container
  useEffect(() => {
    const fit = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const pad = 32;
      const scaleW = (clientWidth - pad) / project.width;
      const scaleH = (clientHeight - pad) / project.height;
      setCanvasScale(Math.max(0.05, Math.min(scaleW, scaleH)));
    };
    fit();
    window.addEventListener('resize', fit);
    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', fit);
      ro.disconnect();
    };
  }, [project.width, project.height]);

  // Load media into engine whenever library changes
  useEffect(() => {
    const engine = videoEngineRef.current;
    if (!engine) return;
    mediaLibrary.forEach((m) => {
      engine.loadMedia(m).catch(() => {});
    });
  }, [mediaLibrary, videoEngineRef]);

  // Render current frame whenever time / project changes and not playing
  useEffect(() => {
    const engine = videoEngineRef.current;
    if (!engine || playing) return;
    engine.seek(currentTime, project, mediaLibrary);
  }, [currentTime, project, mediaLibrary, playing, videoEngineRef]);

  // Playback loop
  useEffect(() => {
    const engine = videoEngineRef.current;
    if (!engine) return;
    if (playing) {
      audioEngineRef.current?.resume();
      engine.onTimeUpdate = (t) => dispatch({ type: 'SET_CURRENT_TIME', time: t });
      engine.onEnded = () => dispatch({ type: 'SET_PLAYING', playing: false });
      engine.play(() => currentTime, project, mediaLibrary, project.duration || 0.001);
    } else {
      engine.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const togglePlay = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', playing: !playing });
  }, [playing, dispatch]);

  const skip = (delta: number) => {
    const t = Math.max(0, Math.min(project.duration, currentTime + delta));
    dispatch({ type: 'SET_CURRENT_TIME', time: t });
  };

  const skipToStart = () => dispatch({ type: 'SET_CURRENT_TIME', time: 0 });
  const skipToEnd = () => dispatch({ type: 'SET_CURRENT_TIME', time: project.duration });

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="preview-panel">
      <div className="preview-canvas-area" ref={containerRef}>
        <div
          className="preview-canvas-wrap"
          style={{
            width: project.width * canvasScale,
            height: project.height * canvasScale,
          }}
        >
          <canvas ref={canvasRef} width={project.width} height={project.height} />
        </div>
      </div>
      <div className="preview-controls">
        <div className="preview-controls-left">
          <span className="time-display">
            {formatTime(currentTime, project.fps)} / {formatTime(project.duration, project.fps)}
          </span>
        </div>
        <div className="preview-controls-center">
          <button className="pc-btn" onClick={skipToStart} title="Go to start">⏮</button>
          <button className="pc-btn" onClick={() => skip(-1 / project.fps)} title="Previous frame">◀|</button>
          <button className="pc-btn pc-btn-play" onClick={togglePlay} title="Play/Pause (Space)">
            {playing ? '⏸' : '▶'}
          </button>
          <button className="pc-btn" onClick={() => skip(1 / project.fps)} title="Next frame">|▶</button>
          <button className="pc-btn" onClick={skipToEnd} title="Go to end">⏭</button>
        </div>
        <div className="preview-controls-right">
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              audioEngineRef.current?.setMasterVolume(v);
            }}
            title="Master volume"
          />
          <button className="pc-btn" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? '⤢' : '⛶'}
          </button>
        </div>
      </div>
    </div>
  );
};
