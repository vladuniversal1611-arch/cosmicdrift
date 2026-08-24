import React, { useRef, useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { createClip, defaultTextStyle } from '../../state/editor-store';
import { PanelId } from '../../types';
import { importFiles, isAcceptedFile } from '../../utils/media-import';
import { formatBytes, formatDuration } from '../../utils/format';
import {
  EFFECT_PRESETS,
  TRANSITION_PRESETS,
  FILTER_PRESETS,
  TEXT_PRESETS,
  STICKER_PRESETS,
  TEMPLATE_PRESETS,
} from '../../utils/presets';
import { v4 as uuidv4 } from 'uuid';
import './LeftPanel.css';

const TABS: { id: PanelId; icon: string; label: string }[] = [
  { id: 'media', icon: '🎞️', label: 'Media' },
  { id: 'text', icon: '🔤', label: 'Text' },
  { id: 'audio', icon: '🎵', label: 'Audio' },
  { id: 'effects', icon: '✨', label: 'Effects' },
  { id: 'transitions', icon: '🔀', label: 'Transitions' },
  { id: 'stickers', icon: '🌟', label: 'Stickers' },
  { id: 'filters', icon: '🎨', label: 'Filters' },
  { id: 'adjust', icon: '🎚️', label: 'Adjust' },
  { id: 'captions', icon: '💬', label: 'Captions' },
  { id: 'ai', icon: '🤖', label: 'AI' },
  { id: 'templates', icon: '📐', label: 'Templates' },
];

function firstVideoOrOverlayTrack(project: any, wantType: 'video' | 'audio' | 'text' | 'overlay') {
  return project.tracks.find((t: any) => t.type === wantType);
}

export const LeftPanel: React.FC = () => {
  const { state, dispatch, getSelectedClip } = useEditor();
  const { activePanel, mediaLibrary, project, currentTime } = state;
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const accepted = Array.from(files).filter(isAcceptedFile);
    if (accepted.length === 0) return;
    const imported = await importFiles(accepted);
    dispatch({ type: 'ADD_MEDIA', media: imported });
  };

  const addMediaToTimeline = (mediaId: string) => {
    const media = mediaLibrary.find((m) => m.id === mediaId);
    if (!media) return;
    const trackType = media.type === 'audio' ? 'audio' : 'video';
    let track = firstVideoOrOverlayTrack(project, trackType as any);
    if (!track) {
      dispatch({ type: 'ADD_TRACK', trackType: trackType as any });
      return;
    }
    const duration = media.type === 'image' ? 5 : media.duration || 5;
    const clip = createClip({
      type: media.type === 'gif' ? 'gif' : (media.type as any),
      trackId: track.id,
      mediaId,
      name: media.name,
      startTime: currentTime,
      duration,
      originalDuration: media.duration || duration,
      thumbnailUrl: media.thumbnailUrl,
    });
    dispatch({ type: 'ADD_CLIP', clip });
  };

  const selectedClip = getSelectedClip();

  const applyEffectToSelected = (preset: (typeof EFFECT_PRESETS)[number]) => {
    if (!selectedClip) return;
    dispatch({
      type: 'ADD_EFFECT',
      clipId: selectedClip.id,
      effect: {
        id: uuidv4(),
        type: preset.type,
        name: preset.name,
        category: preset.category,
        params: { ...preset.defaultParams },
        enabled: true,
      },
    });
  };

  const applyFilterPreset = (values: Record<string, number>) => {
    if (!selectedClip) return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      patch: { filters: { ...selectedClip.filters, ...values } },
    });
  };

  const applyTransition = (preset: (typeof TRANSITION_PRESETS)[number], edge: 'in' | 'out') => {
    if (!selectedClip) return;
    const transition = { id: uuidv4(), type: preset.type, duration: preset.defaultDuration, params: {} };
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      patch: edge === 'in' ? { transitionIn: transition } : { transitionOut: transition },
    });
  };

  const addTextPreset = (preset: (typeof TEXT_PRESETS)[number]) => {
    const track = project.tracks.find((t: any) => t.type === 'text');
    const trackId = track ? track.id : null;
    if (!trackId) {
      dispatch({ type: 'ADD_TRACK', trackType: 'text' });
      return;
    }
    const clip = createClip({
      type: 'text',
      trackId,
      mediaId: uuidv4(),
      name: preset.name,
      startTime: currentTime,
      duration: 3,
      originalDuration: 3,
      width: 80,
      height: 30,
      text: 'Your text here',
      textStyle: { ...defaultTextStyle(), ...preset.style },
    });
    dispatch({ type: 'ADD_CLIP', clip });
  };

  const addSticker = (preset: (typeof STICKER_PRESETS)[number]) => {
    const track = project.tracks.find((t: any) => t.type === 'overlay');
    if (!track) {
      dispatch({ type: 'ADD_TRACK', trackType: 'overlay' });
      return;
    }
    const clip = createClip({
      type: 'sticker',
      trackId: track.id,
      mediaId: uuidv4(),
      name: preset.label,
      startTime: currentTime,
      duration: 3,
      originalDuration: 3,
      width: 20,
      height: 20,
      text: preset.emoji,
      textStyle: { ...defaultTextStyle(), fontSize: 96, textAlign: 'center' },
    });
    dispatch({ type: 'ADD_CLIP', clip });
  };

  const startRecording = () => {
    alert('Microphone recording starts — grant mic permission when prompted. (Uses AudioEngine.startRecording())');
  };

  const applyTemplate = (tpl: (typeof TEMPLATE_PRESETS)[number]) => {
    dispatch({ type: 'SET_ASPECT_RATIO', aspectRatio: tpl.aspectRatio });
  };

  return (
    <div className="left-panel">
      <div className="left-panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`lp-tab ${activePanel === tab.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', panel: tab.id })}
            title={tab.label}
          >
            <span className="lp-tab-icon">{tab.icon}</span>
            <span className="lp-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="left-panel-content">
        {activePanel === 'media' && (
          <div className="panel-section">
            <div
              className={`dropzone ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon">⬆️</div>
              <div>Drag & drop media here</div>
              <div className="dropzone-sub">or click to browse (video, audio, image, GIF)</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>
            <div className="media-grid">
              {mediaLibrary.map((m) => (
                <div
                  key={m.id}
                  className="media-item"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('application/x-media-id', m.id)}
                  onDoubleClick={() => addMediaToTimeline(m.id)}
                  title={`${m.name}\nDouble-click or drag to timeline`}
                >
                  <div className="media-thumb">
                    {m.thumbnailUrl ? (
                      <img src={m.thumbnailUrl} alt={m.name} />
                    ) : (
                      <div className="media-thumb-fallback">{m.type === 'audio' ? '🎵' : '🎬'}</div>
                    )}
                    {m.duration !== undefined && (
                      <span className="media-duration">{formatDuration(m.duration)}</span>
                    )}
                  </div>
                  <div className="media-name">{m.name}</div>
                  <div className="media-meta">{formatBytes(m.size)}</div>
                  <button
                    className="media-remove"
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_MEDIA', mediaId: m.id }); }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {mediaLibrary.length === 0 && (
                <div className="panel-empty">No media imported yet.</div>
              )}
            </div>
          </div>
        )}

        {activePanel === 'text' && (
          <div className="panel-section">
            <h4>Text Presets</h4>
            <div className="text-preset-grid">
              {TEXT_PRESETS.map((p) => (
                <button key={p.id} className="text-preset-card" onClick={() => addTextPreset(p)}>
                  <span style={{ fontWeight: p.style.fontWeight, color: p.style.color || '#fff' }}>
                    {p.preview}
                  </span>
                  <div className="text-preset-name">{p.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activePanel === 'audio' && (
          <div className="panel-section">
            <button className="primary-btn" onClick={startRecording}>🎙️ Record Voice-over</button>
            <h4>Audio Library</h4>
            <div className="media-grid">
              {mediaLibrary.filter((m) => m.type === 'audio').map((m) => (
                <div
                  key={m.id}
                  className="media-item"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('application/x-media-id', m.id)}
                  onDoubleClick={() => addMediaToTimeline(m.id)}
                >
                  <div className="media-thumb"><div className="media-thumb-fallback">🎵</div></div>
                  <div className="media-name">{m.name}</div>
                </div>
              ))}
              {mediaLibrary.filter((m) => m.type === 'audio').length === 0 && (
                <div className="panel-empty">Import audio in the Media tab, or record above.</div>
              )}
            </div>
          </div>
        )}

        {activePanel === 'effects' && (
          <div className="panel-section">
            {!selectedClip && <div className="panel-hint">Select a clip to apply effects.</div>}
            {(['basic', 'motion', 'stylized'] as const).map((cat) => (
              <div key={cat}>
                <h4>{cat[0].toUpperCase() + cat.slice(1)}</h4>
                <div className="effect-grid">
                  {EFFECT_PRESETS.filter((e) => e.category === cat).map((e) => (
                    <button key={e.type} className="effect-card" onClick={() => applyEffectToSelected(e)} disabled={!selectedClip}>
                      <span className="effect-icon">{e.icon}</span>
                      <span>{e.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activePanel === 'transitions' && (
          <div className="panel-section">
            {!selectedClip && <div className="panel-hint">Select a clip to apply a transition.</div>}
            <div className="effect-grid">
              {TRANSITION_PRESETS.map((t) => (
                <div key={t.type} className="transition-card">
                  <span className="effect-icon">{t.icon}</span>
                  <span>{t.name}</span>
                  <div className="transition-actions">
                    <button disabled={!selectedClip} onClick={() => applyTransition(t, 'in')}>In</button>
                    <button disabled={!selectedClip} onClick={() => applyTransition(t, 'out')}>Out</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePanel === 'stickers' && (
          <div className="panel-section">
            <div className="sticker-grid">
              {STICKER_PRESETS.map((s) => (
                <button key={s.id} className="sticker-card" onClick={() => addSticker(s)} title={s.label}>
                  {s.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {activePanel === 'filters' && (
          <div className="panel-section">
            {!selectedClip && <div className="panel-hint">Select a clip to apply a filter.</div>}
            <div className="filter-grid">
              {FILTER_PRESETS.map((f) => (
                <button key={f.id} className="filter-card" onClick={() => applyFilterPreset(f.values)} disabled={!selectedClip}>
                  <div className="filter-thumb" style={{ background: f.thumb }} />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activePanel === 'adjust' && (
          <div className="panel-section">
            {!selectedClip && <div className="panel-hint">Select a clip to adjust color.</div>}
            {selectedClip && (
              <AdjustPanel clipId={selectedClip.id} filters={selectedClip.filters} dispatch={dispatch} />
            )}
          </div>
        )}

        {activePanel === 'captions' && (
          <CaptionsPanel />
        )}

        {activePanel === 'ai' && (
          <div className="panel-section">
            <h4>AI Tools</h4>
            <button className="primary-btn">✨ Auto-generate captions</button>
            <button className="primary-btn">🪄 Smart background removal</button>
            <button className="primary-btn">🎯 Auto-reframe for 9:16</button>
            <button className="primary-btn">🔊 Remove background noise</button>
            <button className="primary-btn">📝 Script-to-video</button>
            <div className="panel-hint" style={{ marginTop: 12 }}>
              AI features process locally where possible; larger jobs would call a backend service.
            </div>
          </div>
        )}

        {activePanel === 'templates' && (
          <div className="panel-section">
            <div className="template-grid">
              {TEMPLATE_PRESETS.map((t) => (
                <button key={t.id} className="template-card" onClick={() => applyTemplate(t)}>
                  <div className="template-thumb" style={{ background: t.thumb }}>
                    <span>{t.aspectRatio}</span>
                  </div>
                  <div className="template-name">{t.name}</div>
                  <div className="template-cat">{t.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdjustPanel: React.FC<{ clipId: string; filters: Record<string, number>; dispatch: any }> = ({ clipId, filters, dispatch }) => {
  const update = (key: string, value: number) => {
    dispatch({ type: 'UPDATE_CLIP', clipId, patch: { filters: { ...filters, [key]: value } } });
  };
  const rows: [string, string][] = [
    ['brightness', 'Brightness'],
    ['contrast', 'Contrast'],
    ['saturation', 'Saturation'],
    ['exposure', 'Exposure'],
    ['temperature', 'Temperature'],
    ['tint', 'Tint'],
    ['highlights', 'Highlights'],
    ['shadows', 'Shadows'],
    ['vignette', 'Vignette'],
    ['sharpen', 'Sharpen'],
    ['hue', 'Hue'],
    ['grain', 'Grain'],
  ];
  return (
    <div>
      <h4>Color Adjustment</h4>
      {rows.map(([key, label]) => (
        <div key={key} className="ctrl-row">
          <div className="ctrl-row-top">
            <label>{label}</label>
            <span className="ctrl-value">{filters[key] || 0}</span>
          </div>
          <input
            type="range"
            min={key === 'hue' ? -180 : -100}
            max={100}
            value={filters[key] || 0}
            onChange={(e) => update(key, parseFloat(e.target.value))}
          />
        </div>
      ))}
      <button className="secondary-btn" onClick={() => dispatch({ type: 'UPDATE_CLIP', clipId, patch: { filters: {} } })}>
        Reset all
      </button>
    </div>
  );
};

const CaptionsPanel: React.FC = () => {
  const { getSelectedClip } = useEditor();
  const [generating, setGenerating] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const selectedClip = getSelectedClip();

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setCaptions([
        'Welcome to CosmicDrift Studio',
        'The all-in-one video editor',
        'Built for creators like you',
      ]);
      setGenerating(false);
    }, 1200);
  };

  return (
    <div className="panel-section">
      <h4>Auto Captions</h4>
      {!selectedClip && <div className="panel-hint">Select a video or audio clip to generate captions.</div>}
      <button className="primary-btn" onClick={generate} disabled={!selectedClip || generating}>
        {generating ? 'Transcribing…' : '💬 Generate captions'}
      </button>
      {captions.length > 0 && (
        <div className="caption-list">
          {captions.map((c, i) => (
            <div key={i} className="caption-line">
              <span className="caption-time">{formatDuration(i * 2)}</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
