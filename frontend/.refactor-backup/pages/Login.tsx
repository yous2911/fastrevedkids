import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, error: authError, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    prenom: '',
    nom: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [error, setError] = useState('');

  // Load existing students on mount
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/students');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStudents(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogin = async () => {
    if (!formData.prenom.trim() || !formData.nom.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(formData.prenom.trim(), formData.nom.trim());
      if (success) {
        onLoginSuccess();
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
    } catch (err: any) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentSelect = async (student: any) => {
    setIsSubmitting(true);
    try {
      const success = await login(student.prenom, student.nom);
      if (success) {
        onLoginSuccess();
      } else {
        setError('Erreur de connexion');
      }
    } catch (err: any) {
      setError('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mascots = [
    { emoji: '🐉', name: 'dragon' },
    { emoji: '🧚‍♀️', name: 'fairy' },
    { emoji: '🤖', name: 'robot' },
    { emoji: '🐱', name: 'cat' },
    { emoji: '🦉', name: 'owl' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            👑 RevEd Kids
          </h1>
          <p className="text-blue-200">
            Connecte-toi pour commencer ton aventure !
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
            {!showStudentSelect ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">✨</div>
                  <h2 className="text-xl font-bold text-white">
                    Connexion Magique
                  </h2>
                </div>

                {(error || authError) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm text-center"
                  >
                    {error || authError}
                  </motion.div>
                )}

                {/* Prénom Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Ton prénom"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Nom Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Nom de famille
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Ton nom de famille"
                    disabled={isSubmitting}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleLogin}
                  disabled={isSubmitting || authLoading || !formData.prenom.trim() || !formData.nom.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {(isSubmitting || authLoading) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connexion...
                    </>
                  ) : (
                    'Se connecter ✨'
                  )}
                </button>

                {/* Student Selection Toggle */}
                {students.length > 0 && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowStudentSelect(true)}
                      className="text-blue-200 hover:text-white text-sm underline transition-colors"
                    >
                      Ou choisis ton profil ({students.length} élèves)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">
                    Choisis ton profil
                  </h2>
                  <button
                    onClick={() => setShowStudentSelect(false)}
                    className="text-blue-200 hover:text-white text-sm underline"
                  >
                    ← Revenir à la connexion
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => handleStudentSelect(student)}
                        disabled={isSubmitting || authLoading}
                        className="w-full p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-left group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {mascots.find(m => m.name === student.mascotteType)?.emoji || '👤'}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {student.prenom} {student.nom}
                            </div>
                            <div className="text-blue-200 text-sm">
                              Niveau {student.niveauActuel} • {student.totalPoints} points
                            </div>
                          </div>
                          <div className="ml-auto text-white/50 group-hover:text-white transition-colors">
                            →
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-blue-200 text-sm">
            🎓 Apprendre • 🎮 Jouer • 🏆 Réussir
          </p>
        </motion.div>
      </div>
    </div>
  );
}; 