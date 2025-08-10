import { useState, useEffect, useCallback, useRef } from 'react';

interface KioskModeConfig {
  enableFullscreen?: boolean;
  preventNavigation?: boolean;
  disableContextMenu?: boolean;
  preventScreenSaver?: boolean;
  muteSystemNotifications?: boolean;
  blockF11Key?: boolean;
  hideSystemUI?: boolean;
  preventZoom?: boolean;
}

interface KioskModeState {
  isActive: boolean;
  isFullscreen: boolean;
  wakeLockActive: boolean;
  lastActivity: number;
}

interface KioskModeControls {
  activateKioskMode: () => Promise<void>;
  deactivateKioskMode: () => Promise<void>;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  isSupported: {
    fullscreen: boolean;
    wakeLock: boolean;
    keyboardLock: boolean;
  };
  updateActivity: () => void;
}

export function useKioskMode(config: KioskModeConfig = {}): KioskModeState & KioskModeControls {
  const [state, setState] = useState<KioskModeState>({
    isActive: false,
    isFullscreen: false,
    wakeLockActive: false,
    lastActivity: Date.now()
  });

  const wakeLockRef = useRef<any>(null);
  const exitCodeRef = useRef<string>('');
  const exitAttemptsRef = useRef<number>(0);
  const keySequenceRef = useRef<string[]>([]);

  // Check browser support
  const isSupported = {
    fullscreen: !!document.fullscreenEnabled,
    wakeLock: 'wakeLock' in navigator,
    keyboardLock: 'keyboard' in navigator && 'lock' in (navigator as any).keyboard
  };

  // Request wake lock
  const requestWakeLock = useCallback(async () => {
    if (!isSupported.wakeLock || !config.preventScreenSaver) return;

    try {
      if ((navigator as any).wakeLock) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setState(prev => ({ ...prev, wakeLockActive: true }));
        
        if (wakeLockRef.current) {
          wakeLockRef.current.addEventListener('release', () => {
            setState(prev => ({ ...prev, wakeLockActive: false }));
          });
        }
      }
    } catch (error) {
      console.warn('Wake Lock not supported:', error);
    }
  }, [isSupported.wakeLock, config.preventScreenSaver]);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
      } catch (error) {
        console.warn('Error releasing wake lock:', error);
      }
    }
    setState(prev => ({ ...prev, wakeLockActive: false }));
  }, []);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    if (!isSupported.fullscreen || !config.enableFullscreen) return;

    try {
      await document.documentElement.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } catch (error) {
      console.warn('Fullscreen not supported:', error);
    }
  }, [isSupported.fullscreen, config.enableFullscreen]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setState(prev => ({ ...prev, isFullscreen: false }));
      } catch (error) {
        console.warn('Error exiting fullscreen:', error);
      }
    }
  }, []);

  // Handle exit code input
  const handleExitCode = useCallback((code: string) => {
    if (code.includes(exitCodeRef.current)) {
      deactivateKioskMode();
    }
  }, []);

  // Handle key sequences
  const handleKeySequence = useCallback((e: KeyboardEvent) => {
    if (!state.isActive) return;

    // Block navigation keys
    if (config.preventNavigation) {
      const blockedKeys = ['F11', 'F5', 'F12', 'Escape'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        return;
      }
    }

    // Block F11 key
    if (config.blockF11Key && e.key === 'F11') {
      e.preventDefault();
      return;
    }

    // Block zoom shortcuts
    if (config.preventZoom) {
      if ((e.ctrlKey || e.metaKey) && ['=', '-', '0'].includes(e.key)) {
        e.preventDefault();
        return;
      }
    }

    // Exit sequence: Ctrl + Shift + X (3 times)
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
      keySequenceRef.current.push('X');
      if (keySequenceRef.current.length >= 3) {
        keySequenceRef.current = [];
        const code = prompt('Entrez le code de sortie:');
        if (code === exitCodeRef.current) {
          deactivateKioskMode();
        } else {
          exitAttemptsRef.current++;
          if (exitAttemptsRef.current >= 3) {
            alert('Trop de tentatives. Contactez un adulte.');
            exitAttemptsRef.current = 0;
          }
        }
      }
    } else {
      keySequenceRef.current = [];
    }

    // Update activity
    setState(prev => ({ ...prev, lastActivity: Date.now() }));
  }, [state.isActive, config, exitCodeRef, exitAttemptsRef]);

  // Disable context menu
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (state.isActive && config.disableContextMenu) {
      e.preventDefault();
    }
  }, [state.isActive, config.disableContextMenu]);

  // Activate kiosk mode
  const activateKioskMode = useCallback(async () => {
    setState(prev => ({ ...prev, isActive: true, lastActivity: Date.now() }));
    
    await enterFullscreen();
    await requestWakeLock();
    
    // Set exit code
    exitCodeRef.current = 'PARENT123'; // Default code
  }, [enterFullscreen, requestWakeLock]);

  // Deactivate kiosk mode
  const deactivateKioskMode = useCallback(async () => {
    setState(prev => ({ ...prev, isActive: false }));
    
    await exitFullscreen();
    await releaseWakeLock();
    
    // Reset state
    exitCodeRef.current = '';
    exitAttemptsRef.current = 0;
    keySequenceRef.current = [];
  }, [exitFullscreen, releaseWakeLock]);

  // Update activity
  const updateActivity = useCallback(() => {
    setState(prev => ({ ...prev, lastActivity: Date.now() }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (state.isActive) {
      document.addEventListener('keydown', handleKeySequence);
      document.addEventListener('contextmenu', handleContextMenu);
      
      // Monitor for exit code input
      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target && target.value) {
          handleExitCode(target.value);
        }
      };
      
      document.addEventListener('input', handleInput);
      
      return () => {
        document.removeEventListener('keydown', handleKeySequence);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('input', handleInput);
      };
    }
  }, [state.isActive, handleKeySequence, handleContextMenu, handleExitCode]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState(prev => ({ 
        ...prev, 
        isFullscreen: !!document.fullscreenElement 
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    ...state,
    activateKioskMode,
    deactivateKioskMode,
    enterFullscreen,
    exitFullscreen,
    isSupported,
    updateActivity
  };
} 