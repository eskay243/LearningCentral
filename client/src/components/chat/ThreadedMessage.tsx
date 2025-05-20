import React, { useState } from 'react';
import { ChatMessage } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageReactions } from './MessageReactions';
import { Reply, Check, CheckCheck, Image, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface ThreadedMessageProps {
  message: ChatMessage & {
    sender?: {
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    };
    reactions?: MessageReaction[];
    isRead?: boolean;
    repliedToMessage?: ChatMessage;
  };
  currentUserId: string;
  onReply: (messageId: number) => void;
  onAddReaction: (messageId: number, emoji: string) => void;
  onRemoveReaction: (messageId: number, emoji: string) => void;
  isOwnMessage: boolean;
}

export function ThreadedMessage({
  message,
  currentUserId,
  onReply,
  onAddReaction,
  onRemoveReaction,
  isOwnMessage,
}: ThreadedMessageProps) {
  const [showRepliedMessage, setShowRepliedMessage] = useState(false);

  // Format sender name
  const senderName = message.sender
    ? `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || 'Unknown User'
    : 'Unknown User';

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date
  const formatMessageDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Handle reactions
  const handleAddReaction = (emoji: string) => {
    onAddReaction(message.id, emoji);
  };

  const handleRemoveReaction = (emoji: string) => {
    onRemoveReaction(message.id, emoji);
  };

  // Render attachment if present
  const renderAttachment = () => {
    if (!message.attachmentUrl) return null;

    const isImage = message.contentType?.startsWith('image/');
    
    return (
      <div className="mt-2">
        {isImage ? (
          <div className="relative rounded-md overflow-hidden">
            <img 
              src={message.attachmentUrl} 
              alt="Attachment" 
              className="max-w-full max-h-48 object-contain"
            />
          </div>
        ) : (
          <a 
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="text-sm truncate">
              Attachment
            </span>
          </a>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-2 mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          {message.sender?.profileImageUrl ? (
            <AvatarImage src={message.sender.profileImageUrl} alt={senderName} />
          ) : (
            <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
          )}
        </Avatar>
      )}
      
      <div className={`flex flex-col max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Replied to message */}
        {message.repliedToMessage && (
          <div 
            className={`text-xs text-muted-foreground mb-1 cursor-pointer flex items-center ${isOwnMessage ? 'self-end' : 'self-start'}`}
            onClick={() => setShowRepliedMessage(!showRepliedMessage)}
          >
            <Reply className="h-3 w-3 mr-1" />
            <span>Replied to {message.repliedToMessage.senderId}</span>
          </div>
        )}
        
        {/* Replied message preview */}
        {showRepliedMessage && message.repliedToMessage && (
          <Card className="p-2 mb-1 text-xs max-w-[90%] bg-muted">
            <p className="font-medium">{message.repliedToMessage.senderId}</p>
            <p className="text-muted-foreground truncate">{message.repliedToMessage.content}</p>
          </Card>
        )}
        
        {/* Main message */}
        <div className={`${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-3 py-2`}>
          {!isOwnMessage && (
            <div className="text-xs font-medium mb-1">{senderName}</div>
          )}
          
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {/* Use react-markdown for rich text content */}
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* Render attachment if any */}
          {renderAttachment()}
        </div>
        
        {/* Message metadata */}
        <div className={`flex items-center mt-1 text-xs text-muted-foreground ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <span>{formatMessageDate(message.sentAt)}</span>
          
          {isOwnMessage && message.isRead && (
            <div className="ml-1 flex items-center">
              <CheckCheck className="h-3 w-3 text-primary" />
            </div>
          )}
          
          {/* Reply button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-1"
            onClick={() => onReply(message.id)}
          >
            <Reply className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Message reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            currentUserId={currentUserId}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
          />
        )}
      </div>
    </div>
  );
}