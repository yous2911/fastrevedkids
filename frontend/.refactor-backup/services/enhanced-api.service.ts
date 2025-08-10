import { apiService } from './api.service';

interface CompetenceProgress {
  id: number;
  competenceCode: string;
  niveau: string;
  matiere: string;
  domaine: string;
  masteryLevel: string;
  progressPercent: number;
  totalAttempts: number;
  successfulAttempts: number;
  averageScore: number;
  totalTimeSpent: number;
  averageTimePerAttempt: number;
  difficultyLevel: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
  masteredAt?: string;
  updatedAt: string;
}

interface Achievement {
  id: number;
  achievementCode: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  badgeIconUrl: string;
  currentProgress: number;
  maxProgress: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt?: string;
  displayOrder: number;
}

interface AnalyticsData {
  analytics: Array<{
    date: string;
    sessionTime: number;
    exercisesAttempted: number;
    exercisesCompleted: number;
    averageScore: number;
    xpEarned: number;
    competencesMastered: number;
    competencesProgressed: number;
    streakDays: number;
    subjectTimes: {
      francais: number;
      mathematiques: number;
      sciences: number;
      histoireGeographie: number;
      anglais: number;
    };
  }>;
  aggregatedMetrics: any;
  subjectBreakdown?: any;
  trendAnalysis?: any;
}

interface PrerequisiteData {
  competenceCode: string;
  prerequisites: Array<{
    id: number;
    competenceCode: string;
    prerequisiteCode: string;
    prerequisiteType: 'required' | 'recommended' | 'helpful';
    masteryThreshold: number;
    weight: number;
    description: string;
    studentProgress?: {
      masteryLevel: string;
      progressPercent: number;
      averageScore: number;
      isMasteryThresholdMet: boolean;
      totalTimeSpent: number;
      lastAttemptAt: string;
    };
  }>;
  readinessAnalysis: any;
}

export class EnhancedApiService {
  
  /**
   * Get student competence progress with enhanced filtering
   */
  async getStudentCompetenceProgress(
    studentId: number, 
    filters: {
      matiere?: string;
      niveau?: string;
      masteryLevel?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ competenceProgress: CompetenceProgress[]; summary: any }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/students/${studentId}/competence-progress?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching competence progress:', error);
      throw error;
    }
  }

  /**
   * Record student progress for a competence
   */
  async recordStudentProgress(
    studentId: number,
    progressData: {
      competenceCode: string;
      exerciseResult: {
        score: number;
        timeSpent: number;
        completed: boolean;
        attempts?: number;
        exerciseId?: number;
        difficultyLevel?: number;
      };
      sessionData?: {
        sessionId?: string;
        deviceType?: string;
        focusScore?: number;
      };
    }
  ): Promise<any> {
    try {
      const response = await apiService.post(`/students/${studentId}/record-progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error recording progress:', error);
      throw error;
    }
  }

  /**
   * Get student achievements
   */
  async getStudentAchievements(
    studentId: number,
    filters: {
      category?: string;
      difficulty?: string;
      completed?: boolean;
      visible?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ achievements: Achievement[]; summary: any }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/students/${studentId}/achievements?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  }

  /**
   * Get competence prerequisites with readiness analysis
   */
  async getCompetencePrerequisites(
    competenceCode: string,
    options: {
      studentId?: number;
      includePrerequisiteDetails?: boolean;
      depth?: number;
    } = {}
  ): Promise<PrerequisiteData> {
    try {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/competences/${competenceCode}/prerequisites?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
      throw error;
    }
  }

  /**
   * Get competence details
   */
  async getCompetenceDetails(competenceCode: string): Promise<any> {
    try {
      const response = await apiService.get(`/competences/${competenceCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching competence details:', error);
      throw error;
    }
  }

  /**
   * Search competences with filters
   */
  async searchCompetences(filters: {
    niveau?: string;
    matiere?: string;
    domaine?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/competences?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching competences:', error);
      throw error;
    }
  }

  /**
   * Get daily learning analytics
   */
  async getDailyLearningAnalytics(filters: {
    studentId?: number;
    dateStart?: string;
    dateEnd?: string;
    matiere?: string;
    groupBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AnalyticsData> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/analytics/daily-progress?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily analytics:', error);
      throw error;
    }
  }

  /**
   * Get learning session analytics
   */
  async getLearningSessionAnalytics(filters: {
    studentId?: number;
    dateStart?: string;
    dateEnd?: string;
    deviceType?: string;
    minDuration?: number;
    maxDuration?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/analytics/learning-sessions?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session analytics:', error);
      throw error;
    }
  }

  /**
   * Get student progress analytics (legacy endpoint compatibility)
   */
  async getStudentProgressAnalytics(studentId: number): Promise<any> {
    try {
      const response = await apiService.get(`/analytics/student/${studentId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student progress analytics:', error);
      throw error;
    }
  }

  /**
   * Get student session stats (legacy endpoint compatibility)
   */
  async getStudentSessionStats(studentId: number, days: number = 30): Promise<any> {
    try {
      const response = await apiService.get(`/analytics/student/${studentId}/sessions?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student session stats:', error);
      throw error;
    }
  }

  /**
   * Submit performance metrics
   */
  async submitPerformanceMetrics(metrics: Array<{
    metric: any;
    url: string;
    userAgent: string;
    timestamp: number;
    userId: string;
    sessionId: string;
  }>): Promise<any> {
    try {
      const response = await apiService.post('/analytics/performance', { metrics });
      return response;
    } catch (error) {
      console.error('Error submitting performance metrics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedApiService = new EnhancedApiService();