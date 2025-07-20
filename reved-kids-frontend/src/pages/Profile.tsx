import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useStudentData } from '../hooks/useStudentData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Eleve } from '../types/api.types';

interface ProfileProps {
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const { state, setCurrentStudent } = useApp();
  const { currentStudent } = state;
  const { updateProfile } = useStudentData(currentStudent?.id || 0);
  const { success, error } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prenom: currentStudent?.prenom || '',
    nom: currentStudent?.nom || '',
    mascotteType: currentStudent?.mascotteType || 'dragon'
  });

  const mascots = [
    { type: 'dragon', emoji: '🐉', name: 'Dragon Sage', description: 'Puissant et protecteur' },
    { type: 'fairy', emoji: '🧚‍♀️', name: 'Fée Magique', description: 'Créative et inspirante' },
    { type: 'robot', emoji: '🤖', name: 'Robot Intelligent', description: 'Logique et précis' },
    { type: 'cat', emoji: '🐱', name: 'Chat Curieux', description: 'Agile et observateur' },
    { type: 'owl', emoji: '🦉', name: 'Hibou Sage', description: 'Savant et patient' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      
      // Update current student in app state
      if (currentStudent) {
        const updatedStudent = { ...currentStudent, ...formData };
        setCurrentStudent(updatedStudent);
      }

      success('Profil mis à jour avec succès !');
      setIsEditing(false);
    } catch (err: any) {
      error(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const getAchievementLevel = (points: number) => {
    if (points >= 500) return { level: 'Expert', icon: '🏆', color: 'text-yellow-600' };
    if (points >= 200) return { level: 'Avancé', icon: '🥉', color: 'text-orange-600' };
    if (points >= 50) return { level: 'Intermédiaire', icon: '⭐', color: 'text-blue-600' };
    return { level: 'Débutant', icon: '🌟', color: 'text-green-600' };
  };

  const selectedMascot = mascots.find(m => m.type === formData.mascotteType) || mascots[0];
  const achievement = currentStudent ? getAchievementLevel(currentStudent.totalPoints) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card variant="elevated" padding="md">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                icon={<span className="text-xl">←</span>}
              />
              <h1 className="text-2xl font-bold text-gray-800">Mon Profil</h1>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card variant="magical" padding="lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Informations personnelles
                </h2>
                {!isEditing ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    icon={<span>✏️</span>}
                  >
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          prenom: currentStudent?.prenom || '',
                          nom: currentStudent?.nom || '',
                          mascotteType: currentStudent?.mascotteType || 'dragon'
                        });
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      icon={<span>💾</span>}
                    >
                      Sauvegarder
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                        {currentStudent?.prenom}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                        {currentStudent?.nom}
                      </div>
                    )}
                  </div>
                </div>

                {/* Read-only info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau scolaire
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                      {currentStudent?.niveauActuel}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membre depuis
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                      {currentStudent ? new Date(currentStudent.createdAt).toLocaleDateString('fr-FR') : ''}
                    </div>
                  </div>
                </div>

                {/* Mascot Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Ton compagnon d'apprentissage
                  </label>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mascots.map((mascot) => (
                        <button
                          key={mascot.type}
                          onClick={() => handleInputChange('mascotteType', mascot.type)}
                          className={`
                            p-4 rounded-xl border-2 transition-all text-center
                            ${formData.mascotteType === mascot.type
                              ? 'border-blue-500 bg-blue-50 scale-105'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="text-3xl mb-2">{mascot.emoji}</div>
                          <div className="font-medium text-sm text-gray-800">
                            {mascot.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {mascot.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="text-4xl">{selectedMascot.emoji}</div>
                      <div>
                        <div className="font-bold text-purple-800">
                          {selectedMascot.name}
                        </div>
                        <div className="text-sm text-purple-600">
                          {selectedMascot.description}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats & Achievements */}
          <div className="space-y-6">
            
            {/* Achievement Level */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="elevated" padding="lg" className="text-center">
                <div className="text-4xl mb-3">
                  {achievement?.icon}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${achievement?.color}`}>
                  {achievement?.level}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Ton niveau d'apprentissage
                </p>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-800">
                    {currentStudent?.totalPoints || 0}
                  </div>
                  <div className="text-xs text-gray-600">points au total</div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="outlined" padding="md">
                <h3 className="font-bold text-gray-800 mb-4 text-center">
                  📊 Tes statistiques
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Série actuelle</span>
                    <span className="font-bold text-orange-600">
                      {currentStudent?.serieJours || 0} jours
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Exercices réussis</span>
                    <span className="font-bold text-green-600">
                      {/* This would come from student stats */}
                      42
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux de réussite</span>
                    <span className="font-bold text-blue-600">
                      {/* This would come from student stats */}
                      85%
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="outlined" padding="md">
                <h3 className="font-bold text-gray-800 mb-4 text-center">
                  ⚙️ Préférences
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sons</span>
                    <button className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${state.soundEnabled ? 'bg-green-500' : 'bg-gray-300'}
                    `}>
                      <div className={`
                        w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                        ${state.soundEnabled ? 'translate-x-7' : 'translate-x-1'}
                      `} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Animations</span>
                    <button className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${state.animationsEnabled ? 'bg-green-500' : 'bg-gray-300'}
                    `}>
                      <div className={`
                        w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                        ${state.animationsEnabled ? 'translate-x-7' : 'translate-x-1'}
                      `} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}; 