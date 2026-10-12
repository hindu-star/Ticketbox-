'use client';

import { useEffect, useRef } from 'react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  function exec(command, arg) {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  }

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function addLink() {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  }

  return (
    <div className="rte-wrap">
      <div className="rte-toolbar">
        <button type="button" onClick={() => exec('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => exec('italic')} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => exec('underline')} title="Underline">
          <u>U</u>
        </button>
        <span className="rte-divider" />
        <button type="button" onClick={() => exec('formatBlock', 'H3')} title="Heading">
          H
        </button>
        <button type="button" onClick={() => exec('formatBlock', 'BLOCKQUOTE')} title="Quote">
          ❝
        </button>
        <span className="rte-divider" />
        <button type="button" onClick={() => exec('insertUnorderedList')} title="Bullet list">
          • List
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} title="Numbered list">
          1. List
        </button>
        <span className="rte-divider" />
        <button type="button" onClick={addLink} title="Add link">
          🔗
        </button>
        <span className="rte-divider" />
        <button type="button" onClick={() => exec('undo')} title="Undo">
          ↺
        </button>
        <button type="button" onClick={() => exec('redo')} title="Redo">
          ↻
        </button>
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder || 'Write your description...'}
      />
    </div>
  );
}
