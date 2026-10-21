import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import { User } from '../../types/user';
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import OutcomeAnalyticsCard from '../../components/OutcomeAnalyticsCard';
import { useResponsive } from '../../constants/Layout';

export default function AdminDashboardScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const [userData, apptsData] = await Promise.all([
        userService.getAllUsers(),
        appointmentService.getAppointments(),
      ]);
      setUsers(userData);
      setAppointments(apptsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator dashboard metrics.');
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

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading System Admin Center..." />;
  }

  // Calculate User Breakdown
  const totalUsers = users.length;
  const patientsCount = users.filter((u) => u.role === 'patient').length;
  const doctorsCount = users.filter((u) => u.role === 'doctor').length;
  const therapistsCount = users.filter((u) => u.role === 'therapist').length;
  const receptionistsCount = users.filter((u) => u.role === 'receptionist').length;
  const activeUsersCount = users.filter((u) => u.isActive !== false).length;
  const inactiveUsersCount = users.filter((u) => u.isActive === false).length;

  // Calculate Appointment & Financial Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a) => {
    const dStr = new Date(a.appointment_date).toISOString().split('T')[0];
    return dStr === todayStr && a.status !== 'cancelled';
  });

  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled').length;

  const paidRevenue = appointments.filter((a) => a.isPaid).reduce((acc, a) => acc + (a.cost || 1500), 0);
  const pendingRevenue = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled').reduce((acc, a) => acc + (a.cost || 1500), 0);

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'System Admin'}
        subtitle="Clinic Governance & Operations"
      />

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

        {/* Admin Profile Summary */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarAdmin}>
              <Icon name="admin" size={24} color={Colors.primary} />
            </View>
            <View style={styles.profileTextContainer}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.adminName}>{user?.full_name}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Super Admin</Text>
                </View>
              </View>
              <Text style={styles.adminTitle}>Super Administrator</Text>
              <Text style={styles.adminMeta}>{user?.email} • {totalUsers} Managed Accounts</Text>
            </View>
          </View>
        </Card>

        {/* Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="admin" />

        {/* Top-Level Metric Stats */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="chart" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>User & Operational Analytics</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <StatCard title="Total Accounts" value={totalUsers} icon="users" color={Colors.primary} />
          <StatCard title="Active Accounts" value={activeUsersCount} icon="check" color={Colors.success} />
          <StatCard title="Today's Sessions" value={todayAppts.length} icon="calendar" color={Colors.secondary} />
          <StatCard title="Inactive / Blocked" value={inactiveUsersCount} icon="close" color={Colors.error} />
        </View>

        {/* Financial Revenue Metric Cards */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="card" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Financial & Payment Summary</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/reports')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>Full Report</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsGrid}>
          <StatCard title="Collected Revenue" value={`₹${paidRevenue.toLocaleString('en-IN')}`} icon="card" color={Colors.success} />
          <StatCard title="Pending Billing" value={`₹${pendingRevenue.toLocaleString('en-IN')}`} icon="clock" color={Colors.warning} />
        </View>

        {/* Role Distribution Breakdown */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="users" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Account Breakdown by Role</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/users')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>Manage Users</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Card style={styles.roleCard}>
          <View style={styles.roleRow}>
            <View style={styles.roleIconName}>
              <View style={[styles.roleIconBadge, { backgroundColor: Colors.primary + '12' }]}>
                <Icon name="user" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.roleLabel}>Patients</Text>
            </View>
            <View style={styles.roleCountPill}>
              <Text style={styles.roleValue}>{patientsCount} registered</Text>
            </View>
          </View>

          <View style={styles.roleRow}>
            <View style={styles.roleIconName}>
              <View style={[styles.roleIconBadge, { backgroundColor: Colors.secondary + '18' }]}>
                <Icon name="doctor" size={14} color={Colors.secondary} />
              </View>
              <Text style={styles.roleLabel}>Doctors</Text>
            </View>
            <View style={styles.roleCountPill}>
              <Text style={styles.roleValue}>{doctorsCount} active physicians</Text>
            </View>
          </View>

          <View style={styles.roleRow}>
            <View style={styles.roleIconName}>
              <View style={[styles.roleIconBadge, { backgroundColor: Colors.accent + '18' }]}>
                <Icon name="therapist" size={14} color={Colors.accent} />
              </View>
              <Text style={styles.roleLabel}>Therapists</Text>
            </View>
            <View style={styles.roleCountPill}>
              <Text style={styles.roleValue}>{therapistsCount} certified</Text>
            </View>
          </View>

          <View style={[styles.roleRow, styles.roleRowLast]}>
            <View style={styles.roleIconName}>
              <View style={[styles.roleIconBadge, { backgroundColor: Colors.warning + '18' }]}>
                <Icon name="receptionist" size={14} color={Colors.warning} />
              </View>
              <Text style={styles.roleLabel}>Receptionists</Text>
            </View>
            <View style={styles.roleCountPill}>
              <Text style={styles.roleValue}>{receptionistsCount} desk officers</Text>
            </View>
          </View>
        </Card>

        {/* Appointment Status Analytics */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="calendar" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Appointment Performance</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/appointments')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>Schedule</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Card style={styles.apptCard}>
          <View style={styles.roleRow}>
            <View style={styles.roleIconName}>
              <View style={[styles.roleIconBadge, { backgroundColor: Colors.primary + '12' }]}>
                <Icon name="calendar" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.roleLabel}>Total Bookings</Text>
            </View>
            <Text style={styles.roleValue}>{appointments.length} overall</Text>
          </View>

          <View style={styles.roleRow}>
            <View style={styles.roleIconName}>
              <View style={[styles.roleIconBadge, { backgroundColor: Colors.success + '15' }]}>
                <Icon name="check" size={14} color={Colors.success} />
              </View>
              <Text style={styles.roleLabel}>Completed Sessions</Text>
            </View>
            <Text style={[styles.roleValue, { color: Colors.success }]}>{completedAppts} sessions</Text>
          </View>

          <View style={[styles.roleRow, styles.roleRowLast]}>
            <View style={styles.roleIconName}>
              <View style={[styles.roleIconBadge, { backgroundColor: Colors.error + '15' }]}>
                <Icon name="close" size={14} color={Colors.error} />
              </View>
              <Text style={styles.roleLabel}>Cancelled Bookings</Text>
            </View>
            <Text style={[styles.roleValue, { color: Colors.error }]}>{cancelledAppts} sessions</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarAdmin: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileTextContainer: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminName: {
    ...Typography.h3,
    fontSize: 17,
    color: Colors.text,
  },
  verifiedBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  adminTitle: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  adminMeta: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingHorizontal: 4,
  },
  seeAllText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 12,
  },
  apptCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 12,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  roleRowLast: {
    borderBottomWidth: 0,
  },
  roleIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    ...Typography.bodyMedium,
    fontSize: 13.5,
    color: Colors.text,
  },
  roleCountPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleValue: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
