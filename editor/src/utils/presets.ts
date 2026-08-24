// Static preset catalogs used by the left panel tabs.

export interface EffectPreset {
  type: string;
  name: string;
  category: 'basic' | 'motion' | 'stylized';
  icon: string;
  defaultParams: Record<string, number>;
}

export const EFFECT_PRESETS: EffectPreset[] = [
  { type: 'sharpen', name: 'Sharpen', category: 'basic', icon: '◆', defaultParams: { amount: 50 } },
  { type: 'blur', name: 'Blur', category: 'basic', icon: '●', defaultParams: { amount: 30 } },
  { type: 'mirror', name: 'Mirror', category: 'basic', icon: '◐', defaultParams: { axis: 0 } },
  { type: 'pixelate', name: 'Pixelate', category: 'basic', icon: '▦', defaultParams: { size: 8 } },
  { type: 'zoom', name: 'Zoom In', category: 'motion', icon: '⊕', defaultParams: { speed: 20 } },
  { type: 'shake', name: 'Camera Shake', category: 'motion', icon: '⇄', defaultParams: { intensity: 40 } },
  { type: 'pan', name: 'Pan', category: 'motion', icon: '↔', defaultParams: { speed: 20 } },
  { type: 'spin', name: 'Spin', category: 'motion', icon: '⟳', defaultParams: { speed: 30 } },
  { type: 'glow', name: 'Glow', category: 'stylized', icon: '✦', defaultParams: { intensity: 50, radius: 10 } },
  { type: 'noise', name: 'Film Grain', category: 'stylized', icon: '░', defaultParams: { amount: 25 } },
  { type: 'vhs', name: 'VHS', category: 'stylized', icon: '▤', defaultParams: { intensity: 40 } },
  { type: 'chromatic', name: 'Chromatic Aberration', category: 'stylized', icon: '◑', defaultParams: { amount: 30 } },
  { type: 'glitch', name: 'Glitch', category: 'stylized', icon: '⚡', defaultParams: { intensity: 35 } },
  { type: 'duotone', name: 'Duotone', category: 'stylized', icon: '◖', defaultParams: { balance: 50 } },
];

export interface TransitionPreset {
  type: string;
  name: string;
  icon: string;
  defaultDuration: number;
}

export const TRANSITION_PRESETS: TransitionPreset[] = [
  { type: 'fade', name: 'Fade', icon: '◒', defaultDuration: 0.5 },
  { type: 'crossfade', name: 'Cross Dissolve', icon: '◓', defaultDuration: 0.6 },
  { type: 'slide-left', name: 'Slide Left', icon: '←', defaultDuration: 0.5 },
  { type: 'slide-right', name: 'Slide Right', icon: '→', defaultDuration: 0.5 },
  { type: 'wipe', name: 'Wipe', icon: '▤', defaultDuration: 0.5 },
  { type: 'zoom-blur', name: 'Zoom Blur', icon: '⊕', defaultDuration: 0.4 },
  { type: 'spin', name: 'Spin', icon: '⟳', defaultDuration: 0.6 },
  { type: 'flash', name: 'Flash', icon: '✦', defaultDuration: 0.3 },
];

