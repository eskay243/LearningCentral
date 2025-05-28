import React from 'react';
import { HelpBubble } from './HelpBubble';
import { useHelpBubbles } from '@/contexts/HelpBubbleContext';

export interface ContextualHelpProps {
  id: string;
  title?: string;
  content: React.ReactNode;
  characterId?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  triggerOnFirstVisit?: boolean;
  showInHelpMode?: boolean;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  id,
  title,
  content,
  characterId = 'guru',
  position = 'top',
  size = 'md',
  className = '',
  triggerOnFirstVisit = false,
  showInHelpMode = true,
}) => {
  const { isHelpVisible, helpPreferences } = useHelpBubbles();
  
  // Format content to include title if provided
  const formattedContent = (
    <>
      {title && <h5 className="font-bold mb-1">{title}</h5>}
      <div>{content}</div>
    </>
  );
  
  // Check if this help bubble should be shown
  const shouldShowHelp = () => {
    // First, check if it's visible through the context
    if (isHelpVisible(id)) return true;
    
    // Next, check if it should be shown on first visit
    if (triggerOnFirstVisit && helpPreferences.showOnFirstVisit) {
      // If the user hasn't dismissed this help bubble
      return !helpPreferences.dismissedHelp.includes(id);
    }
    
    return false;
  };
  
  // If the help shouldn't be displayed, don't render anything
  if (!shouldShowHelp()) {
    return null;
  }
  
  // Use character preference from context if no specific character is specified
  const displayCharacterId = characterId || helpPreferences.characterPreference;
  
  return (
    <div className={`contextual-help fixed bottom-4 right-4 z-50 ${className}`}>
      <HelpBubble
        content={formattedContent}
        characterId={displayCharacterId}
        position="left"
        size={size}
      />
    </div>
  );
};

// Helper component for wrapping other components with contextual help
export const WithContextualHelp: React.FC<ContextualHelpProps & { children: React.ReactNode }> = ({
  children,
  ...helpProps
}) => {
  return (
    <div className="relative">
      {children}
      <div className="absolute top-0 right-0 -mt-2 -mr-2 z-10">
        <ContextualHelp {...helpProps} />
      </div>
    </div>
  );
};