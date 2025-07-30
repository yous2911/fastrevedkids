import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Exercise {
  id: number;
  titre: string;
  description: string;
  type: string;
  configuration: string | {
    question: string;
    choix?: string[];
    bonneReponse?: string | number;
    operation?: string;
    resultat?: number;
    correctAnswer?: string;
    options?: string[];
    explanation?: string;
  };
  xp: number;
  difficulte: 'FACILE' | 'MOYEN' | 'DIFFICILE';
  createdAt: string;
  updatedAt: string;
}

interface ExercisesPageProps {
  onBack: () => void;
  onStartExercise: (exercise: Exercise) => void;
}

export const ExercisesPage: React.FC<ExercisesPageProps> = ({ onBack, onStartExercise }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const subjects = [
    { id: 'all', name: 'Toutes les matières', emoji: '📚' },
    { id: 'MATHEMATIQUES', name: 'Mathématiques', emoji: '🔢' },
    { id: 'FRANCAIS', name: 'Français', emoji: '📝' },
    { id: 'SCIENCES', name: 'Sciences', emoji: '🔬' },
    { id: 'HISTOIRE_GEOGRAPHIE', name: 'Histoire-Géo', emoji: '🌍' },
    { id: 'ANGLAIS', name: 'Anglais', emoji: '🇬🇧' }
  ];

  const difficulties = [
    { id: 'all', name: 'Tous niveaux', color: 'bg-gray-100 text-gray-800' },
    { id: 'FACILE', name: 'Facile', color: 'bg-green-100 text-green-800' },
    { id: 'MOYEN', name: 'Moyen', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'DIFFICILE', name: 'Difficile', color: 'bg-red-100 text-red-800' }
  ];

  const exerciseTypes = {
    QCM: { name: 'Choix multiples', emoji: '☑️', color: 'bg-blue-100 text-blue-800' },
    CALCUL: { name: 'Calcul', emoji: '🧮', color: 'bg-purple-100 text-purple-800' },
    TEXTE_LIBRE: { name: 'Texte libre', emoji: '✏️', color: 'bg-green-100 text-green-800' },
    DRAG_DROP: { name: 'Glisser-déposer', emoji: '🎯', color: 'bg-orange-100 text-orange-800' },
    CONJUGAISON: { name: 'Conjugaison', emoji: '📖', color: 'bg-pink-100 text-pink-800' },
    GEOMETRIE: { name: 'Géométrie', emoji: '📐', color: 'bg-indigo-100 text-indigo-800' },
    LECTURE: { name: 'Lecture', emoji: '📚', color: 'bg-yellow-100 text-yellow-800' },
    'fill-in-blank': { name: 'Conjugaison', emoji: '📖', color: 'bg-pink-100 text-pink-800' },
    'multiple-choice': { name: 'Choix multiple', emoji: '📋', color: 'bg-teal-100 text-teal-800' }
  };

  useEffect(() => {
    loadExercises();
  }, [selectedSubject, selectedDifficulty]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      let url = 'http://localhost:3003/api/subjects/exercises';
      
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('matiere', selectedSubject);
      if (selectedDifficulty !== 'all') params.append('difficulte', selectedDifficulty);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Exercises loaded successfully:', data);
        if (data.success) {
          setExercises(data.data || []);
        }
      } else if (response.status === 401) {
        // Handle unauthorized
        localStorage.removeItem('auth_token');
        window.location.reload();
      } else {
        console.error('Failed to load exercises:', response.status, response.statusText);
        setError(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError('Erreur lors du chargement des exercices');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      try {
        const config = typeof exercise.configuration === 'string' 
          ? JSON.parse(exercise.configuration) 
          : exercise.configuration;
        return (
          exercise.titre.toLowerCase().includes(query) ||
          exercise.description.toLowerCase().includes(query) ||
          (config.question && config.question.toLowerCase().includes(query))
        );
      } catch (e) {
        return exercise.titre.toLowerCase().includes(query) ||
               exercise.description.toLowerCase().includes(query);
      }
    }
    return true;
  });

  const getDifficultyColor = (difficulte: string) => {
    const difficulty = difficulties.find(d => d.id === difficulte);
    return difficulty?.color || 'bg-gray-100 text-gray-800';
  };

  const getExerciseTypeInfo = (type: string) => {
    return exerciseTypes[type as keyof typeof exerciseTypes] || { 
      name: type, 
      emoji: '📝', 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Exercices</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtres</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mot-clé, sujet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matière
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.emoji} {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulté
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={loadExercises}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher
            </button>
            
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedDifficulty('all');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">
              📚 Exercices disponibles
            </h2>
            <span className="text-sm text-gray-600">
              {filteredExercises.length} exercice{filteredExercises.length > 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des exercices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">😕</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadExercises}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-600">Aucun exercice trouvé avec ces critères</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExercises.map((exercise, index) => {
                const typeInfo = getExerciseTypeInfo(exercise.type);
                
                return (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-md"
                    onClick={() => onStartExercise(exercise)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.emoji} {typeInfo.name}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulte)}`}>
                            {exercise.difficulte}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {exercise.xp} XP
                          </span>
                        </div>

                        <h3 className="font-medium text-gray-800 mb-2 text-lg">
                          {exercise.titre}
                        </h3>

                        <p className="text-gray-600 mb-2">
                          {exercise.description}
                        </p>

                        {(() => {
                          try {
                            const config = typeof exercise.configuration === 'string' 
                              ? JSON.parse(exercise.configuration) 
                              : exercise.configuration;
                            return config.question ? (
                              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <strong>Question:</strong> {config.question}
                              </div>
                            ) : null;
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartExercise(exercise);
                          }}
                        >
                          Commencer →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExercisesPage; 