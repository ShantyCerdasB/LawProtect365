import { OAuthProvider } from '../../enums/OAuthProvider';
import { UnlinkingMode } from '../../enums/UnlinkingMode';

export interface UnlinkProviderRequest {
  mode: UnlinkingMode;
  provider: OAuthProvider;
  providerAccountId: string;
  confirmationToken?: string; // For confirm mode
}
