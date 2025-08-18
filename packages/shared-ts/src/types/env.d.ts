/* Ambient declarations for process.env to improve DX across services. */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Environment name (affects logging and error detail exposure). */
    ENV?: "dev" | "staging" | "prod" | string;

    /** Project/service metadata. */
    PROJECT_NAME?: string;
    SERVICE_NAME?: string;

    /** AWS region hint. */
    AWS_REGION?: string;

    /** Logging level. */
    LOG_LEVEL?: "debug" | "info" | "warn" | "error" | string;

    /** Auth configuration (Cognito/JWT). */
    COGNITO_USER_POOL_ID?: string;
    COGNITO_CLIENT_ID?: string;
    JWT_ISSUER?: string;
    JWT_AUDIENCE?: string;

    /** Documents domain resources (when relevant). */
    TEMPLATES_BUCKET?: string;
    DOCUMENTS_BUCKET?: string;
    DOCS_TABLE?: string;
  }
}
