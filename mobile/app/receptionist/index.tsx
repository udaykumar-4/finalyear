import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { filterTodayAppointments, filterUpcomingAppointments } from '../../utils/appointmentDateUtils';
import { useResponsive } from '../../constants/Layout';

export default function ReceptionistDashboardScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'receptionist')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, patientsData] = await Promise.all([
        appointmentService.getAppointments(),
        userService.getAllUsers('patient'),
      ]);
      setAppointments(apptsData);
      setPatientCount(patientsData.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load front-desk receptionist dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'receptionist') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Front-Desk Operations Hub..." />;
  }

  // Calculate Metrics using shared timezone-safe date utils
  const todayAppts = filterTodayAppointments(appointments, true);
  const upcomingAppts = filterUpcomingAppointments(appointments, true);

  const pendingPayments = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled');
  const completedAppts = appointments.filter((a) => a.status === 'completed');

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'Front Desk'}
        subtitle="Operations & Patient Reception"
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

        {/* Receptionist Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarRec}>
              <Icon name="receptionist" size={24} color={Colors.primary} />
            </View>
            <View style={styles.profileTextContainer}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.recName}>{user?.full_name}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Front Desk</Text>
                </View>
              </View>
              <Text style={styles.recTitle}>{user?.designation || 'Front-Desk Officer'}</Text>
              <Text style={styles.recMeta}>AyurSutra Clinic Desk • {user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Metrics Overview Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Today's Schedule" value={todayAppts.length} icon="calendar" color={Colors.primary} />
          <StatCard title="Pending Payments" value={pendingPayments.length} icon="card" color={Colors.warning} />
          <StatCard title="Completed" value={completedAppts.length} icon="check" color={Colors.success} />
          <StatCard title="Registered Patients" value={patientCount} icon="users" color={Colors.secondary} />
        </View>

        {/* Quick Operational Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="sparkle" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Front-Desk Actions</Text>
          </View>
        </View>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/patients')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: Colors.primary + '12' }]}>
              <Icon name="user" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickTitle}>Register Walk-In</Text>
            <Text style={styles.quickSubtitle}>Add new patient record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/appointments')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: Colors.secondary + '18' }]}>
              <Icon name="calendar" size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.quickTitle}>Book Appointment</Text>
            <Text style={styles.quickSubtitle}>Schedule slot & doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/payments')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: Colors.warning + '18' }]}>
              <Icon name="card" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.quickTitle}>Settle Payments</Text>
            <Text style={styles.quickSubtitle}>Billing & receipts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/appointments')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: Colors.accent + '18' }]}>
              <Icon name="clock" size={20} color={Colors.accent} />
            </View>
            <Text style={styles.quickTitle}>Master Schedule</Text>
            <Text style={styles.quickSubtitle}>Day agenda review</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="clock" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Today's Clinic Appointments ({todayAppts.length})</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/receptionist/appointments')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {todayAppts.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No appointments scheduled for today.</Text>
          </Card>
        ) : (
          todayAppts.map((item) => (
            <Card key={item._id} style={styles.todayCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatarPill}>
                    <Icon name="user" size={14} color={Colors.primary} />
                  </View>
                  <Text style={styles.patientName}>
                    {(item.patientId && typeof item.patientId === 'object') ? item.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <View style={styles.timeBadgeContainer}>
                  <Text style={styles.timeBadge}>{item.appointment_time}</Text>
                </View>
              </View>
              <Text style={styles.cardDetail}>
                <Text style={styles.detailLabel}>Treatment: </Text>
                {item.treatment}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.docText}>
                  Doctor: {(item.doctorId && typeof item.doctorId === 'object') ? item.doctorId.full_name : 'N/A'}
                </Text>
                <View style={[styles.paidChip, { backgroundColor: item.isPaid ? Colors.success + '15' : Colors.warning + '18' }]}>
                  <Text style={[styles.paidText, { color: item.isPaid ? Colors.success : Colors.warning }]}>
                    {item.isPaid ? 'PAID' : 'UNPAID'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Pending Payments Overview */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="card" size={15} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Unpaid Bills ({pendingPayments.length})</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/receptionist/payments')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>Settle Bills</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {pendingPayments.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>All scheduled appointments are fully settled.</Text>
          </Card>
        ) : (
          pendingPayments.slice(0, 3).map((item) => (
            <Card key={item._id} style={styles.unpaidCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatarPill}>
                    <Icon name="user" size={14} color={Colors.warning} />
                  </View>
                  <Text style={styles.unpaidPatient}>
                    {(item.patientId && typeof item.patientId === 'object') ? item.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <View style={styles.costBadgeContainer}>
                  <Text style={styles.costBadge}>₹{item.cost || 1500}</Text>
                </View>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.cardDetail}>
                  <Text style={styles.detailLabel}>Treatment: </Text>
                  {item.treatment}
                </Text>
                <Text style={styles.pendingHint}>Payment Pending</Text>
              </View>
            </Card>
          ))
        )}
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
  avatarRec: {
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
  recName: {
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
  recTitle: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  recMeta: {
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 108,
    justifyContent: 'center',
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    ...Typography.bodyMedium,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
  },
  quickSubtitle: {
    ...Typography.caption,
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 14,
  },
  unpaidCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.warning,
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  patientAvatarPill: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    ...Typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  unpaidPatient: {
    ...Typography.bodyMedium,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.text,
  },
  timeBadgeContainer: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  timeBadge: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  costBadgeContainer: {
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  costBadge: {
    ...Typography.metric,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.warning,
  },
  cardDetail: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.text,
  },
  detailLabel: {
    color: Colors.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingHint: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '70',
  },
  docText: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  paidChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
  },
  emptyText: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
