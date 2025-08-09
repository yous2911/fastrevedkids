import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Prerequisite {
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
}

interface ReadinessAnalysis {
  totalPrerequisites: number;
  requiredPrerequisites: number;
  recommendedPrerequisites: number;
  helpfulPrerequisites: number;
  studentReadiness?: {
    requiredMet: boolean;
    recommendedMet: number;
    readinessScore: number;
    blockers: Array<{
      prerequisiteCode: string;
      currentProgress: number;
      requiredProgress: number;
      gap: number;
    }>;
  };
}

interface PrerequisiteData {
  competenceCode: string;
  prerequisites: Prerequisite[];
  readinessAnalysis: ReadinessAnalysis;
}

interface PrerequisiteVisualizationProps {
  studentId: number;
  currentLevel: string;
  loading: boolean;
}

const PrerequisiteVisualization: React.FC<PrerequisiteVisualizationProps> = ({ 
  studentId, 
  currentLevel, 
  loading 
}) => {
  const [prerequisiteData, setPrerequisiteData] = useState<PrerequisiteData | null>(null);
  const [selectedCompetence, setSelectedCompetence] = useState<string>('');
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    // Load prerequisites for a sample competence based on current level
    if (studentId && currentLevel) {
      const sampleCompetence = getSampleCompetenceForLevel(currentLevel);
      if (sampleCompetence) {
        setSelectedCompetence(sampleCompetence);
        loadPrerequisites(sampleCompetence);
      }
    }
  }, [studentId, currentLevel]);

  const getSampleCompetenceForLevel = (level: string): string => {
    const competences = {
      'CP': 'CP.FR.L1.2',
      'CE1': 'CE1.MATH.N1.3', 
      'CE2': 'CE2.FR.G1.2',
      'CM1': 'CM1.MATH.G2.1',
      'CM2': 'CM2.SC.V1.1'
    };
    return competences[level as keyof typeof competences] || 'CP.FR.L1.1';
  };

  const loadPrerequisites = async (competenceCode: string) => {
    setDataLoading(true);
    try {
      const response = await fetch(
        `/api/competences/${competenceCode}/prerequisites?studentId=${studentId}&includePrerequisiteDetails=true&depth=1`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPrerequisiteData(data.data);
      }
    } catch (error) {
      console.error('Error loading prerequisites:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getPrerequisiteTypeColor = (type: string) => {
    switch (type) {
      case 'required': return 'bg-red-100 text-red-700 border-red-300';
      case 'recommended': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'helpful': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getPrerequisiteTypeIcon = (type: string) => {
    switch (type) {
      case 'required': return '🔴';
      case 'recommended': return '🟡';
      case 'helpful': return '🟢';
      default: return '⚪';
    }
  };

  const getMasteryIcon = (isMet: boolean, progressPercent: number) => {
    if (isMet) return '✅';
    if (progressPercent >= 50) return '🔶';
    if (progressPercent >= 20) return '🟦';
    return '⚫';
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading || dataLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        🔗 Prérequis
      </h3>
      
      {prerequisiteData ? (
        <div className="space-y-4">
          {/* Competence Info */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-700 mb-1">
              Compétence analysée :
            </h4>
            <p className="text-blue-600 text-sm font-mono">
              {prerequisiteData.competenceCode}
            </p>
          </div>

          {/* Readiness Score */}
          {prerequisiteData.readinessAnalysis.studentReadiness && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Score de préparation :</span>
                <span className={`font-bold text-lg ${getReadinessColor(prerequisiteData.readinessAnalysis.studentReadiness.readinessScore)}`}>
                  {prerequisiteData.readinessAnalysis.studentReadiness.readinessScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className={`h-2 rounded-full ${
                    prerequisiteData.readinessAnalysis.studentReadiness.readinessScore >= 80 
                      ? 'bg-green-500' 
                      : prerequisiteData.readinessAnalysis.studentReadiness.readinessScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${prerequisiteData.readinessAnalysis.studentReadiness.readinessScore}%` }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                />
              </div>
            </div>
          )}

          {/* Prerequisites List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-600">
              Prérequis ({prerequisiteData.prerequisites.length}) :
            </h4>
            
            {prerequisiteData.prerequisites.slice(0, 4).map((prereq, index) => (
              <motion.div
                key={prereq.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm">
                    {getPrerequisiteTypeIcon(prereq.prerequisiteType)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPrerequisiteTypeColor(prereq.prerequisiteType)}`}>
                      {prereq.prerequisiteType === 'required' ? 'Obligatoire' : 
                       prereq.prerequisiteType === 'recommended' ? 'Recommandé' :
                       'Utile'}
                    </span>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {prereq.prerequisiteCode}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {prereq.studentProgress && (
                    <>
                      <span className="text-sm">
                        {getMasteryIcon(
                          prereq.studentProgress.isMasteryThresholdMet, 
                          prereq.studentProgress.progressPercent
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {prereq.studentProgress.progressPercent}%
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}

            {prerequisiteData.prerequisites.length > 4 && (
              <div className="text-center">
                <span className="text-xs text-gray-500">
                  +{prerequisiteData.prerequisites.length - 4} autres prérequis
                </span>
              </div>
            )}
          </div>

          {/* Blockers */}
          {prerequisiteData.readinessAnalysis.studentReadiness?.blockers && 
           prerequisiteData.readinessAnalysis.studentReadiness.blockers.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                🚫 Blocages ({prerequisiteData.readinessAnalysis.studentReadiness.blockers.length}) :
              </h4>
              {prerequisiteData.readinessAnalysis.studentReadiness.blockers.slice(0, 2).map((blocker, index) => (
                <div key={index} className="text-xs text-red-600 mb-1">
                  • {blocker.prerequisiteCode}: {blocker.currentProgress}% / {blocker.requiredProgress}% requis
                </div>
              ))}
              {prerequisiteData.readinessAnalysis.studentReadiness.blockers.length > 2 && (
                <div className="text-xs text-red-500">
                  +{prerequisiteData.readinessAnalysis.studentReadiness.blockers.length - 2} autres
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-600 space-y-1">
              <div>📊 Total: {prerequisiteData.readinessAnalysis.totalPrerequisites}</div>
              <div>🔴 Obligatoires: {prerequisiteData.readinessAnalysis.requiredPrerequisites}</div>
              <div>🟡 Recommandés: {prerequisiteData.readinessAnalysis.recommendedPrerequisites}</div>
              <div>🟢 Utiles: {prerequisiteData.readinessAnalysis.helpfulPrerequisites}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🔗</div>
          <p className="text-gray-600 text-sm">Aucun prérequis à afficher</p>
        </div>
      )}
    </div>
  );
};

export default PrerequisiteVisualization;