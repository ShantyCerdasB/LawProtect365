/**
 * Local runner to invoke handlers without API Gateway.
 * Usage examples:
 *   tsx serverless.local.ts src/controllers/envelopes/createEnvelope.ts POST /envelopes \
 *     '{"ownerId":"user-1","name":"My envelope"}'
 *   tsx serverless.local.ts src/controllers/envelopes/getEnvelopes.ts GET /envelopes
 */
