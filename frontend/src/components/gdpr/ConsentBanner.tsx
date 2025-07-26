import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Settings, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  icon: React.ReactNode;
  purposes: string[];
  dataTypes: string[];
  thirdParties: string[];
  retentionPeriod: string;
}

interface ConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  timestamp: Date;
  version: string;
}

interface ConsentBannerProps {
  onConsentChange: (preferences: ConsentPreferences) => void;
  showBanner: boolean;
  currentConsent?: ConsentPreferences;
  isMinor?: boolean;
  parentalConsentRequired?: boolean;
}

const defaultCategories: ConsentCategory[] = [
  {
    id: 'essential',
    name: 'Cookies essentiels',
    description: 'Nécessaires au fonctionnement de base de la plateforme éducative',
    required: true,
    enabled: true,
    icon: <Shield className="w-5 h-5" />,
    purposes: [
      'Authentification et sécurité',
      'Navigation et fonctionnalités de base',
      'Préférences de session'
    ],
    dataTypes: ['Identifiants de session', 'Préférences utilisateur', 'Données de sécurité'],
    thirdParties: [],
    retentionPeriod: 'Durée de la session'
  },
  {
    id: 'functional',
    name: 'Fonctionnalités',
    description: 'Pour améliorer l\'expérience d\'apprentissage de votre enfant',
    required: false,
    enabled: false,
    icon: <Settings className="w-5 h-5" />,
    purposes: [
      'Sauvegarde du progrès éducatif',
      'Personnalisation du contenu',
      'Préférences d\'accessibilité'
    ],
    dataTypes: ['Progrès dans les exercices', 'Préférences d\'apprentissage', 'Paramètres d\'accessibilité'],
    thirdParties: [],
    retentionPeriod: '2 ans après la dernière activité'
  },
  {
    id: 'analytics',
    name: 'Analyses statistiques',
    description: 'Pour comprendre comment améliorer notre plateforme éducative',
    required: false,
    enabled: false,
    icon: <Eye className="w-5 h-5" />,
    purposes: [
      'Amélioration du contenu éducatif',
      'Optimisation de l\'expérience utilisateur',
      'Statistiques d\'usage anonymisées'
    ],
    dataTypes: ['Pages visitées', 'Temps passé sur les exercices', 'Interactions avec le contenu'],
    thirdParties: ['Google Analytics (données anonymisées)'],
    retentionPeriod: '26 mois'
  },
  {
    id: 'personalization',
    name: 'Personnalisation',
    description: 'Pour adapter le contenu éducatif aux besoins de votre enfant',
    required: false,
    enabled: false,
    icon: <Settings className="w-5 h-5" />,
    purposes: [
      'Recommandations d\'exercices adaptés',
      'Parcours d\'apprentissage personnalisé',
      'Adaptation du niveau de difficulté'
    ],
    dataTypes: ['Historique des exercices', 'Performances scolaires', 'Préférences d\'apprentissage'],
    thirdParties: [],
    retentionPeriod: 'Durée de scolarité + 1 an'
  }
];

