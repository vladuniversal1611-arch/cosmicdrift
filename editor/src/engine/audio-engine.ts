// Web Audio API engine: per-clip gain nodes, fades, waveform + mic recording.

import { Clip, MediaFile, Project } from '../types';

interface AudioNodeEntry {
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  element: HTMLAudioElement | HTMLVideoElement;
}

export class AudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private nodes: Map<string, AudioNodeEntry> = new Map();
  private analyser: AnalyserNode;

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStream: MediaStream | null = null;

  constructor() {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  get audioContext() {
    return this.ctx;
  }

  resume() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  registerElement(mediaId: string, element: HTMLAudioElement | HTMLVideoElement) {
    if (this.nodes.has(mediaId)) return;
    try {
      const source = this.ctx.createMediaElementSource(element);
      const gain = this.ctx.createGain();
      source.connect(gain);
      gain.connect(this.masterGain);
      this.nodes.set(mediaId, { source, gain, element });
    } catch (e) {
      // element may already be connected elsewhere; ignore
    }
  }

  setClipVolume(clip: Clip, localTime: number) {
    const entry = this.nodes.get(clip.mediaId);
    if (!entry) return;
    let vol = clip.muted ? 0 : clip.volume;
    if (clip.fadeInDuration > 0 && localTime < clip.fadeInDuration) {
      vol *= localTime / clip.fadeInDuration;
    }
    if (clip.fadeOutDuration > 0 && localTime > clip.duration - clip.fadeOutDuration) {
      vol *= Math.max(0, (clip.duration - localTime) / clip.fadeOutDuration);
    }
    entry.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.02);
  }

  muteAll() {
    this.nodes.forEach((entry) => entry.gain.gain.setValueAtTime(0, this.ctx.currentTime));
  }

  setMasterVolume(v: number) {
    this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  getAnalyser() {
    return this.analyser;
  }

  syncProject(project: Project, time: number) {
    project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (clip.type !== 'audio' && clip.type !== 'video') return;
        const active = time >= clip.startTime && time < clip.startTime + clip.duration;
        if (active && !track.muted) {
          this.setClipVolume(clip, time - clip.startTime);
        } else {
          const entry = this.nodes.get(clip.mediaId);
          if (entry) entry.gain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
      });
    });
  }

  unregister(mediaId: string) {
    const entry = this.nodes.get(mediaId);
    if (entry) {
      entry.source.disconnect();
      entry.gain.disconnect();
      this.nodes.delete(mediaId);
    }
  }

  // -------------------------------------------------------------------------
  // Waveform generation (offline decode)
  // -------------------------------------------------------------------------

  async generateWaveform(mediaFile: MediaFile, samples = 200): Promise<number[]> {
    if (!mediaFile.file) return new Array(samples).fill(0.2);
    try {
      const buf = await mediaFile.file.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(buf.slice(0));
      const channel = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channel.length / samples) || 1;
      const waveform: number[] = [];
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channel[start + j] || 0);
        }
        waveform.push(sum / blockSize);
      }
      const max = Math.max(...waveform, 0.0001);
      return waveform.map((v) => v / max);
    } catch {
      return new Array(samples).fill(0.2);
    }
  }

  // -------------------------------------------------------------------------
  // Microphone recording
  // -------------------------------------------------------------------------

  async startRecording(): Promise<void> {
    this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.recordingStream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.start();
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Not recording'));
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordingStream?.getTracks().forEach((t) => t.stop());
        this.recordingStream = null;
        this.mediaRecorder = null;
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  isRecording() {
    return !!this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }

  destroy() {
    this.nodes.forEach((entry) => {
      entry.source.disconnect();
      entry.gain.disconnect();
    });
    this.nodes.clear();
    this.ctx.close();
  }
}
