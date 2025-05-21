import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context shape
interface HelpContextData {
  // Show/hide specific help bubbles
  showHelp: (id: string) => void;
  hideHelp: (id: string) => void;
  isHelpVisible: (id: string) => boolean;
  
  // Toggle help mode (when enabled, all eligible help bubbles appear)
  toggleHelpMode: () => void;
  isHelpModeEnabled: boolean;
  
  // User's help preferences
  helpPreferences: {
    showOnFirstVisit: boolean;
    characterPreference: string;
    dismissedHelp: string[];
  };
  updateHelpPreferences: (prefs: Partial<HelpContextData['helpPreferences']>) => void;
}

// Create the context with default values
const HelpBubbleContext = createContext<HelpContextData>({
  showHelp: () => {},
  hideHelp: () => {},
  isHelpVisible: () => false,
  toggleHelpMode: () => {},
  isHelpModeEnabled: false,
  helpPreferences: {
    showOnFirstVisit: true,
    characterPreference: 'guru',
    dismissedHelp: [],
  },
  updateHelpPreferences: () => {},
});

// Provider component
export const HelpBubbleProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Track which help bubbles are visible
  const [visibleHelpBubbles, setVisibleHelpBubbles] = useState<string[]>([]);
  
  // Track if help mode is enabled (showing all eligible help)
  const [isHelpModeEnabled, setIsHelpModeEnabled] = useState(false);
  
  // User preferences for help
  const [helpPreferences, setHelpPreferences] = useState({
    showOnFirstVisit: true,
    characterPreference: 'guru', // Default to Guru character
    dismissedHelp: [] as string[], // IDs of help items user has dismissed
  });
  
  // Show a specific help bubble
  const showHelp = (id: string) => {
    setVisibleHelpBubbles(prev => 
      prev.includes(id) ? prev : [...prev, id]
    );
  };
  
  // Hide a specific help bubble
  const hideHelp = (id: string) => {
    setVisibleHelpBubbles(prev => 
      prev.filter(bubbleId => bubbleId !== id)
    );
  };
  
  // Check if a specific help bubble is visible
  const isHelpVisible = (id: string) => {
    // If in help mode, show unless dismissed
    if (isHelpModeEnabled && !helpPreferences.dismissedHelp.includes(id)) {
      return true;
    }
    // Otherwise check if it's in the visible array
    return visibleHelpBubbles.includes(id);
  };
  
  // Toggle help mode
  const toggleHelpMode = () => {
    setIsHelpModeEnabled(prev => !prev);
  };
  
  // Update help preferences
  const updateHelpPreferences = (prefs: Partial<HelpContextData['helpPreferences']>) => {
    setHelpPreferences(prev => ({
      ...prev,
      ...prefs,
    }));
    
    // Persist to localStorage
    try {
      const updatedPrefs = { ...helpPreferences, ...prefs };
      localStorage.setItem('helpPreferences', JSON.stringify(updatedPrefs));
    } catch (error) {
      console.error('Error saving help preferences:', error);
    }
  };
  
  // Load preferences from localStorage on component mount
  React.useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem('helpPreferences');
      if (savedPrefs) {
        setHelpPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error('Error loading help preferences:', error);
    }
  }, []);
  
  return (
    <HelpBubbleContext.Provider
      value={{
        showHelp,
        hideHelp,
        isHelpVisible,
        toggleHelpMode,
        isHelpModeEnabled,
        helpPreferences,
        updateHelpPreferences,
      }}
    >
      {children}
    </HelpBubbleContext.Provider>
  );
};

// Custom hook to use the help context
export const useHelpBubbles = () => {
  const context = useContext(HelpBubbleContext);
  if (!context) {
    throw new Error('useHelpBubbles must be used within a HelpBubbleProvider');
  }
  return context;
};