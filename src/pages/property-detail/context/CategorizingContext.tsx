import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface CategorizingContextType {
  isCategorizing: boolean;
  startCategorizing: () => void;
}

const CategorizingContext = createContext<CategorizingContextType | undefined>(undefined);

interface CategorizingProviderProps {
  children: ReactNode;
}

export const CategorizingProvider: React.FC<CategorizingProviderProps> = ({ children }) => {
  const [isCategorizing, setIsCategorizing] = useState(false);

  const startCategorizing = () => {
    setIsCategorizing(true);
  };

  // Handle the categorizing timer with proper cleanup
  useEffect(() => {
    let categorizingTimer: NodeJS.Timeout;
    
    if (isCategorizing) {
      categorizingTimer = setTimeout(() => {
        setIsCategorizing(false);
      }, 10000);
    }
    
    // Clean up the timer if the component unmounts or isCategorizing changes
    return () => {
      if (categorizingTimer) {
        clearTimeout(categorizingTimer);
      }
    };
  }, [isCategorizing]);

  return (
    <CategorizingContext.Provider value={{ isCategorizing, startCategorizing }}>
      {children}
    </CategorizingContext.Provider>
  );
};

export const useCategorizingContext = (): CategorizingContextType => {
  const context = useContext(CategorizingContext);
  if (context === undefined) {
    throw new Error('useCategorizingContext must be used within a CategorizingProvider');
  }
  return context;
};
