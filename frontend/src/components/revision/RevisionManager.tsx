import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';
import { revisionService } from '../../services/revision.service';

interface RevisionExercise {
  revisionId: number;
  exercice: {
    id: number;
    titre: string;
    type: string;
    difficulte: number;
    pointsReussite: number;
    matiere: string;
    niveau: string;
  };
  questionId?: string;
  nombreEchecs: number;
  niveauDifficulte: number;
  datePrevue: string;
  priorite: number;
}

interface RevisionStats {
  revisionsEnAttente: number;
  revisionsEffectuees: number;
  revisionsAnnulees: number;
  exercicesAReviserAujourdhui: number;
  totalRevisions: number;
}

interface RevisionManagerProps {
  eleveId: number;
  onExerciseStart?: (exerciseId: number, questionId?: string) => void;
  onExerciseComplete?: (exerciseId: number, success: boolean) => void;
}

export const RevisionManager: React.FC<RevisionManagerProps> = ({
  eleveId,
  onExerciseStart,
  onExerciseComplete
}) => {
  const [exercises, setExercises] = useState<RevisionExercise[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<RevisionExercise | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadRevisions();
  }, [eleveId]);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      setError(null);

      const [exercisesData, statsData] = await Promise.all([
        revisionService.getExercisesToRevise(eleveId),
        revisionService.getRevisionStats(eleveId)
      ]);

      setExercises(exercisesData.data.exercices || []);
      setStats(statsData.data);
    } catch (err) {
      console.error('Erreur lors du chargement des révisions:', err);
      setError('Impossible de charger les révisions');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseStart = (exercise: RevisionExercise) => {
    setSelectedExercise(exercise);
    onExerciseStart?.(exercise.exercice.id, exercise.questionId);
  };

  const handleExerciseComplete = async (success: boolean, tempsReponse?: number) => {
    if (!selectedExercise) return;

    try {
      if (success) {
        await revisionService.recordSuccess(eleveId, {
          exerciceId: selectedExercise.exercice.id,
          questionId: selectedExercise.questionId,
          tempsReponse: tempsReponse
        });
        setToastMessage('Exercice réussi ! Révision mise à jour.');
        setToastType('success');
      } else {
        await revisionService.recordFailure(eleveId, {
          exerciceId: selectedExercise.exercice.id,
          questionId: selectedExercise.questionId,
          tempsReponse: tempsReponse
        });
        setToastMessage('Échec enregistré. Révision reprogrammée.');
        setToastType('error');
      }

      setShowToast(true);
      onExerciseComplete?.(selectedExercise.exercice.id, success);
      
      // Recharger les données
      await loadRevisions();
      setSelectedExercise(null);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setToastMessage('Erreur lors de l\'enregistrement');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handlePostponeRevision = async (revisionId: number, newDate: string) => {
    try {
      await revisionService.postponeRevision(revisionId, newDate, 'Reporté par l\'élève');
      setToastMessage('Révision reportée avec succès');
      setToastType('success');
      setShowToast(true);
      await loadRevisions();
    } catch (err) {
      console.error('Erreur lors du report:', err);
      setToastMessage('Erreur lors du report de la révision');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCancelRevision = async (revisionId: number) => {
    try {
      await revisionService.cancelRevision(revisionId, 'Annulé par l\'élève');
      setToastMessage('Révision annulée');
      setToastType('success');
      setShowToast(true);
      await loadRevisions();
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      setToastMessage('Erreur lors de l\'annulation');
      setToastType('error');
      setShowToast(true);
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 50) return 'text-red-600 bg-red-100';
    if (priority >= 30) return 'text-orange-600 bg-orange-100';
    if (priority >= 15) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getDifficultyStars = (difficulty: number): string => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `En retard (${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''})`;
    } else if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Demain';
    } else {
      return `Dans ${diffDays} jours`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadRevisions} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Statistiques de révision</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.exercicesAReviserAujourdhui}</div>
              <div className="text-sm text-gray-600">À réviser aujourd'hui</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.revisionsEffectuees}</div>
              <div className="text-sm text-gray-600">Révisions effectuées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.revisionsEnAttente}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.totalRevisions}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </Card>
      )}

      {/* Liste des exercices */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Exercices à réviser</h2>
          <Button onClick={loadRevisions} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-lg font-medium">Aucun exercice à réviser !</div>
            <div className="text-sm">Continuez vos progrès avec de nouveaux exercices.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.revisionId}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{exercise.exercice.titre}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="capitalize">{exercise.exercice.matiere}</span>
                      <span>Niveau {exercise.exercice.niveau}</span>
                      <span>{exercise.exercice.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(exercise.priorite)}`}>
                      Priorité {exercise.priorite}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getDifficultyStars(exercise.niveauDifficulte)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <div>Échecs précédents: {exercise.nombreEchecs}</div>
                    <div>Date prévue: {formatDate(exercise.datePrevue)}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExerciseStart(exercise)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Commencer
                    </Button>
                    <Button
                      onClick={() => handlePostponeRevision(exercise.revisionId, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}
                      variant="outline"
                      size="sm"
                    >
                      Reporter
                    </Button>
                    <Button
                      onClick={() => handleCancelRevision(exercise.revisionId)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Toast de notification */}
      {showToast && (
        <Toast
          id="revision-toast"
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          duration={3000}
        />
      )}
    </div>
  );
}; 