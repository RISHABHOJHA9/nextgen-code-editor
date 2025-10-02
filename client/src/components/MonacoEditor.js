 import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
//import './MonacoEditor.scss'

const MonacoEditor = ({ code, setCode, language }) => {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const safeCode = typeof code === 'string' ? code : ''; // Prevent null/undefined
    const model = monaco.editor.createModel(safeCode, language || 'javascript');
    modelRef.current = model;

    const editor = monaco.editor.create(editorRef.current, {
      model: model,
      theme: 'vs-dark',
      automaticLayout: true,
    });

    editorInstanceRef.current = editor;

    const contentListener = model.onDidChangeContent(() => {
      setCode(model.getValue());
    });

    return () => {
      contentListener.dispose();
      model.dispose();
      editor.dispose();
    };
  }, []); // Mount once

  useEffect(() => {
    const model = modelRef.current;
    if (model && model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language]);

  useEffect(() => {
    const model = modelRef.current;
    const safeCode = typeof code === 'string' ? code : '';
    if (model && model.getValue() !== safeCode) {
      model.setValue(safeCode);
    }
  }, [code]);

  return <div ref={editorRef} style={{ height: '500px', width: '100%' }} />;
};

export default MonacoEditor;