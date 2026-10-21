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
import prescriptionService from '../../services/prescriptionService';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import OutcomeAnalyticsCard from '../../components/OutcomeAnalyticsCard';
import { filterTodayAppointments, filterUpcomingAppointments } from '../../utils/appointmentDateUtils';
import { useResponsive } from '../../constants/Layout';

export default function TherapistHomeScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'therapist')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, rxData] = await Promise.all([
        appointmentService.getAppointments({ therapistId: user._id }),
        prescriptionService.getByTherapistId(user._id),
      ]);
      setAppointments(apptsData);
      setPrescriptions(rxData);
    } catch (err: any) {
      setError(err.message || 'Failed to load therapist home dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'therapist') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Panchakarma Therapy Queue..." />;
  }

  // Filter Session Metrics using shared timezone-safe date utils
  const todaySessions = filterTodayAppointments(appointments, true);
  const upcomingSessions = filterUpcomingAppointments(appointments, true);

  const activeTreatments = prescriptions.filter((p) => p.status === 'in-progress');
  const completedTreatments = prescriptions.filter((p) => p.status === 'completed');

  // Stats calculation
  const totalAssignedPatients = new Set(
    prescriptions.map((p) => ((p.patientId && typeof p.patientId === 'object') ? p.patientId._id : p.patientId))
  ).size;
  const completedSessionsToday = todaySessions.filter((s) => s.status === 'completed').length;
  const pendingSessionsToday = todaySessions.length - completedSessionsToday;

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'Therapist'}
        subtitle={user?.designation || 'Certified Panchakarma Therapist'}
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

        {/* Therapist Botanical Summary Profile Banner */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarTherapist}>
              <Icon name="therapist" size={24} color={Colors.primary} />
            </View>
            <View style={styles.profileTextContainer}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.therapistName}>{user?.full_name}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Therapist</Text>
                </View>
              </View>
              <Text style={styles.therapistTitle}>{user?.designation || 'Certified Panchakarma Therapist'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.therapistMeta}>
                  Assigned Patients: <Text style={styles.metaBold}>{totalAssignedPatients}</Text> • Active Plans: <Text style={styles.metaBold}>{activeTreatments.length}</Text>
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Session & Treatment Metric Cards */}
        <View style={styles.statsGrid}>
          <StatCard title="Today's Sessions" value={todaySessions.length} icon="calendar" color={Colors.primary} />
          <StatCard title="Pending Today" value={pendingSessionsToday} icon="clock" color={Colors.warning} />
          <StatCard title="Active Protocols" value={activeTreatments.length} icon="treatment" color={Colors.accent} />
          <StatCard title="Completed Plans" value={completedTreatments.length} icon="check" color={Colors.success} />
        </View>

        {/* Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="therapist" />

        {/* Today's Therapy Sessions Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="clock" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Today's Sessions ({todaySessions.length})</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/therapist/schedule')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>View Schedule</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {todaySessions.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No therapy sessions scheduled for today.</Text>
          </Card>
        ) : (
          todaySessions.map((session) => (
            <Card key={session._id} style={styles.todayCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatarPill}>
                    <Icon name="user" size={14} color={Colors.primary} />
                  </View>
                  <Text style={styles.patientName}>
                    {(session.patientId && typeof session.patientId === 'object') ? session.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <View style={styles.timeBadgeContainer}>
                  <Text style={styles.timeBadge}>{session.appointment_time}</Text>
                </View>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.cardDetail}>
                  <Text style={styles.detailLabel}>Therapy: </Text>
                  {session.treatment}
                </Text>
                <View style={[styles.statusChip, { backgroundColor: session.status === 'completed' ? Colors.success + '15' : Colors.primary + '12' }]}>
                  <Text style={[styles.statusText, { color: session.status === 'completed' ? Colors.success : Colors.primary }]}>
                    {session.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Upcoming Sessions Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="calendar" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Upcoming Therapy Sessions</Text>
          </View>
        </View>

        {upcomingSessions.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No upcoming therapy sessions scheduled.</Text>
          </Card>
        ) : (
          upcomingSessions.slice(0, 3).map((session) => (
            <Card key={session._id} style={styles.upcomingCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatarPill}>
                    <Icon name="user" size={12} color={Colors.textSecondary} />
                  </View>
                  <Text style={styles.patientNameSmall}>
                    {(session.patientId && typeof session.patientId === 'object') ? session.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <Text style={styles.dateBadge}>
                  {new Date(session.appointment_date).toLocaleDateString()} • {session.appointment_time}
                </Text>
              </View>
              <Text style={styles.cardDetailSmall}>Therapy: {session.treatment}</Text>
            </Card>
          ))
        )}

        {/* Active Panchakarma Treatments Overview */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="treatment" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Active Treatment Protocols</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/therapist/treatments')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>Manage Progress</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {activeTreatments.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No active Panchakarma treatments assigned.</Text>
          </Card>
        ) : (
          activeTreatments.slice(0, 2).map((rx) => (
            <Card key={rx._id} style={styles.rxCard}>
              <View style={styles.cardHeader}>
                <View style={styles.rxTitleRow}>
                  <Icon name="treatment" size={14} color={Colors.primary} />
                  <Text style={styles.rxTitle}>{rx.treatment}</Text>
                </View>
                <View style={styles.progressBadge}>
                  <Text style={styles.rxProgressText}>{rx.progressCompleted} / {rx.duration} sessions</Text>
                </View>
              </View>
              <Text style={styles.rxPatient}>
                Patient: {(rx.patientId && typeof rx.patientId === 'object') ? rx.patientId.full_name : 'Patient'}
              </Text>
              <Text style={styles.rxDoctor}>
                Doctor: {(rx.doctorId && typeof rx.doctorId === 'object') ? rx.doctorId.full_name : 'Prescribing Doctor'}
              </Text>
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
  avatarTherapist: {
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
  therapistName: {
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
  therapistTitle: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  metaRow: {
    marginTop: 4,
  },
  therapistMeta: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metaBold: {
    fontWeight: '700',
    color: Colors.text,
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
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 14,
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 12,
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
  patientNameSmall: {
    ...Typography.bodyMedium,
    fontSize: 13.5,
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
  dateBadge: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardDetail: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.text,
  },
  detailLabel: {
    color: Colors.textSecondary,
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  cardDetailSmall: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
  rxCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 14,
  },
  rxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  rxTitle: {
    ...Typography.bodyMedium,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.text,
  },
  progressBadge: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rxProgressText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  rxPatient: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  rxDoctor: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
