import React, { useEffect } from 'react';
import { ThemeType } from '../types';

interface BackgroundProps {
  theme: ThemeType;
}

export const Background: React.FC<BackgroundProps> = ({ theme }) => {
  useEffect(() => {
    // Remove all previous theme classes
    const themeClasses = [
      'theme-dark',
      'theme-light',
      'theme-royal-blue',
      'theme-emerald-green',
      'theme-crimson-red',
      'theme-violet-purple'
    ];
    document.body.classList.remove(...themeClasses);
    
    // Add current theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // The background color is handled by CSS variables on document.body
  return null;
};
