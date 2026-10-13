'use client';

import { useEffect, useRef } from 'react';

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength,
}) {
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

  function countText(html) {
    return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length;
  }

  function handleInput() {
    if (!editorRef.current) return;

    let html = editorRef.current.innerHTML;

    if (maxLength && countText(html) > maxLength) {
      // Revert to previous value if over limit
      editorRef.current.innerHTML = value || '';
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }

    onChange(html);
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
