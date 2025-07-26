import React, { useState, useEffect } from 'react';
import { GDPRProvider, useGDPRContext, useGDPRPermissions } from '../../contexts/GDPRContext';
import { useGDPR, useParentalConsent, useGDPRRequests } from '../../hooks/useGDPR';
import { useGDPRValidation, useGDPRConnection } from '../../hooks/useGDPRUtils';
import { apiService } from '../../services/api.service';
import {
  ConsentType,
  GDPRRequestType,
  SubmitConsentRequest,
  SubmitGDPRRequest
} from '../../types/gdpr.types';

// Composant de test pour l'API Service
const APIServiceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const runAPITests = async () => {
    setLoading(true);
    const results: Record<string, boolean> = {};

    try {
      // Test 1: Health check RGPD
      try {
        const health = await apiService.getGDPRHealthCheck();
        results['healthCheck'] = health.success;
      } catch (error) {
        results['healthCheck'] = false;
      }

      // Test 2: Configuration RGPD
      try {
        const config = await apiService.getGDPRConfig();
        results['config'] = config.success;
      } catch (error) {
        results['config'] = false;
      }

      // Test 3: Soumission de consentement (avec données de test)
      try {
        const testConsent: SubmitConsentRequest = {
          parentEmail: 'test@example.com',
          parentName: 'Parent Test',
          childName: 'Enfant Test',
          childAge: 8,
          consentTypes: ['data_processing', 'educational_content'] as ConsentType[],
          ipAddress: 'test-ip',
          userAgent: 'test-agent'
        };
        
        const consent = await apiService.submitParentalConsent(testConsent);
        results['submitConsent'] = consent.success;
      } catch (error) {
        results['submitConsent'] = false;
      }

      // Test 4: Soumission de demande RGPD
      try {
        const testRequest: SubmitGDPRRequest = {
          requestType: 'access' as GDPRRequestType,
          requesterType: 'parent',
          requesterEmail: 'test@example.com',
          requesterName: 'Parent Test',
          requestDetails: 'Test de demande d\'accès aux données de mon enfant',
          urgentRequest: false,
          verificationMethod: 'email',
          ipAddress: 'test-ip',
          userAgent: 'test-agent'
        };
        
        const request = await apiService.submitGDPRRequest(testRequest);
        results['submitGDPRRequest'] = request.success;
      } catch (error) {
        results['submitGDPRRequest'] = false;
      }

      setTestResults(results);
    } catch (error) {
      console.error('❌ Erreur lors des tests API:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Tests API Service RGPD</h3>
      
      <button
        onClick={runAPITests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {loading ? 'Tests en cours...' : 'Lancer les tests API'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Résultats des tests :</h4>
          {Object.entries(testResults).map(([test, success]) => (
            <div key={test} className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${success ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>{test}: {success ? '✅ Réussi' : '❌ Échoué'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Composant de test pour les hooks
const HooksTest: React.FC = () => {
  const consent = useParentalConsent();
  const requests = useGDPRRequests();
  const validation = useGDPRValidation();
  const connection = useGDPRConnection();
  
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [validationResult, setValidationResult] = useState<any>(null);

  const testValidation = () => {
    const result = validation.validateParentalConsentForm({
      parentEmail: testEmail,
      parentName: 'Parent Test',
      childName: 'Enfant Test',
      childAge: 8,
      consentTypes: ['data_processing'] as ConsentType[]
    });
    setValidationResult(result);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Tests Hooks RGPD</h3>
      
      <div className="space-y-4">
        {/* Test de connexion */}
        <div>
          <h4 className="font-medium">Connexion RGPD :</h4>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${connection.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>{connection.isConnected ? 'Connecté' : 'Déconnecté'}</span>
            {connection.lastCheck && (
              <span className="text-sm text-gray-500">
                (Dernière vérification: {connection.lastCheck.toLocaleTimeString()})
              </span>
            )}
          </div>
          <button
            onClick={connection.checkConnection}
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Tester la connexion
          </button>
        </div>

        {/* Test de validation */}
        <div>
          <h4 className="font-medium">Test de validation :</h4>
          <div className="flex space-x-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Email à tester"
              className="border border-gray-300 px-3 py-1 rounded"
            />
            <button
              onClick={testValidation}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Valider
            </button>
          </div>
          {validationResult && (
            <div className="mt-2">
              <span className={validationResult.isValid ? 'text-green-600' : 'text-red-600'}>
                {validationResult.isValid ? '✅ Formulaire valide' : '❌ Erreurs trouvées'}
              </span>
              {!validationResult.isValid && (
                <ul className="text-sm text-red-600 mt-1">
                  {Object.entries(validationResult.errors).map(([field, error]) => (
                    <li key={field}>• {field}: {error as string}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* États des hooks */}
        <div>
          <h4 className="font-medium">États des hooks :</h4>
          <div className="text-sm space-y-1">
            <div>Consentement loading: {consent.loading ? '⏳' : '✅'}</div>
            <div>Demandes RGPD loading: {requests.loading ? '⏳' : '✅'}</div>
            <div>Erreur consentement: {consent.error || 'Aucune'}</div>
            <div>Erreur demandes: {requests.error || 'Aucune'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de test pour le contexte
const ContextTest: React.FC = () => {
  const gdprContext = useGDPRContext();
  const permissions = useGDPRPermissions();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Tests Contexte RGPD</h3>
      
      <div className="space-y-4">
        {/* État du contexte */}
        <div>
          <h4 className="font-medium">État du contexte :</h4>
          <div className="text-sm space-y-1">
            <div>RGPD activé: {gdprContext.isEnabled ? '✅' : '❌'}</div>
            <div>Connecté: {gdprContext.isConnected ? '✅' : '❌'}</div>
            <div>Étudiant ID: {gdprContext.currentStudentId || 'Aucun'}</div>
            <div>Consentement actif: {gdprContext.activeConsent ? '✅' : '❌'}</div>
            <div>Bannière visible: {gdprContext.showConsentBanner ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <h4 className="font-medium">Permissions :</h4>
          <div className="text-sm space-y-1">
            <div>Accès données étudiant: {permissions.canAccessStudentData() ? '✅' : '❌'}</div>
            <div>Export de données: {permissions.canExportData() ? '✅' : '❌'}</div>
            <div>Demandes RGPD: {permissions.canSubmitGDPRRequest() ? '✅' : '❌'}</div>
            <div>Bannière requise: {permissions.requiresConsentBanner() ? '⚠️' : '✅'}</div>
          </div>
        </div>

        {/* Actions de test */}
        <div>
          <h4 className="font-medium">Actions de test :</h4>
          <div className="space-x-2">
            <button
              onClick={() => gdprContext.setStudentId(Math.floor(Math.random() * 1000))}
              className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
            >
              Définir ID aléatoire
            </button>
            <button
              onClick={() => gdprContext.showConsentBannerAction(!gdprContext.showConsentBanner)}
              className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
            >
              Basculer bannière
            </button>
            <button
              onClick={() => gdprContext.refreshCache()}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Actualiser cache
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h4 className="font-medium">Notifications ({gdprContext.notifications.notifications.length}) :</h4>
          <div className="space-x-2">
            <button
              onClick={() => gdprContext.notifications.notifySuccess('Test de succès')}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
            >
              Succès
            </button>
            <button
              onClick={() => gdprContext.notifications.notifyError('Test d\'erreur')}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
            >
              Erreur
            </button>
            <button
              onClick={() => gdprContext.notifications.notifyWarning('Test d\'avertissement')}
              className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
            >
              Avertissement
            </button>
            <button
              onClick={() => gdprContext.notifications.clearNotifications()}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
            >
              Effacer
            </button>
          </div>
          
          {/* Affichage des notifications */}
          {gdprContext.notifications.notifications.length > 0 && (
            <div className="mt-2 space-y-1">
              {gdprContext.notifications.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`text-xs p-2 rounded border-l-4 ${
                    notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
                    notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                    notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                    'bg-blue-50 border-blue-500 text-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span>{notification.message}</span>
                    <button
                      onClick={() => gdprContext.notifications.removeNotification(notification.id)}
                      className="ml-2 text-xs opacity-50 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant principal de test d'intégration
const GDPRTestIntegrationInner: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test d'Intégration RGPD</h1>
        <p className="text-gray-600 mb-8">
          Cette page teste l'intégration complète des composants RGPD avec les APIs backend.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <APIServiceTest />
          <HooksTest />
          <div className="lg:col-span-2">
            <ContextTest />
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal avec Provider
const GDPRTestIntegration: React.FC = () => {
  return (
    <GDPRProvider
      initialStudentId={123}
      config={{
        enabled: true,
        parentalConsentRequired: true,
        consentBannerEnabled: true,
        showGranularControls: true,
        cookieConsentRequired: true,
        dataRetentionDays: 1095,
        contactEmail: 'support@revedkids.com',
        privacyPolicyUrl: '/privacy',
        termsOfServiceUrl: '/terms'
      }}
    >
      <GDPRTestIntegrationInner />
    </GDPRProvider>
  );
};

export default GDPRTestIntegration;