import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Settings,
  Send,
  XCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ProgressBar } from '../ui/ProgressBar';

interface GDPRRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection' | 'withdraw_consent';
  status: 'pending' | 'under_review' | 'verification_required' | 'approved' | 'rejected' | 'completed' | 'expired';
  submittedAt: Date;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  timeRemaining: string;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  purposes: string[];
  retentionPeriod: string;
  lastUpdated: Date;
  canEdit: boolean;
  canDelete: boolean;
}

interface ConsentStatus {
  category: string;
  granted: boolean;
  grantedAt?: Date;
  canWithdraw: boolean;
  description: string;
}

interface GDPRDashboardProps {
  studentId?: string;
  parentEmail: string;
  isParent?: boolean;
}

const requestTypeLabels: Record<string, string> = {
  access: 'Accès aux données',
  rectification: 'Rectification',
  erasure: 'Effacement',
  restriction: 'Limitation',
  portability: 'Portabilité',
  objection: 'Opposition',
  withdraw_consent: 'Retrait du consentement'
};

const requestTypeDescriptions: Record<string, string> = {
  access: 'Obtenir une copie de toutes les données personnelles que nous détenons',
  rectification: 'Corriger des informations incorrectes ou incomplètes',
  erasure: 'Supprimer définitivement les données personnelles (droit à l\'oubli)',
  restriction: 'Limiter l\'utilisation des données dans certains cas',
  portability: 'Recevoir les données dans un format structuré et réutilisable',
  objection: 'S\'opposer au traitement des données pour des raisons particulières',
  withdraw_consent: 'Retirer le consentement donné précédemment'
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-100',
  under_review: 'text-blue-600 bg-blue-100',
  verification_required: 'text-orange-600 bg-orange-100',
  approved: 'text-green-600 bg-green-100',
  rejected: 'text-red-600 bg-red-100',
  completed: 'text-green-800 bg-green-200',
  expired: 'text-gray-600 bg-gray-100'
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  under_review: <Eye className="w-4 h-4" />,
  verification_required: <AlertTriangle className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  expired: <Clock className="w-4 h-4" />
};

