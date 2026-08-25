import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { ASPECT_RATIO_DIMENSIONS, AspectRatio, Clip, EasingType, Keyframe } from '../../types';
import { SliderControl, ColorControl, NumberControl, SelectControl, ToggleControl } from '../common/Controls';
import { FONT_FAMILIES, TEXT_ANIMATIONS } from '../../utils/presets';
import { v4 as uuidv4 } from 'uuid';
import './Inspector.css';

export const Inspector: React.FC = () => {
  const { dispatch, getSelectedClip } = useEditor();
  const clip = getSelectedClip();

  if (!clip) {
    return <ProjectSettingsInspector />;
  }

  const update = (patch: Partial<Clip>) => dispatch({ type: 'UPDATE_CLIP', clipId: clip.id, patch });

  return (
    <div className="inspector">
      <div className="inspector-header">
        <span className="inspector-clip-icon">
          {clip.type === 'text' ? '🔤' : clip.type === 'video' ? '🎬' : clip.type === 'audio' ? '🎵' : clip.type === 'image' ? '🖼️' : '✨'}
        </span>
        <input
          className="inspector-title"
          value={clip.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <Section title="Transform">
        <SliderControl label="X Position" value={clip.x} min={-100} max={100} onChange={(v) => update({ x: v })} unit="%" />
        <SliderControl label="Y Position" value={clip.y} min={-100} max={100} onChange={(v) => update({ y: v })} unit="%" />
        <SliderControl label="Width" value={clip.width} min={1} max={300} onChange={(v) => update({ width: v })} unit="%" />
        <SliderControl label="Height" value={clip.height} min={1} max={300} onChange={(v) => update({ height: v })} unit="%" />
        <SliderControl label="Scale X" value={clip.scaleX} min={-3} max={3} step={0.05} onChange={(v) => update({ scaleX: v })} />
        <SliderControl label="Scale Y" value={clip.scaleY} min={-3} max={3} step={0.05} onChange={(v) => update({ scaleY: v })} />
        <SliderControl label="Rotation" value={clip.rotation} min={-180} max={180} onChange={(v) => update({ rotation: v })} unit="°" />
        <SliderControl label="Opacity" value={clip.opacity * 100} min={0} max={100} onChange={(v) => update({ opacity: v / 100 })} unit="%" />
        <div className="flip-row">
          <ToggleControl label="Flip horizontal" value={clip.flipX} onChange={(v) => update({ flipX: v })} />
          <ToggleControl label="Flip vertical" value={clip.flipY} onChange={(v) => update({ flipY: v })} />
        </div>
      </Section>

      {(clip.type === 'video' || clip.type === 'image') && (
        <Section title="Crop">
          <SliderControl label="Top" value={clip.cropTop * 100} min={0} max={49} onChange={(v) => update({ cropTop: v / 100 })} unit="%" />
          <SliderControl label="Bottom" value={clip.cropBottom * 100} min={0} max={49} onChange={(v) => update({ cropBottom: v / 100 })} unit="%" />
          <SliderControl label="Left" value={clip.cropLeft * 100} min={0} max={49} onChange={(v) => update({ cropLeft: v / 100 })} unit="%" />
          <SliderControl label="Right" value={clip.cropRight * 100} min={0} max={49} onChange={(v) => update({ cropRight: v / 100 })} unit="%" />
        </Section>
      )}

      {(clip.type === 'video' || clip.type === 'audio') && (
        <Section title="Playback">
          <SliderControl label="Speed" value={clip.speed} min={0.25} max={4} step={0.05} onChange={(v) => update({ speed: v })} unit="x" />
          <div className="speed-presets">
            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((s) => (
              <button key={s} className={`speed-btn ${clip.speed === s ? 'active' : ''}`} onClick={() => update({ speed: s })}>{s}x</button>
            ))}
          </div>
          <SliderControl label="Volume" value={clip.volume * 100} min={0} max={100} onChange={(v) => update({ volume: v / 100 })} unit="%" />
          <ToggleControl label="Muted" value={clip.muted} onChange={(v) => update({ muted: v })} />
          <ToggleControl label="Reversed" value={clip.reversed} onChange={(v) => update({ reversed: v })} />
          <SliderControl label="Fade In" value={clip.fadeInDuration} min={0} max={Math.min(5, clip.duration)} step={0.1} onChange={(v) => update({ fadeInDuration: v })} unit="s" />
          <SliderControl label="Fade Out" value={clip.fadeOutDuration} min={0} max={Math.min(5, clip.duration)} step={0.1} onChange={(v) => update({ fadeOutDuration: v })} unit="s" />
        </Section>
      )}

      {clip.type === 'video' && (
        <Section title="Filters">
          <SliderControl label="Brightness" value={clip.filters.brightness || 0} onChange={(v) => update({ filters: { ...clip.filters, brightness: v } })} />
          <SliderControl label="Contrast" value={clip.filters.contrast || 0} onChange={(v) => update({ filters: { ...clip.filters, contrast: v } })} />
          <SliderControl label="Saturation" value={clip.filters.saturation || 0} onChange={(v) => update({ filters: { ...clip.filters, saturation: v } })} />
          <SliderControl label="Vignette" value={clip.filters.vignette || 0} min={0} max={100} onChange={(v) => update({ filters: { ...clip.filters, vignette: v } })} />
        </Section>
      )}

      {clip.type === 'text' && clip.textStyle && (
        <TextInspector clip={clip} update={update} />
      )}

      <Section title="Effects Applied">
        {clip.effects.length === 0 && <div className="inspector-empty">No effects. Add from the Effects tab.</div>}
        {clip.effects.map((eff) => (
          <div key={eff.id} className="applied-effect">
            <ToggleControl
              label={eff.name}
              value={eff.enabled}
              onChange={(v) => dispatch({ type: 'UPDATE_EFFECT', clipId: clip.id, effectId: eff.id, patch: { enabled: v } })}
            />
            {Object.entries(eff.params).map(([key, val]) => (
              <SliderControl
                key={key}
                label={key}
                value={val}
                min={0}
                max={100}
                onChange={(v) =>
                  dispatch({
                    type: 'UPDATE_EFFECT',
                    clipId: clip.id,
                    effectId: eff.id,
                    patch: { params: { ...eff.params, [key]: v } },
                  })
                }
              />
            ))}
            <button
              className="remove-effect-btn"
              onClick={() => dispatch({ type: 'REMOVE_EFFECT', clipId: clip.id, effectId: eff.id })}
            >
              Remove effect
            </button>
          </div>
        ))}
      </Section>

      <Section title="Keyframes">
        <KeyframePanel clip={clip} dispatch={dispatch} />
      </Section>

      <Section title="Clip">
        <ToggleControl label="Locked" value={clip.locked} onChange={(v) => update({ locked: v })} />
        <button className="danger-btn" onClick={() => dispatch({ type: 'REMOVE_CLIP', clipId: clip.id })}>
          Delete clip
        </button>
      </Section>
    </div>
  );
};

