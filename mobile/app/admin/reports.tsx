import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
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
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { useResponsive } from '../../constants/Layout';

export default function AdminReportsScreen() {
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
      setError(err.message || 'Failed to aggregate administrative reports.');
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

  const handleExportSummary = () => {
    Alert.alert(
      'Administrative Report Generated',
      `System Audit Summary:\nTotal Accounts: ${users.length}\nTotal Appointments: ${appointments.length}\nTotal Revenue Collected: ₹${paidRevenue.toLocaleString('en-IN')}`
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Aggregating System Reports..." />;
  }

  // Calculations
  const totalUsers = users.length;
  const patientsCount = users.filter((u) => u.role === 'patient').length;
  const doctorsCount = users.filter((u) => u.role === 'doctor').length;
  const therapistsCount = users.filter((u) => u.role === 'therapist').length;
  const receptionistsCount = users.filter((u) => u.role === 'receptionist').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const totalAppts = appointments.length;
  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled').length;
  const completionRate = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;

  const paidRevenue = appointments.filter((a) => a.isPaid).reduce((acc, a) => acc + (a.cost || 1500), 0);
  const pendingRevenue = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled').reduce((acc, a) => acc + (a.cost || 1500), 0);

  return (
    <View style={styles.container}>
      <Header title="Administrative Reports" subtitle="System Audit & Financial Summary" showLogout={true} />

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

        {/* Action Header */}
        <Card style={styles.actionCard}>
          <View style={styles.actionRow}>
            <View style={styles.actionIconBadge}>
              <Icon name="chart" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.actionTitle}>System Analytics Summary</Text>
              <Text style={styles.actionSub}>Aggregated data across all 5 system roles.</Text>
            </View>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportSummary}
              activeOpacity={0.8}
            >
              <Text style={styles.exportBtnText}>Export Audit</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Financial Analytics */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="card" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Revenue & Billing Performance</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Total Collected Revenue:</Text>
            <Text style={[styles.val, { color: Colors.success }]}>₹{paidRevenue.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Total Pending Receivables:</Text>
            <Text style={[styles.val, { color: Colors.warning }]}>₹{pendingRevenue.toLocaleString('en-IN')}</Text>
          </View>
          <ProgressBar
            progress={paidRevenue + pendingRevenue > 0 ? (paidRevenue / (paidRevenue + pendingRevenue)) * 100 : 100}
            label={`Collection Efficiency (${Math.round(paidRevenue + pendingRevenue > 0 ? (paidRevenue / (paidRevenue + pendingRevenue)) * 100 : 100)}%)`}
            color={Colors.success}
            height={10}
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* Session Completion Performance */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="calendar" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Consultation Completion Performance</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Total Scheduled Sessions:</Text>
            <Text style={styles.val}>{totalAppts}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Completed Sessions:</Text>
            <Text style={[styles.val, { color: Colors.success }]}>{completedAppts}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Cancelled Sessions:</Text>
            <Text style={[styles.val, { color: Colors.error }]}>{cancelledAppts}</Text>
          </View>
          <ProgressBar
            progress={completionRate}
            label={`Completion Rate (${completionRate}%)`}
            color={Colors.primary}
            height={10}
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* User Account Allocation */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="users" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Account Allocation by Role</Text>
          </View>
          <ProgressBar
            progress={totalUsers > 0 ? (patientsCount / totalUsers) * 100 : 0}
            label={`Patients: ${patientsCount} accounts (${Math.round(totalUsers > 0 ? (patientsCount / totalUsers) * 100 : 0)}%)`}
            color={Colors.primary}
            height={9}
            style={{ marginBottom: 10 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (doctorsCount / totalUsers) * 100 : 0}
            label={`Doctors: ${doctorsCount} accounts (${Math.round(totalUsers > 0 ? (doctorsCount / totalUsers) * 100 : 0)}%)`}
            color={Colors.secondary}
            height={9}
            style={{ marginBottom: 10 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (therapistsCount / totalUsers) * 100 : 0}
            label={`Therapists: ${therapistsCount} accounts (${Math.round(totalUsers > 0 ? (therapistsCount / totalUsers) * 100 : 0)}%)`}
            color={Colors.accent}
            height={9}
            style={{ marginBottom: 10 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (receptionistsCount / totalUsers) * 100 : 0}
            label={`Receptionists: ${receptionistsCount} accounts (${Math.round(totalUsers > 0 ? (receptionistsCount / totalUsers) * 100 : 0)}%)`}
            color={Colors.warning}
            height={9}
            style={{ marginBottom: 10 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (adminCount / totalUsers) * 100 : 0}
            label={`Administrators: ${adminCount} accounts`}
            color={Colors.textSecondary}
            height={9}
          />
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
    paddingTop: 10,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
    marginBottom: 10,
    padding: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    ...Typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  actionSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  exportBtnText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 5,
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 14.5,
    color: Colors.text,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  val: {
    ...Typography.metric,
    fontSize: 13.5,
    color: Colors.text,
  },
});
