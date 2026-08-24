import { useEffect } from 'react';

export interface ShortcutHandlers {
  onPlayPause?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onSplit?: () => void;
  onStepBack?: () => void;
  onStepForward?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSave?: () => void;
  onExport?: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable || tag === 'select';
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.code === 'Space') {
        e.preventDefault();
        handlers.onPlayPause?.();
        return;
      }

      if (ctrl && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handlers.onUndo?.();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !ctrl) {
        e.preventDefault();
        handlers.onDelete?.();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'c') {
        handlers.onCopy?.();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'v') {
        handlers.onPaste?.();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handlers.onDuplicate?.();
        return;
      }
      if (e.key.toLowerCase() === 's' && !ctrl) {
        handlers.onSplit?.();
        return;
      }
      if (e.key === 'ArrowLeft' && !ctrl) {
        handlers.onStepBack?.();
        return;
      }
      if (e.key === 'ArrowRight' && !ctrl) {
        handlers.onStepForward?.();
        return;
      }
      if (e.key === '+' || e.key === '=') {
        handlers.onZoomIn?.();
        return;
      }
      if (e.key === '-' || e.key === '_') {
        handlers.onZoomOut?.();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handlers.onExport?.();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlers]);
}
