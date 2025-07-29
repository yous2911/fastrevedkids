import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AdminPanelProps {
  onBack: () => void;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalExercises: number;
  completedExercises: number;
}

interface Student {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  niveauActuel: string;
  totalPoints: number;
  serieJours: number;
  dateInscription: string;
  derniereConnexion: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'exercises' | 'settings'>('overview');
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalExercises: 0,
    completedExercises: 0
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Load stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Load students
      const studentsResponse = await fetch('/api/admin/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          setStudents(studentsData.data || []);
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des données administrateur');
      console.error('Admin data loading error:', err);
      
      // Mock data for development
      setStats({
        totalUsers: 150,
        activeUsers: 89,
        totalExercises: 1250,
        completedExercises: 890
      });
      
      setStudents([
        {
          id: 1,
          prenom: 'Alice',
          nom: 'Martin',
          email: 'alice.martin@example.com',
          niveauActuel: 'CP',
          totalPoints: 1250,
          serieJours: 7,
          dateInscription: '2024-01-15',
          derniereConnexion: '2024-01-20'
        },
        {
          id: 2,
          prenom: 'Thomas',
          nom: 'Dubois',
          email: 'thomas.dubois@example.com',
          niveauActuel: 'CE1',
          totalPoints: 890,
          serieJours: 3,
          dateInscription: '2024-01-10',
          derniereConnexion: '2024-01-19'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', emoji: '📊' },
    { id: 'users', name: 'Utilisateurs', emoji: '👥' },
    { id: 'exercises', name: 'Exercices', emoji: '📚' },
    { id: 'settings', name: 'Paramètres', emoji: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
            <h1 className="text-2xl font-bold text-gray-900">Panel Administrateur</h1>
            <div className="ml-4 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              ADMIN
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.emoji}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : (
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <div className="text-blue-100">Utilisateurs totaux</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="text-3xl mb-2">🟢</div>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <div className="text-green-100">Utilisateurs actifs</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="text-3xl mb-2">📚</div>
                    <div className="text-2xl font-bold">{stats.totalExercises}</div>
                    <div className="text-purple-100">Exercices totaux</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-2xl font-bold">{stats.completedExercises}</div>
                    <div className="text-orange-100">Exercices terminés</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">🚀 Actions rapides</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl transition-colors">
                      <div className="text-2xl mb-2">👤</div>
                      <div className="font-medium">Ajouter un utilisateur</div>
                    </button>
                    
                    <button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl transition-colors">
                      <div className="text-2xl mb-2">📝</div>
                      <div className="font-medium">Créer un exercice</div>
                    </button>
                    
                    <button className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-xl transition-colors">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="font-medium">Voir les rapports</div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">👥 Gestion des utilisateurs</h3>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Ajouter un utilisateur
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Nom</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Niveau</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Points</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Série</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Dernière connexion</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {student.prenom} {student.nom}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{student.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {student.niveauActuel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">{student.totalPoints}</td>
                          <td className="py-3 px-4 text-gray-600">{student.serieJours} jours</td>
                          <td className="py-3 px-4 text-gray-600">{formatDate(student.derniereConnexion)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                Modifier
                              </button>
                              <button className="text-red-600 hover:text-red-800 text-sm">
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Exercises Tab */}
            {activeTab === 'exercises' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">📚 Gestion des exercices</h3>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Créer un exercice
                  </button>
                </div>

                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🚧</div>
                  <p className="text-gray-600">Gestion des exercices en cours de développement</p>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-6">⚙️ Paramètres système</h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Paramètres généraux</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" />
                        <span className="text-gray-700">Autoriser les nouvelles inscriptions</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-gray-700">Activer les notifications par email</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-gray-700">Mode maintenance</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Sécurité</h4>
                    <div className="space-y-3">
                      <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                        Réinitialiser les sessions
                      </button>
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors">
                        Sauvegarder la base de données
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;