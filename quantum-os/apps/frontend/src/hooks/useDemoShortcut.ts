import { useEffect } from 'react';
import { useDemoStore } from '@/store/demo-store';

export function useDemoShortcut() {
  const toggleDemoMode = useDemoStore((state) => state.toggleDemoMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for CTRL + SHIFT + D
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleDemoMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDemoMode]);
}
