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
import prescriptionService from '../../services/prescriptionService';
import noteService from '../../services/noteService';
import { Prescription } from '../../types/prescription';
import { Note } from '../../types/note';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import PatientTreatmentRecommendationModal from '../../components/PatientTreatmentRecommendationModal';
import { useResponsive } from '../../constants/Layout';

export default function PatientTreatmentScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [rxData, notesData] = await Promise.all([
        prescriptionService.getByPatientId(user._id),
        noteService.getNotesForPatient(user._id),
      ]);
      setPrescriptions(rxData);
      setNotes(notesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load treatment plan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Treatment Plan..." />;
  }

  const activeRx = prescriptions.find((p) => p.status === 'in-progress') || prescriptions[0];

  return (
    <View style={styles.container}>
      <Header title="My Treatment Plan" subtitle="Panchakarma Protocol & Progress" showLogout={true} />

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

        {/* AI Treatment Recommendation Card */}
        <Card style={styles.aiRecommendCard}>
          <View style={styles.aiRecommendRow}>
            <View style={styles.aiIconBadge}>
              <Icon name="sparkle" size={18} color={Colors.primary} />
            </View>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiTitle}>AI Therapy Recommendations</Text>
              <Text style={styles.aiSubtitle}>
                Explore personalized Ayurvedic protocol suggestions based on your symptoms.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => setShowRecommendationModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
            >
              <Text style={styles.exploreBtnText}>Explore</Text>
              <Icon name="chevron-right" size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </Card>

        {activeRx ? (
          <View>
            {/* Active Plan Card */}
            <Card style={styles.planCard}>
              <View style={styles.badgeRow}>
                <View style={styles.protocolBadge}>
                  <Icon name="treatment" size={12} color={Colors.primary} />
                  <Text style={styles.rxBadge}>ACTIVE PROTOCOL</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: activeRx.status === 'completed' ? Colors.success + '18' : Colors.warning + '18' }]}>
                  <Text style={[styles.statusText, { color: activeRx.status === 'completed' ? Colors.success : Colors.warning }]}>
                    {activeRx.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.treatmentTitle}>{activeRx.treatment}</Text>

              <ProgressBar
                progress={activeRx.duration > 0 ? (activeRx.progressCompleted / activeRx.duration) * 100 : 0}
                label={`Progress (${activeRx.progressCompleted} / ${activeRx.duration} sessions)`}
                color={Colors.primary}
                height={10}
                style={{ marginVertical: 12 }}
              />

              <View style={styles.gridInfo}>
                <View style={styles.gridItem}>
                  <View style={styles.gridLabelRow}>
                    <Icon name="doctor" size={12} color={Colors.textSecondary} />
                    <Text style={styles.gridLabel}>Prescribing Doctor</Text>
                  </View>
                  <Text style={styles.gridValue}>
                    {(activeRx.doctorId && typeof activeRx.doctorId === 'object') ? activeRx.doctorId.full_name : 'Doctor'}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <View style={styles.gridLabelRow}>
                    <Icon name="therapist" size={12} color={Colors.textSecondary} />
                    <Text style={styles.gridLabel}>Primary Therapist</Text>
                  </View>
                  <Text style={styles.gridValue}>
                    {(activeRx.therapistId && typeof activeRx.therapistId === 'object') ? activeRx.therapistId.full_name : 'Therapist'}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <View style={styles.gridLabelRow}>
                    <Icon name="clock" size={12} color={Colors.textSecondary} />
                    <Text style={styles.gridLabel}>Total Sessions</Text>
                  </View>
                  <Text style={styles.gridValue}>{activeRx.duration} sessions</Text>
                </View>

                <View style={styles.gridItem}>
                  <View style={styles.gridLabelRow}>
                    <Icon name="calendar" size={12} color={Colors.textSecondary} />
                    <Text style={styles.gridLabel}>Start Date</Text>
                  </View>
                  <Text style={styles.gridValue}>
                    {activeRx.createdAt ? new Date(activeRx.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>

              {activeRx.notes ? (
                <View style={styles.protocolBox}>
                  <View style={styles.protocolHeader}>
                    <Icon name="report" size={14} color={Colors.primary} />
                    <Text style={styles.boxTitle}>Doctor's Clinical Protocol & Notes</Text>
                  </View>
                  <Text style={styles.boxText}>{activeRx.notes}</Text>
                </View>
              ) : null}
            </Card>

            {/* Session Notes */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="document" size={15} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Therapist Consultation Notes</Text>
              </View>
            </View>

            {notes.length === 0 ? (
              <Card style={styles.subCard}>
                <Text style={styles.emptyNotesText}>No clinical consultation notes logged yet.</Text>
              </Card>
            ) : (
              notes.map((noteItem) => (
                <Card key={noteItem._id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.authorRow}>
                      <Icon name="user" size={12} color={Colors.primary} />
                      <Text style={styles.authorText}>
                        {(noteItem.authorId && typeof noteItem.authorId === 'object') ? `${noteItem.authorId.full_name}` : 'Medical Provider'}
                      </Text>
                    </View>
                    {noteItem.createdAt && (
                      <Text style={styles.dateText}>
                        {new Date(noteItem.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.noteContent}>{noteItem.note}</Text>
                </Card>
              ))
            )}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="treatment" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Active Treatment Plan</Text>
            <Text style={styles.emptyDesc}>You currently do not have an active Panchakarma prescription plan assigned.</Text>
          </Card>
        )}
      </ScrollView>

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
  },
  aiRecommendCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginBottom: 16,
    padding: 14,
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
  },
  aiRecommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  aiTitle: {
    ...Typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  aiSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  exploreBtnText: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.white,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rxBadge: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
  },
  treatmentTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  gridInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
  gridItem: {
    width: '50%',
    marginBottom: 12,
  },
  gridLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gridLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  gridValue: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  protocolBox: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  boxTitle: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  boxText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Colors.text,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: 20,
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
  subCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
  },
  emptyNotesText: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dateText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  noteContent: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
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
});
