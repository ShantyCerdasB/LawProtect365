// Consent
export const CONSENT_STATUSES = ["pending","granted","revoked","denied","expired"] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const CONSENT_TYPES = ["signature","view","delegate"] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

// Delegation
export const DELEGATION_STATUSES = ["pending","accepted","declined","expired"] as const;
export type DelegationStatus = (typeof DELEGATION_STATUSES)[number];

// Parties
export const PARTY_STATUSES = ["pending","invited","signed","declined","active"] as const;
export type PartyStatus = (typeof PARTY_STATUSES)[number];

// Global Parties (Contacts)
export const GLOBAL_PARTY_STATUSES = ["active","inactive","deleted"] as const;
export type GlobalPartyStatus = (typeof GLOBAL_PARTY_STATUSES)[number];

// Authentication Methods
export const AUTH_METHODS = ["otpViaEmail","otpViaSms"] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

// Envelopes
export const ENVELOPE_STATUSES = ["draft","sent","in_progress","completed","canceled","declined","in_progress"] as const;
export type EnvelopeStatus = (typeof ENVELOPE_STATUSES)[number];

// Documents
export const DOCUMENT_STATUSES = ["pending","uploaded","processing","ready","error"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

// Signature flows
export const SIGNATURE_EVENTS = ["signing.completed","signing.declined","otp.requested","otp.verified"] as const;
export type SignatureEvent = (typeof SIGNATURE_EVENTS)[number];

export const SIGNATURE_ACTOR_FIELDS = ["userId","email","ip","userAgent","locale"] as const;
export type SignatureActorField = (typeof SIGNATURE_ACTOR_FIELDS)[number];

export const ALLOWED_CONTENT_TYPES = ["application/pdf","image/png","image/jpeg","image/gif","image/webp","image/svg+xml"] as const; 
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

// Upload Status
export const UPLOAD_STATUSES = ["pending", "uploading", "completed", "failed", "cancelled"] as const;
export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

// Evidence Types
export const EVIDENCE_TYPES = ["photo", "video", "audio", "document", "screenshot"] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

// Upload Formats
export const UPLOAD_FORMATS = ["json", "pdf"] as const;
export type UploadFormat = (typeof UPLOAD_FORMATS)[number];

// File Size Limits (in bytes)
export const FILE_SIZE_LIMITS = {
  EVIDENCE: 100 * 1024 * 1024, // 100MB
  PDF: 50 * 1024 * 1024, // 50MB
  MULTIPART_PART: 5 * 1024 * 1024, // 5MB per part
} as const;

// Rate Limits
export const UPLOAD_RATE_LIMITS = {
  EVIDENCE_PER_DAY: 10,
  EVIDENCE_PER_HOUR: 5,
  MULTIPART_PER_DAY: 20,
} as const;

export const HASH_ALGORITHM = ["sha256", "sha384", "sha512"] as const; 
export type HashAlgorithm = (typeof HASH_ALGORITHM)[number];


export const INPUT_VALUES = ["signature", "initials", "text", "checkbox", "date"] as const; 
export type InputType = (typeof INPUT_VALUES)[number];

export const OTP_POLICY = { codeLength: 6, expiresInMinutes: 10, maxTries: 3, cooldownSeconds: 60, rateLimitPerMinute: 5, rateLimitPerDay: 10, } as const;

export const KMS_ALGORITHMS = ["RSASSA_PSS_SHA_256", "RSASSA_PSS_SHA_384", "RSASSA_PSS_SHA_512", "RSASSA_PKCS1_V1_5_SHA_256", "RSASSA_PKCS1_V1_5_SHA_384", "RSASSA_PKCS1_V1_5_SHA_512", "ECDSA_SHA_256", "ECDSA_SHA_384", "ECDSA_SHA_512"] as const;
export type KmsAlgorithm = (typeof KMS_ALGORITHMS)[number];


export const OTP_CHANNELS = ["email", "sms"] as const;
export type OtpChannel = (typeof OTP_CHANNELS)[number];

export const PARTY_ROLES = ["signer", "approver", "viewer"] as const;
export type PartyRole = (typeof PARTY_ROLES)[number];

export const REQUEST_TOKEN_SCOPES = ["signing", "presign", "download"] as const;
export type RequestTokenScope = (typeof REQUEST_TOKEN_SCOPES)[number];

export const SIGNATURE_METHODS = ["drawn", "typed", "uploaded"] as const;
export type SignatureMethod = (typeof SIGNATURE_METHODS)[number];

// Party Types and Sources
export const PARTY_TYPES = ["global", "envelope"] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export const DELEGATION_TYPES = ["temporary", "permanent"] as const;
export type DelegationType = (typeof DELEGATION_TYPES)[number];

export const PARTY_SOURCES = ["manual", "import", "api"] as const;
export type PartySource = (typeof PARTY_SOURCES)[number];
