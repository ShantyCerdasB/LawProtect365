import { OAuthProvider } from '../../enums/OAuthProvider';
import { ProviderUnlinkingStatus } from '../../enums/ProviderUnlinkingStatus';

export interface UnlinkProviderResponse {
  unlinked: boolean;
  provider: OAuthProvider;
  providerAccountId: string;
  unlinkedAt?: string;
  status: ProviderUnlinkingStatus;
  message?: string;
}