const TextInspector: React.FC<{ clip: Clip; update: (patch: Partial<Clip>) => void }> = ({ clip, update }) => {
  const style = clip.textStyle!;
  const updateStyle = (patch: Partial<typeof style>) => update({ textStyle: { ...style, ...patch } });

  return (
    <>
      <Section title="Text">
        <textarea
          className="text-content-input"
          value={clip.text || ''}
          onChange={(e) => update({ text: e.target.value })}
          rows={3}
        />
        <SelectControl
          label="Font"
          value={style.fontFamily}
          options={FONT_FAMILIES.map((f) => ({ value: f, label: f.split(',')[0].replace(/"/g, '') }))}
          onChange={(v) => updateStyle({ fontFamily: v })}
        />
        <NumberControl label="Size" value={style.fontSize} min={8} max={200} onChange={(v) => updateStyle({ fontSize: v })} />
        <SelectControl
          label="Weight"
          value={String(style.fontWeight)}
          options={[
            { value: '300', label: 'Light' },
            { value: '400', label: 'Regular' },
            { value: '500', label: 'Medium' },
            { value: '700', label: 'Bold' },
            { value: '900', label: 'Black' },
          ]}
          onChange={(v) => updateStyle({ fontWeight: parseInt(v, 10) })}
        />
        <SelectControl
          label="Align"
          value={style.textAlign}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
          onChange={(v) => updateStyle({ textAlign: v as any })}
        />
        <ColorControl label="Color" value={style.color} onChange={(v) => updateStyle({ color: v })} />
        <SliderControl label="Letter Spacing" value={style.letterSpacing} min={-10} max={30} onChange={(v) => updateStyle({ letterSpacing: v })} />
        <SliderControl label="Line Height" value={style.lineHeight} min={0.8} max={3} step={0.05} onChange={(v) => updateStyle({ lineHeight: v })} />
      </Section>
      <Section title="Stroke & Shadow">
        <ColorControl label="Stroke Color" value={style.strokeColor} onChange={(v) => updateStyle({ strokeColor: v })} />
        <SliderControl label="Stroke Width" value={style.strokeWidth} min={0} max={20} onChange={(v) => updateStyle({ strokeWidth: v })} />
        <ColorControl label="Shadow Color" value={style.shadowColor} onChange={(v) => updateStyle({ shadowColor: v })} />
        <SliderControl label="Shadow Blur" value={style.shadowBlur} min={0} max={40} onChange={(v) => updateStyle({ shadowBlur: v })} />
        <SliderControl label="Shadow X" value={style.shadowOffsetX} min={-30} max={30} onChange={(v) => updateStyle({ shadowOffsetX: v })} />
        <SliderControl label="Shadow Y" value={style.shadowOffsetY} min={-30} max={30} onChange={(v) => updateStyle({ shadowOffsetY: v })} />
      </Section>
      <Section title="Background">
        <ColorControl label="Background" value={style.backgroundColor} onChange={(v) => updateStyle({ backgroundColor: v })} />
        <SliderControl label="Bg Opacity" value={style.backgroundOpacity * 100} min={0} max={100} onChange={(v) => updateStyle({ backgroundOpacity: v / 100 })} unit="%" />
      </Section>
      <Section title="Animation">
        <SelectControl
          label="Animation"
          value={style.animation}
          options={TEXT_ANIMATIONS.map((a) => ({ value: a, label: a.replace('-', ' ') }))}
          onChange={(v) => updateStyle({ animation: v })}
        />
        <SliderControl label="Anim. Duration" value={style.animationDuration} min={0.1} max={3} step={0.1} onChange={(v) => updateStyle({ animationDuration: v })} unit="s" />
      </Section>
    </>
  );
};

const ProjectSettingsInspector: React.FC = () => {
  const { state, dispatch } = useEditor();
  const { project } = state;

  return (
    <div className="inspector">
      <div className="inspector-header">
        <span className="inspector-clip-icon">⚙️</span>
        <input
          className="inspector-title"
          value={project.name}
          onChange={(e) => dispatch({ type: 'RENAME_PROJECT', name: e.target.value })}
        />
      </div>
      <Section title="Project Settings">
        <SelectControl
          label="Aspect Ratio"
          value={project.aspectRatio}
          options={Object.keys(ASPECT_RATIO_DIMENSIONS).map((ar) => ({ value: ar, label: ar }))}
          onChange={(v) => dispatch({ type: 'SET_ASPECT_RATIO', aspectRatio: v as AspectRatio })}
        />
        <div className="inspector-static-row">
          <span>Resolution</span>
          <span>{project.width} × {project.height}</span>
        </div>
        <SelectControl
          label="Frame Rate"
          value={String(project.fps)}
          options={[
            { value: '24', label: '24 fps' },
            { value: '30', label: '30 fps' },
            { value: '60', label: '60 fps' },
          ]}
          onChange={() => {}}
        />
        <ColorControl label="Background" value={project.backgroundColor} onChange={() => {}} />
        <div className="inspector-static-row">
          <span>Duration</span>
          <span>{project.duration.toFixed(2)}s</span>
        </div>
        <div className="inspector-static-row">
          <span>Tracks</span>
          <span>{project.tracks.length}</span>
        </div>
      </Section>
      <div className="inspector-empty" style={{ marginTop: 24 }}>
        Select a clip on the timeline to edit its properties.
      </div>
    </div>
  );
};

const KEYFRAME_PROPERTIES = [
  { value: 'x', label: 'Position X' },
  { value: 'y', label: 'Position Y' },
  { value: 'scaleX', label: 'Scale X' },
  { value: 'scaleY', label: 'Scale Y' },
  { value: 'rotation', label: 'Rotation' },
  { value: 'opacity', label: 'Opacity' },
];

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In Out' },
];

const KeyframePanel: React.FC<{ clip: Clip; dispatch: any }> = ({ clip, dispatch }) => {
  const [newProp, setNewProp] = useState('x');
  const [newTime, setNewTime] = useState(0);
  const [newValue, setNewValue] = useState(0);
  const [newEasing, setNewEasing] = useState<EasingType>('linear');

  const addKeyframe = () => {
    const kf: Keyframe = {
      id: uuidv4(),
      time: newTime,
      property: newProp,
      value: newValue,
      easing: newEasing,
    };
    dispatch({ type: 'ADD_KEYFRAME', clipId: clip.id, keyframe: kf });
  };

  const grouped = new Map<string, Keyframe[]>();
  clip.keyframes.forEach((kf) => {
    const list = grouped.get(kf.property) || [];
    list.push(kf);
    grouped.set(kf.property, list);
  });

  return (
    <div className="keyframe-panel">
      {clip.keyframes.length === 0 && (
        <div className="inspector-empty">No keyframes. Add one below for animated properties.</div>
      )}
      {Array.from(grouped.entries()).map(([prop, kfs]) => (
        <div key={prop} className="kf-group">
          <div className="kf-group-label">{KEYFRAME_PROPERTIES.find((p) => p.value === prop)?.label || prop}</div>
          {kfs.map((kf) => (
            <div key={kf.id} className="kf-row">
              <span className="kf-diamond">◆</span>
              <span className="kf-time">{kf.time.toFixed(2)}s</span>
              <span className="kf-val">{kf.value.toFixed(2)}</span>
              <span className="kf-easing">{kf.easing}</span>
              <button className="kf-remove" onClick={() => dispatch({ type: 'REMOVE_KEYFRAME', clipId: clip.id, keyframeId: kf.id })}>✕</button>
            </div>
          ))}
        </div>
      ))}
      <div className="kf-add">
        <h5>Add Keyframe</h5>
        <SelectControl label="Property" value={newProp} options={KEYFRAME_PROPERTIES} onChange={setNewProp} />
        <NumberControl label="Time (s)" value={newTime} min={0} max={clip.duration} step={0.1} onChange={setNewTime} />
        <NumberControl label="Value" value={newValue} min={-200} max={200} step={0.1} onChange={setNewValue} />
        <SelectControl label="Easing" value={newEasing} options={EASING_OPTIONS} onChange={(v) => setNewEasing(v as EasingType)} />
        <button className="primary-btn" onClick={addKeyframe}>+ Add Keyframe</button>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="inspector-section">
    <h4>{title}</h4>
    {children}
  </div>
);
