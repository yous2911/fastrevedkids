import { useCallback, useRef } from 'react';

type SoundType = 'click' | 'success' | 'error' | 'reward' | 'sparkle' | 'levelup' | 'correct' | 'incorrect';

interface SoundConfig {
  volume?: number;
  playbackRate?: number;
}

export const useSound = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const sounds = useRef<Map<string, AudioBuffer>>(new Map());

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const createTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    initAudio();
    if (!audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);

    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  }, [initAudio]);

  const playSound = useCallback((type: SoundType, config: SoundConfig = {}) => {
    const { volume = 0.3, playbackRate = 1 } = config;

    switch (type) {
      case 'click':
        createTone(800, 0.1, 'square');
        break;
      case 'success':
        createTone(523.25, 0.2, 'sine'); // C5
        setTimeout(() => createTone(659.25, 0.2, 'sine'), 100); // E5
        setTimeout(() => createTone(783.99, 0.3, 'sine'), 200); // G5
        break;
      case 'error':
        createTone(200, 0.3, 'sawtooth');
        break;
      case 'reward':
        createTone(440, 0.1, 'sine'); // A4
        setTimeout(() => createTone(554.37, 0.1, 'sine'), 50); // C#5
        setTimeout(() => createTone(659.25, 0.2, 'sine'), 100); // E5
        break;
      case 'sparkle':
        createTone(1000, 0.05, 'sine');
        setTimeout(() => createTone(1200, 0.05, 'sine'), 50);
        setTimeout(() => createTone(1400, 0.05, 'sine'), 100);
        break;
      case 'levelup':
        createTone(523.25, 0.2, 'sine'); // C5
        setTimeout(() => createTone(659.25, 0.2, 'sine'), 150); // E5
        setTimeout(() => createTone(783.99, 0.2, 'sine'), 300); // G5
        setTimeout(() => createTone(1046.50, 0.4, 'sine'), 450); // C6
        break;
      case 'correct':
        createTone(523.25, 0.15, 'sine'); // C5
        setTimeout(() => createTone(659.25, 0.15, 'sine'), 100); // E5
        break;
      case 'incorrect':
        createTone(200, 0.2, 'sawtooth');
        setTimeout(() => createTone(150, 0.2, 'sawtooth'), 100);
        break;
    }
  }, [createTone]);

  const playMelody = useCallback((notes: number[], durations: number[]) => {
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        createTone(frequency, durations[index] || 0.2);
      }, index * 150);
    });
  }, [createTone]);

  return {
    playSound,
    playMelody,
    initAudio
  };
}; 