export const ConsentBanner: React.FC<ConsentBannerProps> = memo(({
  onConsentChange,
  showBanner,
  currentConsent,
  isMinor = true,
  parentalConsentRequired = true
}) => {
  const [categories, setCategories] = useState<ConsentCategory[]>(defaultCategories);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize categories with current consent
  useEffect(() => {
    if (currentConsent) {
      setCategories(prev => prev.map(cat => ({
        ...cat,
        enabled: currentConsent[cat.id as keyof ConsentPreferences] as boolean
      })));
    }
  }, [currentConsent]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId && !cat.required 
        ? { ...cat, enabled: !cat.enabled }
        : cat
    ));
  }, []);

  const generateConsentPreferences = useCallback((): ConsentPreferences => {
    const preferences: ConsentPreferences = {
      essential: true, // Always true
      functional: categories.find(c => c.id === 'functional')?.enabled || false,
      analytics: categories.find(c => c.id === 'analytics')?.enabled || false,
      marketing: false, // Not used for children
      personalization: categories.find(c => c.id === 'personalization')?.enabled || false,
      timestamp: new Date(),
      version: '1.0'
    };
    return preferences;
  }, [categories]);

  const handleAcceptAll = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Enable all non-required categories
      setCategories(prev => prev.map(cat => ({ ...cat, enabled: true })));
      
      // Generate preferences with all enabled
      const preferences: ConsentPreferences = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: false,
        personalization: true,
        timestamp: new Date(),
        version: '1.0'
      };

      await onConsentChange(preferences);
    } finally {
      setIsProcessing(false);
    }
  }, [onConsentChange]);

  const handleAcceptSelected = useCallback(async () => {
    setIsProcessing(true);
    try {
      const preferences = generateConsentPreferences();
      await onConsentChange(preferences);
    } finally {
      setIsProcessing(false);
    }
  }, [generateConsentPreferences, onConsentChange]);

  const handleRejectAll = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Only enable essential cookies
      setCategories(prev => prev.map(cat => ({ 
        ...cat, 
        enabled: cat.required 
      })));

      const preferences: ConsentPreferences = {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        personalization: false,
        timestamp: new Date(),
        version: '1.0'
      };

      await onConsentChange(preferences);
    } finally {
      setIsProcessing(false);
    }
  }, [onConsentChange]);

  if (!showBanner) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-blue-500 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto p-6">
            {/* Parental consent notice for minors */}
            {isMinor && parentalConsentRequired && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Consentement parental requis</p>
                  <p>Cette plateforme est destinée aux enfants. Un parent ou tuteur légal doit donner son consentement pour l'utilisation des données personnelles.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Protection des données de votre enfant
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Nous respectons la vie privée de votre enfant. Cette plateforme éducative utilise des cookies et collecte des données pour offrir une expérience d'apprentissage personnalisée et sécurisée. Vous pouvez choisir quels types de données vous acceptez de partager.
                    </p>
                  </div>
                </div>

                {/* Quick categories overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 rounded-lg border transition-all ${
                        category.enabled
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {category.icon}
                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>
                        {category.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            Requis
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-tight">
                        {category.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Privacy links */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <button
                    onClick={() => setShowDetailedModal(true)}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Voir les détails
                  </button>
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                    Politique de confidentialité
                  </a>
                  <a href="/gdpr" className="text-blue-600 hover:text-blue-800 underline">
                    Vos droits RGPD
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-64">
                <Button
                  onClick={handleAcceptAll}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-medium"
                  size="lg"
                >
                  {isProcessing ? 'Traitement...' : 'Tout accepter'}
                </Button>
                
                <Button
                  onClick={handleAcceptSelected}
                  disabled={isProcessing}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  size="lg"
                >
                  Accepter la sélection
                </Button>
                
                <Button
                  onClick={handleRejectAll}
                  disabled={isProcessing}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  size="lg"
                >
                  Cookies essentiels uniquement
                </Button>

                <Button
                  onClick={() => setShowDetailedModal(true)}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-800"
                  size="lg"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Personnaliser
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Detailed consent modal */}
      <Modal
        isOpen={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
        title="Gestion détaillée des cookies et données"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Protection renforcée pour les enfants
                </h4>
                <p className="text-sm text-blue-800">
                  Conformément au RGPD et à la protection des mineurs, nous appliquons des mesures de sécurité renforcées et une collecte de données minimale.
                </p>
              </div>
            </div>
          </div>

          {categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {category.name}
                        {category.required && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Obligatoire
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.id ? null : category.id
                      )}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      {expandedCategory === category.id ? 'Masquer' : 'Détails'}
                    </button>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.enabled}
                        onChange={() => handleCategoryToggle(category.id)}
                        disabled={category.required}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${
                        category.enabled ? 'peer-checked:bg-blue-600' : ''
                      } ${category.required ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className={`absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-all ${
                          category.enabled ? 'translate-x-full border-white' : ''
                        }`}></div>
                      </div>
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedCategory === category.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 pt-3 mt-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Finalités</h5>
                          <ul className="space-y-1">
                            {category.purposes.map((purpose, index) => (
                              <li key={index} className="text-gray-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                {purpose}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Types de données</h5>
                          <ul className="space-y-1">
                            {category.dataTypes.map((dataType, index) => (
                              <li key={index} className="text-gray-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                {dataType}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Durée de conservation</h5>
                          <p className="text-gray-600">{category.retentionPeriod}</p>
                        </div>
                        
                        {category.thirdParties.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Tiers</h5>
                            <ul className="space-y-1">
                              {category.thirdParties.map((party, index) => (
                                <li key={index} className="text-gray-600">{party}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={async () => {
                await handleAcceptSelected();
                setShowDetailedModal(false);
              }}
              disabled={isProcessing}
              className="bg-blue-600 text-white hover:bg-blue-700"
              size="lg"
            >
              {isProcessing ? 'Sauvegarde...' : 'Sauvegarder mes préférences'}
            </Button>
            
            <Button
              onClick={() => setShowDetailedModal(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              size="lg"
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.showBanner === nextProps.showBanner &&
    prevProps.isMinor === nextProps.isMinor &&
    prevProps.parentalConsentRequired === nextProps.parentalConsentRequired &&
    JSON.stringify(prevProps.currentConsent) === JSON.stringify(nextProps.currentConsent)
  );
});

ConsentBanner.displayName = 'ConsentBanner';