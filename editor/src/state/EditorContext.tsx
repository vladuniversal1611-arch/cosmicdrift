import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { EditorAction, EditorState, editorReducer, initialEditorState } from './editor-store';
import { Clip, MediaFile, Project } from '../types';
import { startAutosave } from '../utils/storage';

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  getSelectedClip: () => Clip | null;
  getMediaById: (id: string) => MediaFile | undefined;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, undefined, initialEditorState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const stop = startAutosave(() => stateRef.current.project);
    return stop;
  }, []);

  const getSelectedClip = (): Clip | null => {
    if (!state.selectedClipId) return null;
    for (const track of state.project.tracks) {
      const clip = track.clips.find((c) => c.id === state.selectedClipId);
      if (clip) return clip;
    }
    return null;
  };

  const getMediaById = (id: string) => state.mediaLibrary.find((m) => m.id === id);

  return (
    <EditorContext.Provider value={{ state, dispatch, getSelectedClip, getMediaById }}>
      {children}
    </EditorContext.Provider>
  );
};

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}

export function useProject(): Project {
  return useEditor().state.project;
}
