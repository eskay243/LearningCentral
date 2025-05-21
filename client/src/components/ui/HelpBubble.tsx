import React from 'react';
import { useHelpBubbles } from '@/contexts/HelpBubbleContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface HelpBubbleProps {
  content: React.ReactNode;
  characterId?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
  forceOpen?: boolean;
}

export const HelpBubble: React.FC<HelpBubbleProps> = ({
  content,
  characterId = 'guru',
  position = 'top',
  size = 'md',
  onClose,
  forceOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(forceOpen);
  const { updateHelpPreferences } = useHelpBubbles();
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  
  // Map size to actual dimensions
  const sizeMap = {
    sm: {
      width: 60,
      height: 60,
      bubbleWidth: 200,
    },
    md: {
      width: 80, 
      height: 80,
      bubbleWidth: 280,
    },
    lg: {
      width: 100,
      height: 100,
      bubbleWidth: 350,
    },
  };
  
  const { width, height, bubbleWidth } = sizeMap[size];
  
  // Character paths for SVGs
  const characterPaths: Record<string, string> = {
    guru: '/assets/characters/guru.svg',
    cody: '/assets/characters/cody.svg',
    ada: '/assets/characters/ada.svg',
    sammy: '/assets/characters/sammy.svg',
  };
  
  // Close the help bubble
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="help-bubble-trigger outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full overflow-hidden transition-transform hover:scale-110 active:scale-95"
          style={{ width, height }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <img
            src={characterPaths[characterId] || characterPaths.guru}
            alt={`${characterId} character`}
            className="w-full h-full object-cover"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={position}
        className="help-bubble-content p-4 rounded-lg border border-primary/20 bg-card shadow-md"
        style={{ width: bubbleWidth, maxWidth: '90vw' }}
        ref={bubbleRef}
      >
        <div className="help-bubble-header flex justify-between items-start mb-2">
          <div className="help-bubble-character flex items-center gap-2">
            <img
              src={characterPaths[characterId] || characterPaths.guru}
              alt={`${characterId} character`}
              className="w-8 h-8 rounded-full"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded-full"
            onClick={handleClose}
          >
            <X size={14} />
          </Button>
        </div>
        <div className="help-bubble-body text-sm">{content}</div>
      </PopoverContent>
    </Popover>
  );
};