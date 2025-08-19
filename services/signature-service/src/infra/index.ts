/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
/**
 * Infra factories: create AWS/Dynamo/S3/KMS clients and adapters.
 * Keep SDK creation here (singletons) to keep handlers/use-cases pure.
 */
export const makeDynamoEnvelopeRepository = () => {
  // TODO: return repository implementation binding doc tables from env
  return { notImplemented: true };
};
