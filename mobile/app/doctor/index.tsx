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
import feedbackService from '../../services/feedbackService';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import { Feedback } from '../../types/feedback';
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

export default function DoctorDashboardScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth, isSmallDevice } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'doctor')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, rxData, fbData] = await Promise.all([
        appointmentService.getAppointments({ doctorId: user._id }),
        prescriptionService.getByDoctorId(user._id),
        feedbackService.getDoctorFeedback(),
      ]);
      setAppointments(apptsData);
      setPrescriptions(rxData);
      setFeedbackList(fbData);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'doctor') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Doctor Consultation Hub..." />;
  }

  // Calculate Metrics using shared timezone-safe date utils
  const todayAppts = filterTodayAppointments(appointments, true);
  const upcomingAppts = filterUpcomingAppointments(appointments, true);

  const activeTreatments = prescriptions.filter((p) => p.status === 'in-progress').length;
  const completedTreatments = prescriptions.filter((p) => p.status === 'completed').length;

  // Average Rating
  const validRatings = feedbackList.map((f) => f.doctorRating || f.overallRating).filter(Boolean);
  const avgRating = validRatings.length > 0
    ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1)
    : '5.0';

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'Dr. Physician'}
        subtitle={user?.designation || 'Senior Ayurvedic Physician'}
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

        {/* Doctor Botanical Profile Banner */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarDoc}>
              <Icon name="doctor" size={24} color={Colors.primary} />
            </View>
            <View style={styles.profileTextContainer}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.docName}>{user?.full_name}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Physician</Text>
                </View>
              </View>
              <Text style={styles.docSpecialty}>{user?.designation || 'Senior Ayurvedic Physician'}</Text>
              <View style={styles.contactRow}>
                <View style={styles.contactItem}>
                  <Icon name="mail" size={11} color={Colors.textSecondary} />
                  <Text style={styles.docMeta} numberOfLines={1}>{user?.email}</Text>
                </View>
                {user?.phone ? (
                  <View style={styles.contactItem}>
                    <Icon name="phone" size={11} color={Colors.textSecondary} />
                    <Text style={styles.docMeta}>{user?.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Card>

        {/* Key Metrics Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Today's Consults" value={todayAppts.length} icon="calendar" color={Colors.primary} />
          <StatCard title="Active Treatments" value={activeTreatments} icon="leaf" color={Colors.warning} />
          <StatCard title="Completed Plans" value={completedTreatments} icon="check" color={Colors.success} />
          <StatCard title="Patient Rating" value={avgRating} icon="star" color={Colors.secondary} />
        </View>

        {/* Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="doctor" />

        {/* Today's Consultations Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="clock" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Today's Consultations ({todayAppts.length})</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/doctor/appointments')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {todayAppts.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No consultations scheduled for today.</Text>
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
              <View style={styles.detailsRow}>
                <Text style={styles.cardDetail}>
                  <Text style={styles.detailLabel}>Treatment: </Text>
                  {item.treatment}
                </Text>
                <View style={[styles.statusChip, { backgroundColor: item.status === 'completed' ? Colors.success + '15' : Colors.primary + '12' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'completed' ? Colors.success : Colors.primary }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Upcoming Consultations Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="calendar" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          </View>
        </View>
        {upcomingAppts.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No upcoming appointments scheduled.</Text>
          </Card>
        ) : (
          upcomingAppts.slice(0, 3).map((item) => (
            <Card key={item._id} style={styles.upcomingCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatarPill}>
                    <Icon name="user" size={12} color={Colors.textSecondary} />
                  </View>
                  <Text style={styles.patientNameSmall}>
                    {(item.patientId && typeof item.patientId === 'object') ? item.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <Text style={styles.dateBadge}>
                  {new Date(item.appointment_date).toLocaleDateString()} • {item.appointment_time}
                </Text>
              </View>
              <Text style={styles.cardDetailSmall}>Service: {item.treatment}</Text>
            </Card>
          ))
        )}

        {/* Patient Feedback Summary */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="star" size={15} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Recent Patient Feedback</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/doctor/more')}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <Icon name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        {feedbackList.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No feedback reviews submitted yet.</Text>
          </Card>
        ) : (
          feedbackList.slice(0, 2).map((fb) => (
            <Card key={fb._id} style={styles.feedbackCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatarPill}>
                    <Icon name="user" size={12} color={Colors.textSecondary} />
                  </View>
                  <Text style={styles.feedbackAuthor}>
                    {(fb.patientId && typeof fb.patientId === 'object') ? fb.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <View style={styles.starRow}>
                  <Icon name="star" size={13} color={Colors.secondary} />
                  <Text style={styles.starText}>{fb.doctorRating || fb.overallRating} / 5</Text>
                </View>
              </View>
              {fb.doctorFeedback ? (
                <Text style={styles.feedbackText}>"{fb.doctorFeedback}"</Text>
              ) : fb.overallFeedback ? (
                <Text style={styles.feedbackText}>"{fb.overallFeedback}"</Text>
              ) : null}
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
  avatarDoc: {
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
  docName: {
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
  docSpecialty: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docMeta: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
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
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 14,
  },
  feedbackAuthor: {
    ...Typography.bodyMedium,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
  },
  feedbackText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 17,
  },
});
