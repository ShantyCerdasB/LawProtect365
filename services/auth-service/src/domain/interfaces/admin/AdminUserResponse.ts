import { UserRole, UserAccountStatus, OAuthProvider } from '../../enums';

export interface AdminUserItem {
  id: string;
  cognitoSub: string;
  email: string;
  name: string;
  givenName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserAccountStatus;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  personalInfo?: {
    phone: string | null;
    locale: string | null;
    timeZone: string | null;
  };
  providers?: Array<{
    provider: OAuthProvider;
    linkedAt: string;
  }>;
}

export interface AdminUserPageInfo {
  nextCursor: string | null;
  limit: number;
  hasMore: boolean;
}

export interface AdminUserSummary {
  count: number;
}

export interface AdminUserResponse {
  items: AdminUserItem[];
  pageInfo: AdminUserPageInfo;
  summary: AdminUserSummary;
}
