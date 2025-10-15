import { z } from 'zod';
import { UserRole, UserAccountStatus, OAuthProvider, AdminSortField, SortDirection, AdminIncludeField } from '../enums';

export const AdminUserQuerySchema = z.object({
  // Search
  q: z.string().min(1).max(100).optional(),
  
  // Filters
  role: z.string().optional().transform(val => 
    val ? val.split(',').map(r => r.trim() as UserRole) : undefined
  ),
  status: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim() as UserAccountStatus) : undefined
  ),
  mfa: z.enum(['enabled', 'disabled']).optional(),
  provider: z.string().optional().transform(val => 
    val ? val.split(',').map(p => p.trim() as OAuthProvider) : undefined
  ),
  
  // Date ranges
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  lastLoginFrom: z.string().datetime().optional(),
  lastLoginTo: z.string().datetime().optional(),
  
  // Sorting
  sortBy: z.nativeEnum(AdminSortField).optional(),
  sortDir: z.nativeEnum(SortDirection).optional(),
  
  // Includes
  include: z.string().optional().transform(val => 
    val ? val.split(',').map(i => i.trim() as AdminIncludeField) : undefined
  ),
  
  // Pagination
  limit: z.coerce.number().int().min(10).max(200).optional(),
  cursor: z.string().optional()
});

export type AdminUserQuery = z.infer<typeof AdminUserQuerySchema>;
