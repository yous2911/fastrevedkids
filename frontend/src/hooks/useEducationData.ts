import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';

export interface EducationData {
  subjects: Array<{
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string;
  }>;
  levels: Array<{
    id: number;
    name: string;
    grade: string;
    description: string;
  }>;
  topics: Array<{
    id: number;
    name: string;
    subjectId: number;
    levelId: number;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;
}

export const useEducationData = () => {
  const [data, setData] = useState<EducationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [subjectsResponse, levelsResponse, topicsResponse] = await Promise.all([
        apiService.get('/api/subjects'),
        apiService.get('/api/levels'),
        apiService.get('/api/topics')
      ]);

      setData({
        subjects: subjectsResponse.data || [],
        levels: levelsResponse.data || [],
        topics: topicsResponse.data || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load education data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSubjects = useCallback(() => {
    return data?.subjects || [];
  }, [data]);

  const getLevels = useCallback(() => {
    return data?.levels || [];
  }, [data]);

  const getTopics = useCallback((subjectId?: number, levelId?: number) => {
    if (!data?.topics) return [];
    
    return data.topics.filter(topic => {
      if (subjectId && topic.subjectId !== subjectId) return false;
      if (levelId && topic.levelId !== levelId) return false;
      return true;
    });
  }, [data]);

  const getSubjectById = useCallback((id: number) => {
    return data?.subjects.find(subject => subject.id === id);
  }, [data]);

  const getLevelById = useCallback((id: number) => {
    return data?.levels.find(level => level.id === id);
  }, [data]);

  const getTopicById = useCallback((id: number) => {
    return data?.topics.find(topic => topic.id === id);
  }, [data]);

  return {
    data,
    loading,
    error,
    loadData,
    getSubjects,
    getLevels,
    getTopics,
    getSubjectById,
    getLevelById,
    getTopicById
  };
}; 