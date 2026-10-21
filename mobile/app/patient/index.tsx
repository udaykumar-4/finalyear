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
import userService from '../../services/userService';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import { User } from '../../types/user';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import OutcomeAnalyticsCard from '../../components/OutcomeAnalyticsCard';
import AIChatbotModal from '../../components/AIChatbotModal';
import PatientTreatmentRecommendationModal from '../../components/PatientTreatmentRecommendationModal';
import PrakritiDashboardCard from '../../components/PrakritiDashboardCard';
import prakritiService from '../../services/prakritiService';
import { PrakritiAssessmentRecord } from '../../types/prakriti';
import { filterTodayAppointments, filterUpcomingAppointments } from '../../utils/appointmentDateUtils';
import { useResponsive } from '../../constants/Layout';

export default function PatientHomeScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [latestPrakriti, setLatestPrakriti] = useState<PrakritiAssessmentRecord | null>(null);
  const [assignedDoctor, setAssignedDoctor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Modal states
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'patient')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, rxData, prakritiData] = await Promise.all([
        appointmentService.getAppointments({ patientId: user._id }),
        prescriptionService.getByPatientId(user._id),
        prakritiService.getLatestAssessment().catch(() => null),
      ]);
      setAppointments(apptsData);
      setPrescriptions(rxData);
      setLatestPrakriti(prakritiData);

      // Fetch assigned doctor if exists
      const docId = typeof user.assignedDoctor === 'object' ? (user.assignedDoctor as any)?._id : user.assignedDoctor;
      if (docId) {
        try {
          const docData = await userService.getUserById(docId);
          setAssignedDoctor(docData);
        } catch {
          // Non-critical
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load patient dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?._id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading Your Healing Sanctuary..." />;
  }

  // Active Panchakarma Treatment
  const activeRx = prescriptions.find((p) => p.status === 'in-progress') || prescriptions[0];
  const doctorName = typeof activeRx?.doctorId === 'object' ? activeRx.doctorId.full_name : assignedDoctor?.full_name || 'Assigned Physician';
  const therapistName = typeof activeRx?.therapistId === 'object' ? activeRx.therapistId.full_name : 'Assigned Therapist';

  // Appointments categorization
  const todayAppts = filterTodayAppointments(appointments);
  const upcomingAppts = filterUpcomingAppointments(appointments);

  return (
    <View style={styles.container}>
      <Header
        title={`Namaste, ${user?.full_name?.split(' ')[0] || 'Patient'}`}
        subtitle="Your Classical Ayurvedic Healing Journey"
        showLogout={true}
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
        showsVerticalScrollIndicator={false}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Compact Health Vitals Ribbon */}
        <View style={styles.vitalsBar}>
          <View style={styles.vitalsLeft}>
            <Text style={styles.vitalsIcon}>♥</Text>
            <Text style={styles.vitalsBarText}>
              Age: <Text style={styles.vitalsBold}>{user?.age || 'N/A'}</Text> • Gender: <Text style={styles.vitalsBold}>{user?.gender || 'N/A'}</Text> • Blood: <Text style={styles.vitalsBold}>{user?.bloodGroup || 'N/A'}</Text>
            </Text>
          </View>
          {user?.condition ? (
            <View style={styles.conditionPill}>
              <Text style={styles.vitalsConditionText}>{user.condition}</Text>
            </View>
          ) : null}
        </View>

        {/* AI Wellness Assistant Banner */}
        <TouchableOpacity
          style={styles.aiChatCard}
          onPress={() => setShowChatModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.aiChatLeft}>
            <View style={styles.aiIconBubble}>
              <Text style={styles.aiChatIcon}>✦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiChatTitle}>AyurSutra Clinical Assistant</Text>
              <Text style={styles.aiChatSub}>Ask about your therapy diet, aftercare & herbs</Text>
            </View>
          </View>
          <View style={styles.aiChatArrowBadge}>
            <Text style={styles.aiChatArrow}>Ask →</Text>
          </View>
        </TouchableOpacity>

        {/* AI Treatment Recommendations Banner */}
        <TouchableOpacity
          style={styles.aiRecoCard}
          onPress={() => setShowRecommendationModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.aiChatLeft}>
            <View style={styles.aiRecoIconBubble}>
              <Text style={styles.aiRecoIcon}>🪷</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiRecoTitle}>Therapy Recommendations</Text>
              <Text style={styles.aiRecoSub}>Explore tailored Panchakarma protocols for symptoms</Text>
            </View>
          </View>
          <Text style={styles.aiRecoArrow}>Explore →</Text>
        </TouchableOpacity>

        {/* Discover Your Prakriti Assessment Card */}
        <PrakritiDashboardCard
          latestAssessment={latestPrakriti}
          loading={loading && !refreshing}
        />

        {/* Current Treatment Banner */}
        {activeRx ? (
          <Card style={styles.treatmentBanner}>
            <View style={styles.bannerHeader}>
              <Text style={styles.bannerTag}>ACTIVE PANCHAKARMA PROTOCOL</Text>
              <View style={styles.statusBadgeWrapper}>
                <Text style={styles.statusBadge}>{activeRx.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.treatmentName}>{activeRx.treatment}</Text>
            <ProgressBar
              progress={activeRx.duration > 0 ? activeRx.progressCompleted / activeRx.duration : 0}
              label={`Sessions Completed: ${activeRx.progressCompleted} of ${activeRx.duration}`}
              color={Colors.accentDark}
            />

            <View style={styles.careTeamRow}>
              <View style={styles.teamMember}>
                <Text style={styles.teamLabel}>Physician</Text>
                <Text style={styles.teamValue}>{doctorName}</Text>
              </View>
              <View style={styles.teamMember}>
                <Text style={styles.teamLabel}>Therapist</Text>
                <Text style={styles.teamValue}>{therapistName}</Text>
              </View>
            </View>
          </Card>
        ) : (
          <View style={styles.emptyInlineContainer}>
            <Text style={styles.emptyInlineText}>No active Panchakarma plan currently assigned.</Text>
          </View>
        )}

        {/* Personal Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="patient" />

        {/* Today's Consultations Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/patient/appointments')}>
            <Text style={styles.seeAllText}>All Appointments →</Text>
          </TouchableOpacity>
        </View>

        {todayAppts.length > 0 ? (
          todayAppts.map((item) => (
            <Card key={item._id} style={styles.todayCard}>
              <View style={styles.cardTop}>
                <View style={styles.timePill}>
                  <Text style={styles.cardBadgeToday}>TODAY • {item.appointment_time}</Text>
                </View>
                <Text style={[styles.paidStatus, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textTertiary : Colors.warning) }]}>
                  {item.isPaid ? '✓ PAID' : (item.status === 'cancelled' ? 'CANCELLED' : 'UNPAID')}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{item.treatment}</Text>
              <Text style={styles.cardSub}>Status: {item.status.toUpperCase()}</Text>
            </Card>
          ))
        ) : (
          <View style={styles.emptyInlineContainer}>
            <Text style={styles.emptyInlineText}>No sessions scheduled for today.</Text>
          </View>
        )}

        {/* Upcoming Appointments Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <TouchableOpacity onPress={() => router.push('/patient/appointments')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {upcomingAppts.length > 0 ? (
          upcomingAppts.slice(0, 2).map((item) => (
            <Card key={item._id} style={styles.upcomingCard}>
              <View style={styles.cardTop}>
                <Text style={styles.cardDateText}>
                  {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
                </Text>
                <View style={styles.statusBadgeSmallWrapper}>
                  <Text style={styles.statusBadgeSmall}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.cardTitleSmall}>{item.treatment}</Text>
            </Card>
          ))
        ) : (
          <View style={styles.emptyInlineContainer}>
            <Text style={styles.emptyInlineText}>No upcoming appointments scheduled.</Text>
          </View>
        )}

        {/* Notifications & Tips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ayurvedic Lifestyle Reminder</Text>
        </View>
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Post-Therapy Care Protocol</Text>
          <Text style={styles.noticeBody}>
            Drink warm herbal infusion water (Usnodaka) and avoid direct exposure to air conditioning or wind for 2 hours post Panchakarma therapy.
          </Text>
        </Card>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
        </View>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/appointments')}
            activeOpacity={0.75}
          >
            <View style={styles.quickIconBadge}>
              <Text style={styles.quickIcon}>◫</Text>
            </View>
            <Text style={styles.quickTitle}>Book Session</Text>
            <Text style={styles.quickSub}>Schedule visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/treatment')}
            activeOpacity={0.75}
          >
            <View style={styles.quickIconBadge}>
              <Text style={styles.quickIcon}>🪷</Text>
            </View>
            <Text style={styles.quickTitle}>Treatment Plan</Text>
            <Text style={styles.quickSub}>Active protocol</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/report')}
            activeOpacity={0.75}
          >
            <View style={styles.quickIconBadge}>
              <Text style={styles.quickIcon}>◰</Text>
            </View>
            <Text style={styles.quickTitle}>Full Analytics</Text>
            <Text style={styles.quickSub}>Clinical metrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/feedback')}
            activeOpacity={0.75}
          >
            <View style={styles.quickIconBadge}>
              <Text style={styles.quickIcon}>★</Text>
            </View>
            <Text style={styles.quickTitle}>Feedback</Text>
            <Text style={styles.quickSub}>Rate outcome</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Chatbot Modal */}
      <AIChatbotModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        userRole="patient"
        userName={user?.full_name}
      />

      {/* AI Treatment Recommendation Modal */}
      <PatientTreatmentRecommendationModal
        visible={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
        patientName={user?.full_name}
      />
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
    paddingBottom: 40,
  },
  vitalsBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  vitalsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vitalsIcon: {
    fontSize: 14,
    color: Colors.accentDark,
    marginRight: 8,
  },
  vitalsBarText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  vitalsBold: {
    fontWeight: '700',
    color: Colors.text,
  },
  conditionPill: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vitalsConditionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  emptyInlineContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  emptyInlineText: {
    fontSize: 12.5,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  aiChatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    shadowColor: Colors.shadowElevated,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  aiChatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiChatIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  aiChatTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  aiChatSub: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  aiChatArrowBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  aiChatArrow: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiRecoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  aiRecoIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiRecoIcon: {
    fontSize: 18,
  },
  aiRecoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  aiRecoSub: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiRecoArrow: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 8,
  },
  treatmentBanner: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  statusBadgeWrapper: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  statusBadge: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  treatmentName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  careTeamRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  teamMember: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  teamValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    ...Typography.h2,
    fontSize: 16,
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timePill: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeToday: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.4,
  },
  paidStatus: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
  },
  cardDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusBadgeSmallWrapper: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeSmall: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.4,
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  noticeCard: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
    borderWidth: 1,
    padding: 14,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.warning,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  noticeBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickIcon: {
    fontSize: 20,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  quickSub: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
