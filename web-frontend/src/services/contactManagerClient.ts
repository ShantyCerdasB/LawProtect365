import apiClient from "./apiClient";

//
// Data Types
//

/**
 * The possible statuses for a Contact Manager.
 */
export type ContactManagerStatus =
  | "Unavailable"
  | "Available"
  | "OnBreak"
  | "OnAnotherTask";

/**
 * DTO representing a Contact Manager profile.
 */
export interface ContactManagerProfile {
  /** Profile record UUID */
  id: string;
  /** The user’s Azure AD object ID */
  userId: string;
  /** The user’s email address */
  email: string;
  /** The user’s full display name */
  fullName: string;
  /** Current status */
  status: ContactManagerStatus;
  /** When this profile was created */
  createdAt: string;
  /** When this profile was last updated */
  updatedAt: string;
}

/**
 * Payload to create or update a Contact Manager.
 */
export interface UpsertContactManagerPayload {
  /** The PSO’s email address */
  email: string;
  /** Initial or new status */
  status: ContactManagerStatus;
}

/**
 * Payload to update only the status of a Contact Manager.
 */
export interface UpdateContactManagerStatusPayload {
  /** Profile record UUID */
  profileId: string;
  /** New status */
  status: ContactManagerStatus;
}

export interface ContactManagerDTO {
  id:        string;
  email:     string;
  fullName:  string;
  status:    'Unavailable' | 'Available' | 'OnBreak' | 'OnAnotherTask';
  createdAt: string;
  updatedAt: string;
}

//
// API Functions
//

/**
 * Fetches all Contact Manager profiles.
 *
 * @returns Promise resolving to an array of {@link ContactManagerProfile}.
 *
 * @example
 * ```ts
 * const cms = await getContactManagers();
 * console.log(cms);
 * ```
 */
export async function getContactManagers(): Promise<ContactManagerProfile[]> {
  const res = await apiClient.get<{ items: ContactManagerProfile[] }>("/api/contactManagers");
  return res.data.items;
}

/**
 * Creates a new Contact Manager profile (or updates existing), and assigns the AppRole.
 *
 * @param payload.email  – The user’s email.
 * @param payload.status – Initial status for the Contact Manager.
 * @returns Promise resolving to the newly upserted {@link ContactManagerProfile}.
 *
 * @example
 * ```ts
 * const newCm = await upsertContactManager({ email: "alice@contoso.com", status: "Available" });
 * console.log("Created:", newCm);
 * ```
 */
export async function upsertContactManager(
  payload: UpsertContactManagerPayload
): Promise<ContactManagerProfile> {
  const res = await apiClient.post<ContactManagerProfile>(
    "/api/contactManagers",
    payload
  );
  return res.data;
}

/**
 * Revokes the Contact Manager role (removes AppRole and deletes profile).
 *
 * @param profileId – The UUID of the profile to revoke.
 * @returns Promise resolving to void.
 *
 * @example
 * ```ts
 * await revokeContactManager("a1b2c3d4-...");
 * console.log("Revoked");
 * ```
 */
export async function revokeContactManager(profileId: string): Promise<void> {
  await apiClient.delete(`/api/contactManagers/${profileId}`);
}

/**
 * Updates only the status of an existing Contact Manager profile.
 *
 * @param payload.profileId – The profile UUID.
 * @param payload.status    – The new status.
 * @returns Promise resolving to the updated {@link ContactManagerProfile}.
 *
 * @example
 * ```ts
 * const updated = await updateContactManagerStatus({
 *   profileId: "a1b2c3d4-...",
 *   status: "OnBreak"
 * });
 * console.log("New status:", updated.status);
 * ```
 */
export async function updateContactManagerStatus(
  payload: UpdateContactManagerStatusPayload
): Promise<ContactManagerProfile> {
  const res = await apiClient.patch<ContactManagerProfile>(
    `/api/contact-managers/${payload.profileId}/status`,
    { status: payload.status }
  );
  return res.data;
}
