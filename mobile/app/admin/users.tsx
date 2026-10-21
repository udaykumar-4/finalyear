import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import authService from '../../services/authService';
import { User, UserRole } from '../../types/user';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Icon, { IconName } from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { useResponsive } from '../../constants/Layout';

export default function AdminUsersScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('patient');
  const [editDesignation, setEditDesignation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('Default123');
  const [createRole, setCreateRole] = useState<UserRole>('doctor');
  const [createDesignation, setCreateDesignation] = useState('');
  const [creating, setCreating] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleStatus = async (targetUser: User) => {
    const nextStatus = targetUser.isActive === false ? true : false;
    setActionUserId(targetUser._id);
    try {
      await userService.updateUserStatus(targetUser._id, nextStatus);
      Alert.alert('Status Updated', `User "${targetUser.full_name}" is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change user status.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteUser = (targetUser: User) => {
    if (targetUser._id === user?._id) {
      Alert.alert('Action Denied', 'You cannot delete your own admin account.');
      return;
    }

    Alert.alert(
      'Confirm Account Deletion',
      `Are you sure you want to permanently delete account "${targetUser.full_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionUserId(targetUser._id);
            try {
              await userService.deleteUser(targetUser._id);
              Alert.alert('Account Deleted', `User "${targetUser.full_name}" deleted.`);
              fetchData();
            } catch (err: any) {
              Alert.alert('Deletion Error', err.message || 'Failed to delete user account.');
            } finally {
              setActionUserId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditName(targetUser.full_name);
    setEditRole(targetUser.role);
    setEditDesignation(targetUser.designation || '');
    setEditPhone(targetUser.phone || '');
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser || !editName.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }

    setSavingEdit(true);
    try {
      await userService.updateUser(editingUser._id, {
        full_name: editName.trim(),
        role: editRole,
        designation: editDesignation.trim() || undefined,
        phone: editPhone.trim() || undefined,
      });

      Alert.alert('User Updated', 'Account details updated successfully.');
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Error saving user updates.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createName.trim() || !createEmail.trim() || !createPassword) {
      Alert.alert('Validation Error', 'Please complete Name, Email, and Password.');
      return;
    }

    setCreating(true);
    try {
      await authService.register({
        full_name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
        designation: createDesignation.trim() || undefined,
      });

      Alert.alert('User Created', `New ${createRole.toUpperCase()} account created successfully.`);
      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Error creating new user.');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading User Management Directory..." />;
  }

  const rolesList: string[] = ['all', 'admin', 'doctor', 'therapist', 'patient', 'receptionist'];

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <View style={styles.container}>
      <Header title="User Management" subtitle="System Account Directory & Controls" showLogout={true} />

      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <Button
          title="+ Create New Account"
          onPress={() => setShowCreateModal(true)}
          variant="primary"
          size="medium"
          style={{ width: '100%', marginBottom: 10 }}
        />
        <Input
          placeholder="Search users by name, email, or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* Role Filter Chips */}
      <View style={[styles.filterWrapper, { maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.roleFilterRow}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
        >
          {rolesList.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleChip, selectedRoleFilter === r && styles.activeRoleChip]}
              onPress={() => setSelectedRoleFilter(r)}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleChipText, selectedRoleFilter === r && styles.activeRoleChipText]}>
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomContentPadding,
            maxWidth: containerMaxWidth,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {filteredUsers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="users" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Accounts Found</Text>
            <Text style={styles.emptyDesc}>No user accounts match the search or role criteria.</Text>
          </Card>
        ) : (
          filteredUsers.map((u) => {
            const isActive = u.isActive !== false;
            return (
              <Card key={u._id} style={styles.userCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.userRow}>
                    <View style={styles.userAvatar}>
                      <Icon name={getRoleIcon(u.role)} size={14} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.full_name}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeBg(u.role) }]}>
                    <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(u.role) }]}>
                      {u.role.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {u.designation ? <Text style={styles.userMeta}>Title: {u.designation}</Text> : null}
                <Text style={styles.userMeta}>Phone: {u.phone || 'N/A'}</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Account Status: </Text>
                  <View style={[styles.statusChip, { backgroundColor: isActive ? Colors.success + '15' : Colors.error + '15' }]}>
                    <Text style={[styles.statusChipText, { color: isActive ? Colors.success : Colors.error }]}>
                      {isActive ? 'ACTIVE' : 'INACTIVE / BLOCKED'}
                    </Text>
                  </View>
                </View>

                {/* Admin Controls Action Row */}
                <View style={styles.actionRow}>
                  <Button
                    title="Edit"
                    onPress={() => handleOpenEditModal(u)}
                    size="small"
                    variant="outline"
                    style={{ marginRight: 6, minWidth: 64 }}
                  />

                  <Button
                    title={isActive ? 'Deactivate' : 'Activate'}
                    onPress={() => handleToggleStatus(u)}
                    loading={actionUserId === u._id}
                    size="small"
                    variant={isActive ? 'outline' : 'primary'}
                    style={{ marginRight: 6, minWidth: 92 }}
                  />

                  <Button
                    title="Delete"
                    onPress={() => handleDeleteUser(u)}
                    loading={actionUserId === u._id}
                    size="small"
                    variant="danger"
                    style={{ minWidth: 70 }}
                  />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          visible={!!editingUser}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Account Details</Text>
                <TouchableOpacity
                  onPress={() => setEditingUser(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                <Input
                  label="Full Name"
                  value={editName}
                  onChangeText={setEditName}
                />

                <Text style={styles.selectLabel}>Select Role:</Text>
                <View style={styles.roleBtnGroup}>
                  {(['admin', 'doctor', 'therapist', 'patient', 'receptionist'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleSelectChip, editRole === role && styles.activeRoleSelectChip]}
                      onPress={() => setEditRole(role)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.roleSelectChipText, editRole === role && styles.activeRoleSelectChipText]}>
                        {role.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Designation / Specialty"
                  placeholder="e.g. Senior Physician"
                  value={editDesignation}
                  onChangeText={setEditDesignation}
                />

                <Input
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  keyboardType="phone-pad"
                  value={editPhone}
                  onChangeText={setEditPhone}
                />

                <Button
                  title="Save Account Changes"
                  onPress={handleSaveUserEdit}
                  loading={savingEdit}
                  style={{ marginTop: 12 }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New User Account</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 450 }}>
              <Input
                label="Full Name"
                placeholder="e.g. Dr. Anand Sharma"
                value={createName}
                onChangeText={setCreateName}
              />

              <Input
                label="Email Address"
                placeholder="anand@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={createEmail}
                onChangeText={setCreateEmail}
              />

              <Input
                label="Password"
                placeholder="Default123"
                value={createPassword}
                onChangeText={setCreatePassword}
              />

              <Text style={styles.selectLabel}>Assign Role:</Text>
              <View style={styles.roleBtnGroup}>
                {(['admin', 'doctor', 'therapist', 'patient', 'receptionist'] as UserRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleSelectChip, createRole === role && styles.activeRoleSelectChip]}
                    onPress={() => setCreateRole(role)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleSelectChipText, createRole === role && styles.activeRoleSelectChipText]}>
                      {role.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Designation / Specialty (Optional)"
                placeholder="e.g. Lead Doctor"
                value={createDesignation}
                onChangeText={setCreateDesignation}
              />

              <Button
                title="Create User Account"
                onPress={handleCreateUser}
                loading={creating}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getRoleIcon = (role: UserRole): IconName => {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'doctor':
      return 'doctor';
    case 'therapist':
      return 'therapist';
    case 'receptionist':
      return 'receptionist';
    case 'patient':
    default:
      return 'user';
  }
};

const getRoleBadgeBg = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return Colors.primary + '18';
    case 'doctor':
      return Colors.secondary + '18';
    case 'therapist':
      return Colors.accent + '18';
    case 'receptionist':
      return Colors.warning + '18';
    case 'patient':
    default:
      return Colors.surface;
  }
};

const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return Colors.primary;
    case 'doctor':
      return Colors.secondary;
    case 'therapist':
      return Colors.accent;
    case 'receptionist':
      return Colors.warning;
    case 'patient':
    default:
      return Colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingTop: 12,
  },
  filterWrapper: {
    paddingVertical: 8,
  },
  roleFilterRow: {
    flexGrow: 0,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    minHeight: 34,
    justifyContent: 'center',
  },
  activeRoleChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeRoleChipText: {
    color: Colors.white,
  },
  scrollContent: {
    paddingTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.text,
  },
  emptyDesc: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 5,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    ...Typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
  },
  userMeta: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  statusLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusChipText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 35, 24, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  modalTitle: {
    ...Typography.h3,
    fontSize: 17,
    color: Colors.text,
  },
  selectLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    marginTop: 4,
  },
  roleBtnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  roleSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeRoleSelectChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleSelectChipText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeRoleSelectChipText: {
    color: Colors.white,
  },
});
