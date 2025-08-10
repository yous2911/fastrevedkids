// Hook to verify security headers are properly set
import { useEffect, useState } from 'react';

interface SecurityCheck {
  csp: boolean;
  xssProtection: boolean;
  frameOptions: boolean;
  contentTypeOptions: boolean;
  referrerPolicy: boolean;
  httpsOnly: boolean;
}

export const useSecurityHeaders = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityCheck>({
    csp: false,
    xssProtection: false,
    frameOptions: false,
    contentTypeOptions: false,
    referrerPolicy: false,
    httpsOnly: false,
  });

  useEffect(() => {
    const checkSecurityHeaders = async () => {
      try {
        // Check if we're in HTTPS
        const httpsOnly = window.location.protocol === 'https:';

        // Check meta tags for security headers
        const metaTags = document.getElementsByTagName('meta');
        const checks: Partial<SecurityCheck> = { httpsOnly };

        Array.from(metaTags).forEach(meta => {
          const httpEquiv = meta.getAttribute('http-equiv')?.toLowerCase();
          
          switch (httpEquiv) {
            case 'content-security-policy':
              checks.csp = true;
              break;
            case 'x-xss-protection':
              checks.xssProtection = true;
              break;
            case 'x-frame-options':
              checks.frameOptions = true;
              break;
            case 'x-content-type-options':
              checks.contentTypeOptions = true;
              break;
            case 'referrer-policy':
              checks.referrerPolicy = true;
              break;
          }
        });

        setSecurityStatus(checks as SecurityCheck);

        // Log security status in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Security Headers Status:', checks);
          
          const missing = Object.entries(checks)
            .filter(([_, value]) => !value)
            .map(([key]) => key);
            
          if (missing.length > 0) {
            console.warn('⚠️ Missing security headers:', missing);
          }
        }
      } catch (error) {
        console.error('Failed to check security headers:', error);
      }
    };

    checkSecurityHeaders();
  }, []);

  return securityStatus;
}; 