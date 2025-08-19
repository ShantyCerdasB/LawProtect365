Envelopes (JWT)

POST /envelopes — Crea un sobre (metadata, orden de firma, políticas).

GET /envelopes — Lista/pagina sobres por estado/fecha/tenant.

GET /envelopes/{id} — Obtiene detalles de un sobre.

PATCH /envelopes/{id} — Actualiza un sobre en draft (títulos, políticas, orden).

DELETE /envelopes/{id} — Elimina un draft (hard delete).

GET /envelopes/{id}/status — Estado consolidado (quién firmó/cuándo/faltantes).

GET /envelopes/{id}/events — Historial de eventos/auditoría encadenada.

Documentos en el sobre (JWT)

POST /envelopes/{id}/documents — Adjunta documento (por ID del documents-service o S3 ref).

GET /envelopes/{id}/documents — Lista documentos del sobre.

GET /envelopes/{id}/documents/{docId} — Metadatos del documento en el sobre.

PATCH /envelopes/{id}/documents/{docId} — Actualiza metadatos/mapeo de parties.

DELETE /envelopes/{id}/documents/{docId} — Quita documento (si draft).

Inputs/Campos (JWT)

POST /envelopes/{id}/inputs — Define campos (firma/iniciales/text/checkbox) y posiciones.

GET /envelopes/{id}/inputs — Lista campos definidos.

PATCH /envelopes/{id}/inputs/{inputId} — Actualiza tipo/posiciones/validaciones.

DELETE /envelopes/{id}/inputs/{inputId} — Elimina un campo.

Parties (firmantes/observadores) (JWT)

POST /envelopes/{id}/parties — Agrega party (email, rol, secuencia, MFA).

GET /envelopes/{id}/parties — Lista parties del sobre.

GET /envelopes/{id}/parties/{partyId} — Detalle de un party.

PATCH /envelopes/{id}/parties/{partyId} — Actualiza rol/orden/verificación.

DELETE /envelopes/{id}/parties/{partyId} — Quita party (si draft).

POST /envelopes/{id}/parties/{partyId}/delegate — Delegación controlada a otra persona.

Flujo/Acciones (JWT)

POST /envelopes/{id}/send — Envía invitaciones y genera tokens de firma.

POST /envelopes/{id}/invitations — Reenvía/rehace invitación para uno o varios parties.

POST /envelopes/{id}/reminders — Envía recordatorios a pendientes.

POST /envelopes/{id}/cancel — Cancela el sobre (revoca tokens).

POST /envelopes/{id}/finalise — Fuerza cierre cuando todos firmaron (si aplica).

GET /envelopes/{id}/audit-trail — Obtiene el audit trail (JSON/PDF).

GET /documents/{id}/certificate — Certificado de firma por documento.

GET /envelopes/{id}/certificate — Certificado final del sobre (resumen multi-firmante).

Firma pública (token, sin JWT)

GET /signing/{token} — Carga sesión de firma (documentos/campos/branding permitidos).

POST /signing/{token}/consent — Registra consentimiento ESIGN/UETA (timestamp/IP/UA).

POST /signing/{token}/otp/request — Genera y envía OTP (email/SMS) si está configurado.

POST /signing/{token}/otp/verify — Verifica OTP y autoriza sesión.

POST /signing/{token}/presign-upload — Retorna URL prefirmada (SSE-KMS) para subir PDF renderizado.

POST /signing/{token}/complete — Valida hash del PDF y firma digest con KMS; marca party como firmado.

POST /signing/{token}/decline — Declina con motivo; registra evidencia.

GET /signing/{token}/download — Descarga la copia del PDF visible al firmante.

Utilidades (JWT)

GET /envelopes/{id}/documents/{docId}/pages/{pageNo} — Thumbnail/preview de página para la UI.

Compat (no cuentan en los 39):
POST /consents (alias de 32) y POST /signatures (alias de 36) para convivir con el Terraform actual mientras migras la UI.