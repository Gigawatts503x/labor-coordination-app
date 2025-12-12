// ========================================== 
// DARK MODE DETECTION & THEME MANAGEMENT
// ========================================== 

/**
 * Detects user's preferred color scheme and applies it
 * Supports: OS preference, localStorage override, manual toggle
 */
export const initializeDarkMode = () => {
  // Check localStorage for saved preference
  const savedTheme = localStorage.getItem('theme-preference');
  
  // Check OS preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Determine theme: saved > OS > default to light
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  // Apply theme to document
  applyTheme(theme);
  
  // Listen for OS theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme-preference')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
};

/**
 * Apply theme to the document
 * Sets data-color-scheme attribute for CSS variable switching
 */
export const applyTheme = (theme) => {
  const validTheme = ['light', 'dark'].includes(theme) ? theme : 'light';
  
  document.documentElement.setAttribute('data-color-scheme', validTheme);
  localStorage.setItem('theme-preference', validTheme);
  
  console.log(`🎨 Theme applied: ${validTheme}`);
};

/**
 * Toggle between light and dark mode
 */
export const toggleDarkMode = () => {
  const current = document.documentElement.getAttribute('data-color-scheme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};

/**
 * Get current theme
 */
export const getCurrentTheme = () => {
  return document.documentElement.getAttribute('data-color-scheme') || 'light';
};

/**
 * Hook for React components to detect theme changes
 * Usage: const [theme, setTheme] = useDarkMode();
 */
export const useDarkMode = () => {
  const React = require('react');
  
  const [theme, setTheme] = React.useState(() => {
    return document.documentElement.getAttribute('data-color-scheme') || 'light';
  });

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
      setTheme(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-scheme']
    });

    return () => observer.disconnect();
  }, []);

  return [theme, toggleDarkMode];
};