export const GDPRDashboard: React.FC<GDPRDashboardProps> = memo(({
  studentId,
  parentEmail,
  isParent = true
}) => {
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [dataCategories, setDataCategories] = useState<DataCategory[]>([]);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus[]>([]);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showDataViewModal, setShowDataViewModal] = useState(false);
  const [selectedDataCategory, setSelectedDataCategory] = useState<string | null>(null);
  const [newRequestType, setNewRequestType] = useState<string>('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load GDPR data
  useEffect(() => {
    loadGDPRData();
  }, [studentId, parentEmail]);

  const loadGDPRData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await Promise.all([
        loadRequests(),
        loadDataCategories(),
        loadConsentStatus()
      ]);
    } catch (error) {
      console.error('Error loading GDPR data:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, parentEmail]);

  const loadRequests = async () => {
    // Mock data - replace with actual API call
    const mockRequests: GDPRRequest[] = [
      {
        id: '1',
        type: 'access',
        status: 'completed',
        submittedAt: new Date('2024-01-15'),
        dueDate: new Date('2024-02-14'),
        priority: 'medium',
        description: 'Demande d\'accès aux données de progression scolaire',
        timeRemaining: 'Complété'
      },
      {
        id: '2',
        type: 'rectification',
        status: 'under_review',
        submittedAt: new Date('2024-01-20'),
        dueDate: new Date('2024-02-19'),
        priority: 'high',
        description: 'Correction de l\'âge de l\'enfant dans le profil',
        timeRemaining: '15 jours restants'
      }
    ];
    setRequests(mockRequests);
  };

  const loadDataCategories = async () => {
    // Mock data - replace with actual API call
    const mockCategories: DataCategory[] = [
      {
        id: 'profile',
        name: 'Informations du profil',
        description: 'Données personnelles de base de l\'enfant',
        dataTypes: ['Nom', 'Âge', 'Classe', 'Préférences'],
        purposes: ['Identification', 'Personnalisation du contenu'],
        retentionPeriod: 'Durée de scolarité + 1 an',
        lastUpdated: new Date('2024-01-10'),
        canEdit: true,
        canDelete: false
      },
      {
        id: 'progress',
        name: 'Données de progression',
        description: 'Résultats et progression dans les exercices',
        dataTypes: ['Scores', 'Temps passé', 'Exercices réalisés', 'Niveau atteint'],
        purposes: ['Suivi pédagogique', 'Adaptation du contenu'],
        retentionPeriod: 'Durée de scolarité + 3 ans',
        lastUpdated: new Date('2024-01-22'),
        canEdit: false,
        canDelete: true
      },
      {
        id: 'interactions',
        name: 'Données d\'interaction',
        description: 'Historique des interactions avec la plateforme',
        dataTypes: ['Pages visitées', 'Clics', 'Durée des sessions'],
        purposes: ['Amélioration de l\'expérience', 'Analyses statistiques'],
        retentionPeriod: '2 ans',
        lastUpdated: new Date('2024-01-23'),
        canEdit: false,
        canDelete: true
      }
    ];
    setDataCategories(mockCategories);
  };

  const loadConsentStatus = async () => {
    // Mock data - replace with actual API call
    const mockConsent: ConsentStatus[] = [
      {
        category: 'Cookies fonctionnels',
        granted: true,
        grantedAt: new Date('2024-01-01'),
        canWithdraw: true,
        description: 'Amélioration de l\'expérience d\'apprentissage'
      },
      {
        category: 'Analyses statistiques',
        granted: true,
        grantedAt: new Date('2024-01-01'),
        canWithdraw: true,
        description: 'Amélioration du contenu éducatif'
      },
      {
        category: 'Personnalisation',
        granted: false,
        canWithdraw: false,
        description: 'Adaptation du contenu aux besoins de l\'enfant'
      }
    ];
    setConsentStatus(mockConsent);
  };

  const submitNewRequest = useCallback(async () => {
    if (!newRequestType || !newRequestDescription.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newRequest: GDPRRequest = {
        id: Date.now().toString(),
        type: newRequestType as any,
        status: 'pending',
        submittedAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        description: newRequestDescription,
        timeRemaining: '30 jours restants'
      };

      setRequests(prev => [newRequest, ...prev]);
      setShowNewRequestModal(false);
      setNewRequestType('');
      setNewRequestDescription('');
      
      alert('Votre demande a été soumise avec succès. Vous recevrez une confirmation par email.');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Erreur lors de la soumission de la demande');
    } finally {
      setSubmitting(false);
    }
  }, [newRequestType, newRequestDescription]);

  const exportData = useCallback(async (categoryId: string) => {
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create and download a mock file
      const data = {
        category: categoryId,
        exportedAt: new Date().toISOString(),
        data: 'Mock exported data for ' + categoryId
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donnees_${categoryId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Export réussi ! Le fichier a été téléchargé.');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erreur lors de l\'export des données');
    }
  }, []);

  const withdrawConsent = useCallback(async (category: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer votre consentement pour "${category}" ?`)) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConsentStatus(prev => prev.map(consent => 
        consent.category === category 
          ? { ...consent, granted: false, grantedAt: undefined }
          : consent
      ));
      
      alert('Consentement retiré avec succès');
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      alert('Erreur lors du retrait du consentement');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Gestion des données RGPD
              </h1>
              <p className="text-gray-600">
                {isParent 
                  ? 'Gérez les données personnelles de votre enfant et exercez vos droits RGPD'
                  : 'Consultez et gérez vos données personnelles'
                }
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewRequestModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Nouvelle demande
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => setShowNewRequestModal(true)}>
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Accéder aux données</h3>
              <p className="text-sm text-gray-600">Voir toutes les données collectées</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 cursor-pointer hover:bg-green-50 transition-colors" onClick={() => exportData('all')}>
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-gray-900">Exporter les données</h3>
              <p className="text-sm text-gray-600">Télécharger dans un format standard</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 cursor-pointer hover:bg-yellow-50 transition-colors" onClick={() => setShowNewRequestModal(true)}>
          <div className="flex items-center gap-3">
            <Edit className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-gray-900">Corriger les données</h3>
              <p className="text-sm text-gray-600">Rectifier des informations incorrectes</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 cursor-pointer hover:bg-red-50 transition-colors" onClick={() => setShowNewRequestModal(true)}>
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-gray-900">Supprimer les données</h3>
              <p className="text-sm text-gray-600">Exercer le droit à l'oubli</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current requests */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Mes demandes RGPD
        </h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune demande en cours</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${statusColors[request.status]}`}>
                      {statusIcons[request.status]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {requestTypeLabels[request.type]}
                      </h3>
                      <p className="text-sm text-gray-600">{request.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Soumise le {request.submittedAt.toLocaleDateString('fr-FR')}</span>
                        <span>Échéance : {request.dueDate.toLocaleDateString('fr-FR')}</span>
                        <span className={`px-2 py-1 rounded ${statusColors[request.status]}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{request.timeRemaining}</p>
                    <div className="mt-2">
                      <ProgressBar 
                        progress={request.status === 'completed' ? 100 : 60} 
                        size="sm" 
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Data categories */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Catégories de données collectées
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dataCategories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDataCategory(category.id);
                      setShowDataViewModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportData(category.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Types de données :</span>
                  <span className="text-gray-600 ml-2">{category.dataTypes.join(', ')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Conservation :</span>
                  <span className="text-gray-600 ml-2">{category.retentionPeriod}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Dernière mise à jour :</span>
                  <span className="text-gray-600 ml-2">{category.lastUpdated.toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Consent management */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Gestion des consentements
        </h2>
        
        <div className="space-y-4">
          {consentStatus.map((consent, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${consent.granted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <h3 className="font-medium text-gray-900">{consent.category}</h3>
                  <p className="text-sm text-gray-600">{consent.description}</p>
                  {consent.grantedAt && (
                    <p className="text-xs text-gray-500">
                      Accordé le {consent.grantedAt.toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  consent.granted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {consent.granted ? 'Accordé' : 'Non accordé'}
                </span>
                {consent.granted && consent.canWithdraw && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => withdrawConsent(consent.category)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Retirer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* New request modal */}
      <Modal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        title="Nouvelle demande RGPD"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de demande
            </label>
            <select
              value={newRequestType}
              onChange={(e) => setNewRequestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionnez un type de demande</option>
              {Object.entries(requestTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {newRequestType && (
              <p className="mt-2 text-sm text-gray-600">
                {requestTypeDescriptions[newRequestType]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description détaillée
            </label>
            <textarea
              value={newRequestDescription}
              onChange={(e) => setNewRequestDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez votre demande en détail..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Information importante</p>
                <p>
                  Votre demande sera traitée dans un délai maximum de 30 jours. 
                  Une vérification d'identité pourra être demandée pour les demandes sensibles.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={submitNewRequest}
              disabled={submitting || !newRequestType || !newRequestDescription.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <span className="mr-2">
                    <LoadingSpinner size="sm" />
                  </span>
                  Soumission...
                </>
              ) : (
                'Soumettre la demande'
              )}
            </Button>
            <Button
              onClick={() => setShowNewRequestModal(false)}
              variant="outline"
              disabled={submitting}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Data view modal */}
      <Modal
        isOpen={showDataViewModal}
        onClose={() => setShowDataViewModal(false)}
        title="Détails des données"
        size="lg"
      >
        {selectedDataCategory && (
          <div className="space-y-4">
            {/* Data category details would be loaded here */}
            <p className="text-gray-600">
              Détails des données pour la catégorie : {selectedDataCategory}
            </p>
            {/* Add actual data viewing functionality */}
          </div>
        )}
      </Modal>
    </div>
  );
});

GDPRDashboard.displayName = 'GDPRDashboard';

export default GDPRDashboard;