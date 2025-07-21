import { useState, useEffect } from 'react';

export interface UseStudentDataReturn {
  id: string;
  name: string;
  age: number;
  grade: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export const useStudentData = (): UseStudentDataReturn => {
  const [studentData, setStudentData] = useState<UseStudentDataReturn>({
    id: '',
    name: '',
    age: 0,
    grade: '',
    level: 'beginner'
  });

  useEffect(() => {
    // Simulation des données de l'étudiant
    // En production, ces données viendraient du contexte d'authentification ou de l'API
    const mockData: UseStudentDataReturn = {
      id: 'student_001',
      name: 'Emma Martin',
      age: 9,
      grade: 'CE1',
      level: 'intermediate'
    };

    setStudentData(mockData);
  }, []);

  return studentData;
}; 