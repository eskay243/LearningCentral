import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}

// Common emoji reactions
const commonEmojis = [
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '😄', label: 'Smile' },
  { emoji: '🎉', label: 'Celebration' },
  { emoji: '🙏', label: 'Thank You' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😮', label: 'Wow' },
];

export function MessageReactions({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction
}: MessageReactionsProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Check if the current user has reacted with a specific emoji
  const hasUserReacted = (reaction: MessageReaction) => {
    return reaction.userIds.includes(currentUserId);
  };

  // Handle reaction click (toggle)
  const handleReactionClick = (emoji: string, userIds: string[]) => {
    if (userIds.includes(currentUserId)) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
  };

  // Handle adding a new emoji from the picker
  const handleEmojiSelect = (emoji: string) => {
    onAddReaction(emoji);
    setIsEmojiPickerOpen(false);
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          size="sm"
          variant={hasUserReacted(reaction) ? "secondary" : "outline"}
          className="h-7 px-2 text-xs gap-1 rounded-full"
          onClick={() => handleReactionClick(reaction.emoji, reaction.userIds)}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}

      {/* Add reaction button */}
      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 rounded-full"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {commonEmojis.map((item) => (
              <Button
                key={item.emoji}
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handleEmojiSelect(item.emoji)}
                title={item.label}
              >
                <span className="text-lg">{item.emoji}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}