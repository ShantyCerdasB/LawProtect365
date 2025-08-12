// src/features/contactManagers/AddContactManagerPage.tsx

import React, { useEffect, useState } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import AddModal from '../../components/ModalComponent';
import managementIcon from '@assets/manage_icon_sidebar.png';

import {
  getContactManagers,
  upsertContactManager,
  revokeContactManager,
  updateContactManagerStatus,
  ContactManagerDTO
} from '../../services/contactManagerClient';
import { getUsersByRole, UserByRole } from '../../services/userClient';
import { useAuth } from '../auth/hooks/useAuth';
import { useToast } from '../../components/ToastContext';

/**
 * ProfileRow
 *
 * Extends ContactManagerDTO with a fake `azureAdObjectId` field
 * so that TableComponent can key off of it.
 */
type ProfileRow = ContactManagerDTO & { azureAdObjectId: string };

/**
 * AddContactManagerPage
 *
 * - Lists existing Contact Manager profiles.
 * - Allows Admins to add new CMs by selecting from all other users
 *   (Supervisors, Employees, and non‑role Tenants).
 * - Supports revoking and status updates in‑line.
 */
const AddContactManagerPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast } = useToast();

  // Existing profiles
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Candidates for new CM
  const [candidates, setCandidates] = useState<UserByRole[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Modal state
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title: 'Contact Managers',
    iconSrc: managementIcon,
    iconAlt: 'Contact Managers',
  });

  /** Fetch and wrap all Contact Manager profiles */
  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const items = await getContactManagers();
      if (!Array.isArray(items)) {
        console.error('getContactManagers returned unexpected:', items);
        showToast('Failed to load Contact Managers', 'error');
        return;
      }
      const rows: ProfileRow[] = items.map(p => ({
        ...p,
        azureAdObjectId: p.id,
      }));
      setProfiles(rows);
    } catch (err: any) {
      console.error('fetchProfiles error:', err);
      showToast('Failed to load Contact Managers', 'error');
    } finally {
      setLoadingProfiles(false);
    }
  };

  /** Fetch all Supervisors, Employees, and Tenants excluding those already CMs */
  const fetchCandidates = async (): Promise<void> => {
    setLoadingCandidates(true);
    try {
      const res = await getUsersByRole('Supervisor,Employee,Tenant,Admin', 1, 1000);
      setCandidates(res.users);
    } catch (err: any) {
      console.error('fetchCandidates error:', err);
      showToast('Could not load candidate users', 'error');
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchProfiles();
  }, [initialized]);

  const handleOpenModal = () => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  const handleConfirmAdd = async () => {
    setLoadingProfiles(true);
    try {
      await Promise.all(
        selectedEmails.map(email =>
          upsertContactManager({ email, status: 'Unavailable' })
        )
      );
      setModalOpen(false);
      await fetchProfiles();
      showToast(`${selectedEmails.length} added`, 'success');
    } catch (err: any) {
      console.error('handleConfirmAdd error:', err);
      showToast('Failed to add Contact Managers', 'error');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeContactManager(id);
      showToast('Revoked', 'success');
      await fetchProfiles();
    } catch (err: any) {
      console.error('handleRevoke error:', err);
      showToast('Failed to revoke', 'error');
    }
  };

  const handleStatusChange = async (
    profileId: string,
    status: ProfileRow['status']
  ) => {
    try {
      const updated = await updateContactManagerStatus({ profileId, status });
      const wrapped: ProfileRow = {
        ...updated,
        azureAdObjectId: updated.id,
      };
      setProfiles(ps => ps.map(p => (p.id === profileId ? wrapped : p)));
      showToast('Status updated', 'success');
    } catch (err: any) {
      console.error('handleStatusChange error:', err);
      showToast('Failed to update status', 'error');
    }
  };

  // Columns for existing profiles
  const profileColumns: Column<ProfileRow>[] = [
    { key: 'email', header: 'Email' },
    { key: 'fullName', header: 'Name' },
    {
      key: 'status',
      header: 'Status',
      render: row => (
        <select
          value={row.status}
          onChange={e =>
            handleStatusChange(row.id, e.target.value as ProfileRow['status'])
          }
          className="bg-[var(--color-primary-light)] text-white py-1 px-2 rounded"
        >
          {[
            'Unavailable',
            'Available',
            'OnBreak',
            'OnAnotherTask',
          ].map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: row => new Date(row.createdAt).toLocaleString(),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: row => new Date(row.updatedAt).toLocaleString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => <TrashButton onClick={() => handleRevoke(row.id)} />,
    },
  ];

  // Columns for picking new CMs
  const candidateColumns: Column<UserByRole>[] = [
    {
      key: 'azureAdObjectId',
      header: 'Select',
      render: row => (
        <input
          type="checkbox"
          checked={selectedEmails.includes(row.email)}
          onChange={e =>
            setSelectedEmails(prev =>
              e.target.checked
                ? [...prev, row.email]
                : prev.filter(x => x !== row.email)
            )
          }
          className="appearance-none w-5 h-5 rounded border-2 border-white checked:bg-[var(--color-secondary)]"
        />
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'role', header: 'Current Role' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<ProfileRow>
        columns={profileColumns}
        data={profiles}
        pageSize={10}
        loading={loadingProfiles}
        loadingAction="Loading managers"
        addButton={
          <AddButton label="Add Contact Manager" onClick={handleOpenModal} />
        }
      />

      <AddModal
        open={isModalOpen}
        title="Add Contact Managers"
        iconSrc={managementIcon}
        iconAlt="Managers"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLabel="Add Selected"
      >
        <TableComponent<UserByRole>
          columns={candidateColumns}
          data={candidates}
          pageSize={8}
          loading={loadingCandidates}
          loadingAction="Loading candidates"
          addButton={null}
        />
      </AddModal>
    </div>
  );
};

export default AddContactManagerPage;
