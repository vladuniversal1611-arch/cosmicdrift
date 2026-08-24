import React from 'react';
import './controls.css';

export const SliderControl: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min = -100, max = 100, step = 1, unit = '', onChange }) => (
  <div className="ctrl-row">
    <div className="ctrl-row-top">
      <label>{label}</label>
      <span className="ctrl-value">{Math.round(value * 100) / 100}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  </div>
);

export const ColorControl: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="ctrl-row ctrl-row-inline">
    <label>{label}</label>
    <input
      type="color"
      value={value.startsWith('#') ? value : '#ffffff'}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const NumberControl: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="ctrl-row ctrl-row-inline">
    <label>{label}</label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  </div>
);

export const SelectControl: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="ctrl-row ctrl-row-inline">
    <label>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export const ToggleControl: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, value, onChange }) => (
  <div className="ctrl-row ctrl-row-inline">
    <label>{label}</label>
    <button
      className={`toggle-switch ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
      type="button"
    >
      <span className="toggle-knob" />
    </button>
  </div>
);

export const IconButton: React.FC<{
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, active, disabled, children }) => (
  <button
    className={`icon-btn ${active ? 'active' : ''}`}
    title={title}
    onClick={onClick}
    disabled={disabled}
    type="button"
  >
    {children}
  </button>
);
