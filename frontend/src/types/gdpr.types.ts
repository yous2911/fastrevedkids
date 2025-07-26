// Types partagés frontend/backend pour RGPD
// Synchronisés avec backend/src/types/gdpr.types.ts

export interface ParentalConsentRecord {
  id: string;
  parentEmail: string;
  parentName: string;
  childName: string;
  childAge: number;
  consentTypes: ConsentType[];
  status: ConsentStatus;
  firstConsentToken: string;
  secondConsentToken?: string;
  firstConsentDate?: Date;
  secondConsentDate?: Date;
  verificationDate?: Date;
  expiryDate: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ConsentType = 
  | 'data_processing'
  | 'educational_content'
  | 'progress_tracking'
  | 'communication'
  | 'analytics'
  | 'marketing';

export type ConsentStatus = 
  | 'pending'
  | 'verified'
  | 'expired'
  | 'revoked';

export interface GDPRRequestRecord {
  id: string;
  requestType: GDPRRequestType;
  requesterType: RequesterType;
  requesterEmail: string;
  requesterName: string;
  studentId?: number;
  studentName?: string;
  parentEmail?: string;
  requestDetails: string;
  urgentRequest: boolean;
  status: RequestStatus;
  priority: Priority;
  submittedAt: Date;
  dueDate: Date;
  verificationToken?: string;
  verifiedAt?: Date;
  assignedTo?: string;
  processedAt?: Date;
  completedAt?: Date;
  ipAddress: string;
  userAgent: string;
  verificationMethod: VerificationMethod;
  legalBasis?: string;
  responseDetails?: string;
  actionsTaken: string[];
  exportedData?: any;
}

export type GDPRRequestType = 
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'restriction'
  | 'portability'
  | 'objection'
  | 'withdraw_consent';

export type RequesterType = 
  | 'parent'
  | 'student'
  | 'legal_guardian'
  | 'data_protection_officer';

export type RequestStatus = 
  | 'pending'
  | 'under_review'
  | 'verification_required'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'expired';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type VerificationMethod = 
  | 'email'
  | 'identity_document'
  | 'parental_verification';

export interface ConsentPreferencesRecord {
  id: string;
  userId?: string;
  studentId?: number;
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  version: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// API Request/Response types
export interface SubmitConsentRequest {
  parentEmail: string;
  parentName: string;
  childName: string;
  childAge: number;
  consentTypes: ConsentType[];
  ipAddress: string;
  userAgent: string;
}

export interface SubmitConsentResponse {
  consentId: string;
  message: string;
}

export interface SubmitGDPRRequest {
  requestType: GDPRRequestType;
  requesterType: RequesterType;
  requesterEmail: string;
  requesterName: string;
  studentId?: number;
  studentName?: string;
  parentEmail?: string;
  requestDetails: string;
  urgentRequest: boolean;
  verificationMethod: VerificationMethod;
  legalBasis?: string;
  ipAddress: string;
  userAgent: string;
}

export interface SubmitGDPRResponse {
  requestId: string;
  verificationRequired: boolean;
  estimatedCompletionDate: Date;
}

export interface ConsentPreferencesRequest {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  ipAddress: string;
  userAgent: string;
}

export interface GDPRRequestStatusResponse {
  requestId: string;
  status: RequestStatus;
  priority: Priority;
  submittedAt: string;
  dueDate: string;
  estimatedCompletion: string;
  lastUpdate: string;
}

export interface StudentDataExportRequest {
  studentId: string;
  format?: 'json' | 'csv' | 'xml';
  includeProgress?: boolean;
  includeAuditLogs?: boolean;
}

export interface StudentDataExportResponse {
  student: any;
  progress?: any[];
  auditLogs?: any[];
  exportedAt: string;
  format: string;
  requestedBy: string;
}

// Frontend-specific types pour les composants React
export interface ConsentBannerProps {
  onAccept: (preferences: ConsentPreferencesRequest) => void;
  onReject: () => void;
  initialPreferences?: Partial<ConsentPreferencesRequest>;
  showGranularControls?: boolean;
}

export interface GDPRDashboardProps {
  studentId?: number;
  parentEmail?: string;
  onRequestSubmitted?: (requestId: string) => void;
}

export interface ParentalConsentFormProps {
  onSubmit: (consent: SubmitConsentRequest) => void;
  loading?: boolean;
  defaultValues?: Partial<SubmitConsentRequest>;
}

export interface GDPRRequestFormProps {
  onSubmit: (request: SubmitGDPRRequest) => void;
  loading?: boolean;
  studentId?: number;
  defaultValues?: Partial<SubmitGDPRRequest>;
}

// États pour les hooks React
export interface UseConsentState {
  consent: ParentalConsentRecord | null;
  loading: boolean;
  error: string | null;
  submitConsent: (data: SubmitConsentRequest) => Promise<void>;
  verifyConsent: (token: string) => Promise<void>;
  checkConsentStatus: (consentId: string) => Promise<void>;
}

export interface UseGDPRRequestsState {
  requests: GDPRRequestRecord[];
  loading: boolean;
  error: string | null;
  submitRequest: (data: SubmitGDPRRequest) => Promise<string>;
  getRequestStatus: (requestId: string) => Promise<GDPRRequestStatusResponse>;
  verifyRequest: (requestId: string, token: string) => Promise<void>;
}

export interface UseConsentPreferencesState {
  preferences: ConsentPreferencesRecord | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (prefs: ConsentPreferencesRequest) => Promise<void>;
  getPreferences: () => Promise<void>;
}

export interface UseStudentDataExportState {
  loading: boolean;
  error: string | null;
  exportData: (request: StudentDataExportRequest) => Promise<Blob>;
  exportHistory: any[];
}

// Configuration RGPD pour le frontend
export interface GDPRConfig {
  enabled: boolean;
  parentalConsentRequired: boolean;
  consentBannerEnabled: boolean;
  showGranularControls: boolean;
  cookieConsentRequired: boolean;
  dataRetentionDays: number;
  contactEmail: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

// Utilitaires et constantes
export const CONSENT_TYPES_LABELS: Record<ConsentType, string> = {
  data_processing: 'Traitement des données personnelles',
  educational_content: 'Contenu éducatif personnalisé',
  progress_tracking: 'Suivi des progrès scolaires',
  communication: 'Communications relatives au compte',
  analytics: 'Analyses statistiques anonymisées',
  marketing: 'Communications marketing'
};

export const GDPR_REQUEST_TYPES_LABELS: Record<GDPRRequestType, string> = {
  access: 'Accès aux données (Article 15)',
  rectification: 'Rectification des données (Article 16)',
  erasure: 'Effacement des données (Article 17)',
  restriction: 'Limitation du traitement (Article 18)',
  portability: 'Portabilité des données (Article 20)',
  objection: 'Opposition au traitement (Article 21)',
  withdraw_consent: 'Retrait du consentement (Article 7)'
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'En attente',
  under_review: 'En cours d\'examen',
  verification_required: 'Vérification requise',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  completed: 'Terminée',
  expired: 'Expirée'
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  urgent: 'Urgente'
};

// Helper functions
export const getUserAgent = (): string => {
  return typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';
};

export const getClientIP = async (): Promise<string> => {
  // Dans un environnement de production, vous pourriez vouloir
  // obtenir l'IP via un service ou le backend
  return 'client-ip';
};

export const isConsentExpired = (consent: ParentalConsentRecord): boolean => {
  return new Date() > new Date(consent.expiryDate);
};

export const isRequestOverdue = (request: GDPRRequestRecord): boolean => {
  return new Date() > new Date(request.dueDate) && 
         !['completed', 'rejected'].includes(request.status);
};

export const getRequestDeadline = (submittedAt: Date, priority: Priority): Date => {
  const deadline = new Date(submittedAt);
  const daysToAdd = priority === 'urgent' ? 3 : 30;
  deadline.setDate(deadline.getDate() + daysToAdd);
  return deadline;
};