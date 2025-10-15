import { UserRole, UserAccountStatus, OAuthProvider, AdminSortField, SortDirection, AdminIncludeField } from '../../enums';

export interface AdminUserQuery {
  // Search
  q?: string;
  
  // Filters
  role?: UserRole[];
  status?: UserAccountStatus[];
  mfa?: 'enabled' | 'disabled';
  provider?: OAuthProvider[];
  
  // Date ranges
  createdFrom?: string; // ISO-8601
  createdTo?: string;   // ISO-8601
  lastLoginFrom?: string; // ISO-8601
  lastLoginTo?: string;   // ISO-8601
  
  // Sorting
  sortBy?: AdminSortField;
  sortDir?: SortDirection;
  
  // Includes
  include?: AdminIncludeField[];
  
  // Pagination
  limit?: number;
  cursor?: string;
}
