/**
 * Accessibility Test Panel Component
 * Provides a UI for running accessibility tests and viewing results
 */

import React, { useState } from 'react';
import { useAccessibilityTesting } from '../../hooks/useAccessibilityTesting';

interface AccessibilityTestPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  autoTest?: boolean;
  autoFix?: boolean;
}

export const AccessibilityTestPanel: React.FC<AccessibilityTestPanelProps> = ({
  isVisible,
  onToggle,
  autoTest = false,
  autoFix = false
}) => {
  const {
    currentReport,
    isTestRunning,
    lastAutoFixResult,
    runTest,
    autoFix: performAutoFix,
    startMonitoring,
    stopMonitoring,
    generateReport,
    validateWCAG
  } = useAccessibilityTesting({
    autoTest,
    autoFix,
    onViolations: (violations) => {
      console.warn(`Accessibility violations found: ${violations.length}`);
    },
    onTestComplete: (report) => {
      console.log(`Accessibility test complete: ${report.violationCount} violations, ${report.passCount} passes`);
    }
  });

  const [wcagLevel, setWcagLevel] = useState<'A' | 'AA' | 'AAA'>('AA');
  const [wcagResult, setWcagResult] = useState<any>(null);
  const [customSelector, setCustomSelector] = useState('');

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50"
        aria-label="Ouvrir le panneau de test d'accessibilité"
      >
        🧪
      </button>
    );
  }

  const handleRunTest = async () => {
    try {
      await runTest();
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const handleTestComponent = async () => {
    if (!customSelector.trim()) {
      alert('Veuillez entrer un sélecteur CSS');
      return;
    }
    
    try {
      await runTest(customSelector);
    } catch (error) {
      console.error('Component test failed:', error);
      alert('Composant non trouvé ou test échoué');
    }
  };

  const handleValidateWCAG = async () => {
    try {
      const result = await validateWCAG(wcagLevel);
      setWcagResult(result);
    } catch (error) {
      console.error('WCAG validation failed:', error);
    }
  };

  const handleDownloadReport = () => {
    const html = generateReport('html') as string;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
        <h3 className="font-semibold">Tests d'Accessibilité</h3>
        <button
          onClick={onToggle}
          className="text-white hover:text-gray-200"
          aria-label="Fermer le panneau"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-80">
        {/* Test Controls */}
        <div className="space-y-3 mb-4">
          <button
            onClick={handleRunTest}
            disabled={isTestRunning}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isTestRunning ? 'Test en cours...' : 'Lancer le test'}
          </button>

          <div className="flex space-x-2">
            <input
              type="text"
              value={customSelector}
              onChange={(e) => setCustomSelector(e.target.value)}
              placeholder="Sélecteur CSS (ex: .my-component)"
              className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
            />
            <button
              onClick={handleTestComponent}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Test
            </button>
          </div>

          {lastAutoFixResult && (
            <button
              onClick={() => performAutoFix()}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Auto-corriger ({lastAutoFixResult.failed} échecs)
            </button>
          )}
        </div>

        {/* WCAG Validation */}
        <div className="border-t pt-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <select
              value={wcagLevel}
              onChange={(e) => setWcagLevel(e.target.value as 'A' | 'AA' | 'AAA')}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="A">WCAG 2.1 A</option>
              <option value="AA">WCAG 2.1 AA</option>
              <option value="AAA">WCAG 2.1 AAA</option>
            </select>
            <button
              onClick={handleValidateWCAG}
              className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
            >
              Valider WCAG
            </button>
          </div>

          {wcagResult && (
            <div className={`p-2 rounded text-sm ${
              wcagResult.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="font-semibold">
                {wcagResult.isCompliant ? '✅ Conforme' : '❌ Non conforme'} - {wcagResult.level}
              </div>
              {!wcagResult.isCompliant && (
                <div>{wcagResult.violations.length} violations trouvées</div>
              )}
            </div>
          )}
        </div>

        {/* Test Results */}
        {currentReport && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Résultats</h4>
              <button
                onClick={handleDownloadReport}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                📥 Télécharger
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tests:</span>
                <span className="font-semibold">{currentReport.testCount}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Violations:</span>
                <span className={`font-semibold ${
                  currentReport.violationCount === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentReport.violationCount}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Réussites:</span>
                <span className="font-semibold text-green-600">{currentReport.passCount}</span>
              </div>
            </div>

            {/* Violation Details */}
            {currentReport.violations.length > 0 && (
              <div className="mt-3">
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold text-red-600">
                    Détails des violations ({currentReport.violations.length})
                  </summary>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {currentReport.violations.slice(0, 5).map((violation, index) => (
                      <div key={index} className="bg-red-50 p-2 rounded">
                        <div className="font-semibold text-red-800">
                          {violation.id} ({violation.impact})
                        </div>
                        <div className="text-gray-600 text-xs">
                          {violation.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {violation.nodes.length} élément(s) concerné(s)
                        </div>
                      </div>
                    ))}
                    {currentReport.violations.length > 5 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{currentReport.violations.length - 5} autres violations
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Auto-fix Results */}
            {lastAutoFixResult && (
              <div className="mt-3 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-semibold text-blue-800">Auto-correction</div>
                  <div>✅ {lastAutoFixResult.fixed} corrigées</div>
                  <div>❌ {lastAutoFixResult.failed} échouées</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monitoring Controls */}
        <div className="border-t pt-3 mt-4">
          <div className="flex space-x-2">
            <button
              onClick={startMonitoring}
              className="flex-1 bg-yellow-500 text-white py-1 px-2 rounded text-xs hover:bg-yellow-600"
            >
              Démarrer surveillance
            </button>
            <button
              onClick={stopMonitoring}
              className="flex-1 bg-gray-500 text-white py-1 px-2 rounded text-xs hover:bg-gray-600"
            >
              Arrêter surveillance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityTestPanel;