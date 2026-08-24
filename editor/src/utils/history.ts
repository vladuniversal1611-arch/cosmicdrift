// Undo/redo history system using a snapshot-based command pattern.
// Each entry stores a serializable label + the project snapshot before and after
// the action, so undo/redo is just swapping snapshots — simple and fully robust
// against any editing operation without hand-writing inverse operations for each.

import { Project } from '../types';

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  before: Project;
  after: Project;
}

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxSize = 100;

  push(entry: HistoryEntry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo(): Project | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(entry);
    return entry.before;
  }

  redo(): Project | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.undoStack.push(entry);
    return entry.after;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  get undoLabel(): string | null {
    return this.undoStack.length
      ? this.undoStack[this.undoStack.length - 1].label
      : null;
  }

  get redoLabel(): string | null {
    return this.redoStack.length
      ? this.redoStack[this.redoStack.length - 1].label
      : null;
  }
}
