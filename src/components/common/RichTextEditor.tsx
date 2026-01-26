"use client";
import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  rows = 8,
  className = '',
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = '';
    if (tag === 'br') {
      newText = value.substring(0, start) + '<br />' + value.substring(end);
    } else {
      const openTag = `<${tag}>`;
      const closeTag = `</${tag}>`;
      newText = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end);
    }
    
    onChange(newText);
    
    // Set cursor position after the inserted tag
    setTimeout(() => {
      if (tag === 'br') {
        textarea.selectionStart = textarea.selectionEnd = start + 6; // length of '<br />'
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + tag.length + 2 + selectedText.length;
      }
      textarea.focus();
    }, 0);
  };

  const formatButtons = [
    { label: 'Bold', tag: 'strong', icon: 'B', title: 'Bold (Ctrl+B)' },
    { label: 'Italic', tag: 'em', icon: 'I', title: 'Italic (Ctrl+I)' },
    { label: 'Line Break', tag: 'br', icon: '↵', title: 'Insert line break' },
    { label: 'Paragraph', tag: 'p', icon: '¶', title: 'Wrap in paragraph' },
  ];

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertTag('strong');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertTag('em');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertTag('br');
      }
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex gap-1 mb-2 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-t-lg">
        {formatButtons.map((button) => (
          <button
            key={button.tag}
            type="button"
            onClick={() => insertTag(button.tag)}
            title={button.title}
            className="px-3 py-1 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className={button.tag === 'strong' ? 'font-bold' : button.tag === 'em' ? 'italic' : ''}>
              {button.icon}
            </span>
          </button>
        ))}
        
        <div className="flex-1" />
        
        <button
          type="button"
          onClick={() => {
            const lines = value.split('\n');
            const withBreaks = lines.join('<br />');
            onChange(withBreaks);
          }}
          title="Convert line breaks to <br /> tags"
          className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          Auto BR
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm border border-t-0 border-gray-300 rounded-b-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      />

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>💡 Tips:</p>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li>Select text and click buttons to format</li>
          <li>Use <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+B</kbd> for bold, <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+I</kbd> for italic</li>
          <li>Click "↵" or <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> to insert line break</li>
          <li>Click "Auto BR" to convert all line breaks to &lt;br /&gt; tags</li>
        </ul>
      </div>
    </div>
  );
}
