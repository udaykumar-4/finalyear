import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Stethoscope,
  Activity,
  Building2,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { User, UserRole } from '../../types/user';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('patient');
  const [editDesignation, setEditDesignation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('password123');
  const [createRole, setCreateRole] = useState<UserRole>('doctor');
  const [createDesignation, setCreateDesignation] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (target: User) => {
    const nextStatus = target.isActive === false ? true : false;
    try {
      await userService.updateUserStatus(target._id, nextStatus);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (target: User) => {
    if (!window.confirm(`Are you sure you want to permanently delete account "${target.full_name}"?`)) {
      return;
    }
    try {
      await userService.deleteUserAdmin(target._id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const handleOpenEdit = (target: User) => {
    setEditingUser(target);
    setEditName(target.full_name);
    setEditRole(target.role);
    setEditDesignation(target.designation || '');
    setEditPhone(target.phone || '');
    setModalError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingEdit(true);
    setModalError(null);
    try {
      await userService.updateUserAdmin(editingUser._id, {
        full_name: editName,
        role: editRole,
        designation: editDesignation || undefined,
        phone: editPhone || undefined,
      });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setModalError(null);
    try {
      await authService.register({
        full_name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
        designation: createDesignation || undefined,
        phone: createPhone || undefined,
      });
      setIsCreateOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreateDesignation('');
      setCreatePhone('');
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user account.');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.designation && u.designation.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            User Management Directory
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Manage clinic clinicians, therapists, front desk personnel, and patient rosters
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setIsCreateOpen(true);
            setModalError(null);
          }}
          leftIcon={<UserPlus size={16} />}
        >
          Add New Account
        </Button>
      </div>

      {error && (
        <div
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {['all', 'doctor', 'therapist', 'receptionist', 'patient', 'admin'].map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  style={{
                    padding: '0.4rem 0.875rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: `1px solid ${isSelected ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                    backgroundColor: isSelected ? 'var(--color-emerald)' : 'var(--color-white)',
                    color: isSelected ? 'var(--color-white)' : 'var(--color-slate-600)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {role === 'all' ? 'All Roles' : `${role}s`}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>
      </Card>

      {/* Users Data Table */}
      <Card padding="none">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role & Designation</th>
                <th>Contact</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isActive = u.isActive !== false;
                return (
                  <tr key={u._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-slate-900)' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{u.email}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                          {u.designation || '-'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)' }}>
                        {u.phone || 'No phone recorded'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: isActive ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                          color: isActive ? 'var(--color-success)' : 'var(--color-error)',
                          border: `1px solid ${isActive ? 'var(--color-success-border)' : 'var(--color-error-border)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        {isActive ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit user details"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteUser(u)}
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No matching users found in directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-slate-200)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Edit Account Details
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} style={{ color: 'var(--color-slate-400)' }}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-error-bg)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Full Legal Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                  System Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-slate-200)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="doctor">Doctor</option>
                  <option value="therapist">Therapist</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="patient">Patient</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <Input
                label="Clinical Designation / Title"
                placeholder="e.g. Senior Panchakarma Physician"
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
              />

              <Input
                label="Phone Contact"
                placeholder="+91 98765 43210"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSavingEdit}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-slate-200)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Create Clinical or Patient Account
              </h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} style={{ color: 'var(--color-slate-400)' }}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-error-bg)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Full Name"
                placeholder="Dr. Rajesh Varma"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="staff@ayursutra.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
              />

              <Input
                label="Initial Password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
              />

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                  Role Assignment
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-slate-200)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="doctor">Doctor</option>
                  <option value="therapist">Therapist</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="patient">Patient</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <Input
                label="Clinical Designation"
                placeholder="e.g. Senior Panchakarma Therapist"
                value={createDesignation}
                onChange={(e) => setCreateDesignation(e.target.value)}
              />

              <Input
                label="Phone Contact"
                placeholder="+91 98765 00000"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isCreating}>
                  Provision Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
