import React, { useState } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { HelpCircle } from 'lucide-react';

interface CharacterIllustration {
  id: string;
  name: string;
  imageUrl: string;
  role: 'mentor' | 'student' | 'admin' | 'guide';
}

// Our playful character illustrations
const characters: CharacterIllustration[] = [
  {
    id: 'cody',
    name: 'Cody the Coder',
    imageUrl: '/assets/characters/cody.svg',
    role: 'mentor'
  },
  {
    id: 'ada',
    name: 'Ada the Admin',
    imageUrl: '/assets/characters/ada.svg',
    role: 'admin'
  },
  {
    id: 'sammy',
    name: 'Sammy the Student',
    imageUrl: '/assets/characters/sammy.svg',
    role: 'student'
  },
  {
    id: 'guru',
    name: 'Guru the Guide',
    imageUrl: '/assets/characters/guru.svg',
    role: 'guide'
  }
];

export interface HelpBubbleProps {
  content: React.ReactNode;
  characterId?: string; // defaults to 'guru' if not specified
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

export function HelpBubble({
  content,
  characterId = 'guru',
  size = 'md',
  position = 'top',
  className = '',
  iconClassName = ''
}: HelpBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Find the requested character or default to Guru
  const character = characters.find(c => c.id === characterId) || characters.find(c => c.id === 'guru')!;
  
  // Determine icon size based on prop
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  
  // Determine content width based on size
  const contentWidth = size === 'sm' ? 'w-56' : size === 'md' ? 'w-72' : 'w-96';
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`text-primary hover:text-primary-focus focus:outline-none transition-colors ${iconClassName}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Help information"
        >
          <HelpCircle size={iconSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side={position} 
        className={`${contentWidth} p-4 rounded-lg border border-purple-200 bg-white dark:bg-zinc-900 shadow-md ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full overflow-hidden flex items-center justify-center border-2 border-purple-300 dark:border-purple-700">
            {/* Placeholder for character image - we'll create SVGs later */}
            <div className="font-bold text-lg text-purple-600 dark:text-purple-300">
              {character.name.charAt(0)}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-1">{character.name} says:</h4>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {content}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}