export interface FilterPreset {
  id: string;
  name: string;
  thumb: string; // css gradient for preview
  values: Record<string, number>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Original', thumb: 'linear-gradient(135deg,#444,#666)', values: {} },
  { id: 'vivid', name: 'Vivid', thumb: 'linear-gradient(135deg,#ff6b6b,#feca57)', values: { saturation: 40, contrast: 15 } },
  { id: 'cinematic', name: 'Cinematic', thumb: 'linear-gradient(135deg,#2c3e50,#4a6572)', values: { contrast: 20, shadows: -15, temperature: -10 } },
  { id: 'noir', name: 'Noir', thumb: 'linear-gradient(135deg,#1a1a1a,#555)', values: { saturation: -100, contrast: 30 } },
  { id: 'warm', name: 'Warm', thumb: 'linear-gradient(135deg,#f6d365,#fda085)', values: { temperature: 25, saturation: 10 } },
  { id: 'cool', name: 'Cool', thumb: 'linear-gradient(135deg,#4facfe,#00f2fe)', values: { temperature: -25, tint: 5 } },
  { id: 'vintage', name: 'Vintage', thumb: 'linear-gradient(135deg,#d1913c,#ffd194)', values: { saturation: -20, temperature: 15, grain: 20 } },
  { id: 'moody', name: 'Moody', thumb: 'linear-gradient(135deg,#0f2027,#2c5364)', values: { contrast: 25, shadows: -25, saturation: -15 } },
  { id: 'pastel', name: 'Pastel', thumb: 'linear-gradient(135deg,#ffecd2,#fcb69f)', values: { saturation: -10, exposure: 10, contrast: -10 } },
  { id: 'dramatic', name: 'Dramatic', thumb: 'linear-gradient(135deg,#232526,#414345)', values: { contrast: 40, vignette: 30 } },
];

export interface TextPreset {
  id: string;
  name: string;
  preview: string;
  style: Partial<import('../types').TextStyle>;
}

export const TEXT_PRESETS: TextPreset[] = [
  { id: 'basic', name: 'Basic', preview: 'Aa', style: { fontSize: 48, fontWeight: 700, color: '#ffffff' } },
  { id: 'bold-outline', name: 'Bold Outline', preview: 'Aa', style: { fontSize: 52, fontWeight: 900, color: '#ffffff', strokeColor: '#000000', strokeWidth: 3 } },
  { id: 'neon', name: 'Neon', preview: 'Aa', style: { fontSize: 48, fontWeight: 800, color: '#06b6d4', shadowColor: '#06b6d4', shadowBlur: 20 } },
  { id: 'gradient', name: 'Gradient', preview: 'Aa', style: { fontSize: 52, fontWeight: 800, color: '#ffffff', gradient: { colors: ['#7c3aed', '#06b6d4'], angle: 90 } } },
  { id: 'subtitle', name: 'Subtitle', preview: 'Aa', style: { fontSize: 32, fontWeight: 500, color: '#ffffff', backgroundColor: '#000000', backgroundOpacity: 0.6 } },
  { id: 'minimal', name: 'Minimal', preview: 'Aa', style: { fontSize: 36, fontWeight: 300, color: '#e5e5e5', letterSpacing: 2 } },
  { id: 'shadow', name: 'Drop Shadow', preview: 'Aa', style: { fontSize: 48, fontWeight: 700, color: '#ffffff', shadowColor: 'rgba(0,0,0,0.8)', shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4 } },
  { id: 'title', name: 'Big Title', preview: 'Aa', style: { fontSize: 72, fontWeight: 900, color: '#ffffff', letterSpacing: -1 } },
];

export const TEXT_ANIMATIONS = ['none', 'fade-in', 'slide-up', 'slide-in', 'typewriter', 'bounce', 'pop'];

export const FONT_FAMILIES = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  '"Courier New", monospace',
  '"Trebuchet MS", sans-serif',
  'Impact, sans-serif',
  '"Comic Sans MS", cursive',
  'Verdana, sans-serif',
  '"Times New Roman", serif',
];

export interface StickerPreset {
  id: string;
  emoji: string;
  label: string;
}

export const STICKER_PRESETS: StickerPreset[] = [
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'sparkles', emoji: '✨', label: 'Sparkles' },
  { id: 'thumbsup', emoji: '👍', label: 'Thumbs Up' },
  { id: 'crown', emoji: '👑', label: 'Crown' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'sun', emoji: '☀️', label: 'Sun' },
  { id: 'moon', emoji: '🌙', label: 'Moon' },
  { id: 'clap', emoji: '👏', label: 'Clap' },
  { id: 'boom', emoji: '💥', label: 'Boom' },
  { id: 'check', emoji: '✅', label: 'Check' },
  { id: 'arrow', emoji: '➡️', label: 'Arrow' },
  { id: 'laugh', emoji: '😂', label: 'Laughing' },
  { id: 'eyes', emoji: '👀', label: 'Eyes' },
];

export interface TemplatePreset {
  id: string;
  name: string;
  category: string;
  aspectRatio: import('../types').AspectRatio;
  thumb: string;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  { id: 'vlog-intro', name: 'Vlog Intro', category: 'Social', aspectRatio: '9:16', thumb: 'linear-gradient(160deg,#7c3aed,#06b6d4)' },
  { id: 'product-promo', name: 'Product Promo', category: 'Marketing', aspectRatio: '1:1', thumb: 'linear-gradient(160deg,#f093fb,#f5576c)' },
  { id: 'travel-story', name: 'Travel Story', category: 'Social', aspectRatio: '9:16', thumb: 'linear-gradient(160deg,#43e97b,#38f9d7)' },
  { id: 'youtube-intro', name: 'YouTube Intro', category: 'Content', aspectRatio: '16:9', thumb: 'linear-gradient(160deg,#fa709a,#fee140)' },
  { id: 'slideshow', name: 'Photo Slideshow', category: 'Memories', aspectRatio: '4:5', thumb: 'linear-gradient(160deg,#30cfd0,#330867)' },
  { id: 'podcast-clip', name: 'Podcast Clip', category: 'Content', aspectRatio: '1:1', thumb: 'linear-gradient(160deg,#a8edea,#fed6e3)' },
];
