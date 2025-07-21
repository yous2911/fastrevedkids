import { useState, useEffect } from 'react';
import { WahooContext, WahooIntensity } from '../types/wahoo.types';

export interface UseWahooEngineReturn {
  streak: number;
  totalCorrect: number;
  difficulty: 'easy' | 'medium' | 'hard';
  studentEnergy: number;
  lastWahooIntensity: WahooIntensity;
  sessionDuration: number;
  consecutiveErrors: number;
  averageResponseTime: number;
  engagementLevel: 'low' | 'medium' | 'high';
  mysteryWordsCompleted: number;
  intensityHistory: WahooIntensity[];
}

export const useWahooEngine = (): UseWahooEngineReturn => {
  const [wahooData, setWahooData] = useState<UseWahooEngineReturn>({
    streak: 0,
    totalCorrect: 0,
    difficulty: 'easy',
    studentEnergy: 100,
    lastWahooIntensity: 'standard',
    sessionDuration: 0,
    consecutiveErrors: 0,
    averageResponseTime: 0,
    engagementLevel: 'medium',
    mysteryWordsCompleted: 0,
    intensityHistory: []
  });

  useEffect(() => {
    // Simulation des données du Wahoo Engine
    // En production, ces données viendraient du contexte global ou de l'API
    const mockData: UseWahooEngineReturn = {
      streak: 12,
      totalCorrect: 147,
      difficulty: 'medium',
      studentEnergy: 85,
      lastWahooIntensity: 'epic',
      sessionDuration: 25,
      consecutiveErrors: 2,
      averageResponseTime: 3.5,
      engagementLevel: 'high',
      mysteryWordsCompleted: 8,
      intensityHistory: ['standard', 'epic', 'subtle', 'standard', 'epic']
    };

    setWahooData(mockData);
  }, []);

  return wahooData;
}; 