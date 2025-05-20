import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Code, List, ListOrdered, Link, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileAttachmentButton } from './FileAttachmentButton';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTypingStateChange?: (isTyping: boolean) => void;
  attachment?: {
    url: string;
    name: string;
    type: string;
  } | null;
  onAttachment: (url: string, name: string, type: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  onSend,
  onTypingStateChange,
  attachment,
  onAttachment,
  disabled = false,
  placeholder = 'Type a message...'
}: RichTextEditorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts and formatting
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Send message on Enter (but not with Shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }

    // Set typing indicator
    if (!isTyping) {
      setIsTyping(true);
      if (onTypingStateChange) {
        onTypingStateChange(true);
      }
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 1.5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onTypingStateChange) {
        onTypingStateChange(false);
      }
    }, 1500);

    // Handle keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'k':
          e.preventDefault();
          formatText('link');
          break;
        case '`':
          e.preventDefault();
          formatText('code');
          break;
      }
    }
  };

  // Format text with markdown syntax
  const formatText = (type: 'bold' | 'italic' | 'code' | 'list' | 'ordered-list' | 'link') => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'code':
        formattedText = selectedText.includes('\n') 
          ? `\`\`\`\n${selectedText}\n\`\`\``
          : `\`${selectedText}\``;
        cursorOffset = selectedText.includes('\n') ? 4 : 1;
        break;
      case 'list':
        formattedText = selectedText
          .split('\n')
          .map(line => `- ${line}`)
          .join('\n');
        cursorOffset = 2;
        break;
      case 'ordered-list':
        formattedText = selectedText
          .split('\n')
          .map((line, index) => `${index + 1}. ${line}`)
          .join('\n');
        cursorOffset = 3;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        cursorOffset = 3;
        break;
    }

    // Insert the formatted text
    document.execCommand('insertText', false, formattedText);

    // Update state
    if (editorRef.current) {
      onChange(editorRef.current.innerText);
    }
  };

  // Handle paste to strip formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  // Handle input changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerText);
    }
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      {/* Formatting toolbar */}
      <div className="border-b px-3 py-1 flex items-center space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => formatText('bold')}
                disabled={disabled}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Bold (Ctrl+B)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => formatText('italic')}
                disabled={disabled}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Italic (Ctrl+I)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => formatText('code')}
                disabled={disabled}
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Code (Ctrl+`)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => formatText('list')}
                disabled={disabled}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Bullet List</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => formatText('ordered-list')}
                disabled={disabled}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Numbered List</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => formatText('link')}
                disabled={disabled}
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add Link (Ctrl+K)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="ml-auto">
          <FileAttachmentButton
            onFileAttached={onAttachment}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className="px-3 py-2 bg-muted/50">
          <div className="flex items-center space-x-2">
            {attachment.type.startsWith('image/') ? (
              <Image className="h-4 w-4" />
            ) : (
              <Code className="h-4 w-4" />
            )}
            <span className="text-sm truncate">{attachment.name}</span>
          </div>
        </div>
      )}

      {/* Editable content area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        className="px-3 py-2 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none"
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onInput={handleInput}
        data-placeholder={placeholder}
        aria-label="Message"
        role="textbox"
        style={{
          wordBreak: 'break-word',
        }}
      />
    </div>
  );
}