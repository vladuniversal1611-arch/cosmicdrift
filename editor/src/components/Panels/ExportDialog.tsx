import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { ExportSettings } from '../../types';
import { ExportEngine, ExportProgress, computeExportDimensions, downloadBlob } from '../../engine/export-engine';
import './ExportDialog.css';

interface ExportDialogProps {
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose }) => {
  const { state } = useEditor();
  const { project, mediaLibrary } = state;
  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '1080p',
    fps: 30,
    quality: 'high',
    format: 'webm',
    width: project.width,
    height: project.height,
  });
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [engine] = useState(() => new ExportEngine());
  const [error, setError] = useState<string | null>(null);

  const dims = computeExportDimensions(project, settings);

  const startExport = async () => {
    setError(null);
    setProgress({ frame: 0, totalFrames: 0, percent: 0, stage: 'preparing' });
    try {
      const blob = await engine.export(project, mediaLibrary, settings, setProgress);
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      downloadBlob(blob, `${project.name.replace(/\s+/g, '_')}.${ext}`);
    } catch (e: any) {
      setError(e.message || 'Export failed');
    }
  };

  const cancelExport = () => {
    engine.cancel();
  };

  const isExporting = progress && progress.stage !== 'done' && progress.stage !== 'error';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="export-dialog-header">
          <h3>Export Video</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!isExporting && (
          <div className="export-dialog-body">
            <div className="export-row">
              <label>Resolution</label>
              <select value={settings.resolution} onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}>
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="1440p">1440p QHD</option>
                <option value="4k">4K UHD</option>
              </select>
            </div>
            <div className="export-row">
              <label>Frame Rate</label>
              <select value={settings.fps} onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value, 10) as any })}>
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
            <div className="export-row">
              <label>Quality</label>
              <select value={settings.quality} onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}>
                <option value="low">Low (smaller file)</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="maximum">Maximum</option>
              </select>
            </div>
            <div className="export-summary">
              <div><strong>Output:</strong> {dims.width} × {dims.height}</div>
              <div><strong>Duration:</strong> {project.duration.toFixed(1)}s</div>
              <div><strong>Est. size:</strong> ~{Math.round((project.duration * settings.fps * 0.02))} MB</div>
            </div>
            {error && <div className="export-error">{error}</div>}
            <button className="primary-btn" onClick={startExport}>Export & Download</button>
          </div>
        )}

        {isExporting && progress && (
          <div className="export-dialog-body">
            <div className="export-progress-label">
              {progress.stage === 'preparing' && 'Preparing media…'}
              {progress.stage === 'rendering' && `Rendering frame ${progress.frame} / ${progress.totalFrames}`}
              {progress.stage === 'encoding' && 'Finalizing encode…'}
            </div>
            <div className="export-progress-bar">
              <div className="export-progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="export-progress-percent">{progress.percent}%</div>
            <button className="secondary-btn" onClick={cancelExport}>Cancel</button>
          </div>
        )}

        {progress?.stage === 'done' && (
          <div className="export-done">✅ Export complete — download started.</div>
        )}
      </div>
    </div>
  );
};
