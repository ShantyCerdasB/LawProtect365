/**
 * Secret provider abstractions to decouple configuration from secret sources.
 * The default implementation reads from environment variables.
 */

/**
 * Secret provider interface.
 */
export interface SecretProvider {
  /**
   * Retrieves a secret by identifier, returning a string or undefined.
   * Implementations may cache values internally.
   * @param id Secret identifier (e.g., "JWT_PUBLIC_JWKS", "DOCUSIGN_API_KEY").
   */
  getSecret(id: string): Promise<string | undefined>;
}

/**
 * Environment-based secret provider that reads from process.env.
 */
export class EnvSecretProvider implements SecretProvider {
  /**
   * Creates a provider with an optional prefix for environment keys.
   * @param prefix Prefix to apply when looking up env keys (default "").
   */
  constructor(private readonly prefix = "") {}
  async getSecret(id: string): Promise<string | undefined> {
    const key = this.prefix ? `${this.prefix}${id}` : id;
    return process.env[key];
  }
}
