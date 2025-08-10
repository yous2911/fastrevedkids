// Component to display security status (development only)
import React from 'react';
import { useSecurityHeaders } from '../../hooks/useSecurityHeaders';

const SecurityHeaders: React.FC = () => {
  const securityStatus = useSecurityHeaders();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const CHECKS = [
    { key: 'httpsOnly', label: 'HTTPS Only', status: securityStatus.httpsOnly },
    { key: 'csp', label: 'Content Security Policy', status: securityStatus.csp },
    { key: 'xssProtection', label: 'XSS Protection', status: securityStatus.xssProtection },
    { key: 'frameOptions', label: 'Frame Options', status: securityStatus.frameOptions },
    { key: 'contentTypeOptions', label: 'Content Type Options', status: securityStatus.contentTypeOptions },
    { key: 'referrerPolicy', label: 'Referrer Policy', status: securityStatus.referrerPolicy },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔒 Security Status</h3>
      <div className="space-y-1">
        {CHECKS.map(({ key, label, status }) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span>{label}</span>
            <span className={`ml-2 ${status ? 'text-green-600' : 'text-red-600'}`}>
              {status ? '✓' : '✗'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityHeaders; 