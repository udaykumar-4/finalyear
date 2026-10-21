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
import prescriptionService from '../../services/prescriptionService';
import appointmentService from '../../services/appointmentService';
import noteService from '../../services/noteService';
import { Prescription } from '../../types/prescription';
import { Appointment } from '../../types/appointment';
import { Note } from '../../types/note';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { useResponsive } from '../../constants/Layout';

export interface AssignedPatientItem {
  patientId: string;
  patientName: string;
  prescription: Prescription;
}

export default function TherapistPatientsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected Patient Details State
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [patientAppts, setPatientAppts] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Add Note State
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'therapist')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await prescriptionService.getByTherapistId(user._id);
      setPrescriptions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned patients.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'therapist') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenPatientDetails = async (rx: Prescription) => {
    setSelectedRx(rx);
    setChartLoading(true);
    const pId = (rx.patientId && typeof rx.patientId === 'object') ? rx.patientId._id : rx.patientId;

    try {
      const [appts, notesData] = await Promise.all([
        appointmentService.getAppointments({ patientId: pId, therapistId: user?._id }),
        noteService.getNotesForPatient(pId),
      ]);
      setPatientAppts(appts);
      setPatientNotes(notesData);
    } catch (err: any) {
      Alert.alert('Chart Error', err.message || 'Failed to load patient session chart.');
    } finally {
      setChartLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedRx || !noteText.trim()) {
      Alert.alert('Validation Error', 'Please enter progress note text.');
      return;
    }

    const pId = (selectedRx.patientId && typeof selectedRx.patientId === 'object') ? selectedRx.patientId._id : selectedRx.patientId;

    setSavingNote(true);
    try {
      await noteService.createNote({
        patientId: pId,
        note: noteText.trim(),
      });
      Alert.alert('Note Logged', 'Therapy progress note saved successfully.');
      setNoteText('');
      const updatedNotes = await noteService.getNotesForPatient(pId);
      setPatientNotes(updatedNotes);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save progress note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Assigned Patients..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="My Assigned Patients"
        subtitle="Patients Under Your Therapy Care"
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
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {prescriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="therapist" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Patients Assigned</Text>
            <Text style={styles.emptyDesc}>You currently have no active patient prescriptions assigned to you.</Text>
          </Card>
        ) : (
          prescriptions.map((rx) => {
            const pName = (rx.patientId && typeof rx.patientId === 'object') ? rx.patientId.full_name : 'Patient';
            const docName = (rx.doctorId && typeof rx.doctorId === 'object') ? rx.doctorId.full_name : 'Prescribing Doctor';
            const remaining = Math.max(0, rx.duration - rx.progressCompleted);

            return (
              <TouchableOpacity
                key={rx._id}
                activeOpacity={0.85}
                onPress={() => handleOpenPatientDetails(rx)}
              >
                <Card style={styles.patientCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.patientRow}>
                      <View style={styles.patientAvatar}>
                        <Icon name="user" size={14} color={Colors.primary} />
                      </View>
                      <Text style={styles.patientName}>{pName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: rx.status === 'completed' ? Colors.success + '18' : Colors.warning + '18' }]}>
                      <Text style={[styles.statusBadgeText, { color: rx.status === 'completed' ? Colors.success : Colors.warning }]}>
                        {rx.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="treatment" size={12} color={Colors.primary} />
                    <Text style={styles.treatmentText}>Protocol: {rx.treatment}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="doctor" size={12} color={Colors.textSecondary} />
                    <Text style={styles.doctorText}>Prescribed By: {docName}</Text>
                  </View>

                  <ProgressBar
                    progress={rx.duration > 0 ? (rx.progressCompleted / rx.duration) * 100 : 0}
                    label={`Sessions: ${rx.progressCompleted} done • ${remaining} remaining`}
                    color={Colors.primary}
                    height={10}
                    style={{ marginVertical: 8 }}
                  />

                  <View style={styles.footerRow}>
                    <Text style={styles.viewChartText}>View Full Patient Care Chart</Text>
                    <Icon name="chevron-right" size={12} color={Colors.primary} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Patient Details & Clinical Chart Modal */}
      {selectedRx && (
        <Modal
          visible={!!selectedRx}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRx(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {(selectedRx.patientId && typeof selectedRx.patientId === 'object') ? selectedRx.patientId.full_name : 'Patient'}
                  </Text>
                  <Text style={styles.modalSub}>Assigned Therapy Chart</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedRx(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {chartLoading ? (
                <LoadingScreen message="Loading Patient Details..." />
              ) : (
                <ScrollView style={{ maxHeight: 480 }}>
                  {/* Prescription & Protocol Summary */}
                  <Card style={styles.chartCard}>
                    <View style={styles.chartTitleRow}>
                      <Icon name="treatment" size={14} color={Colors.primary} />
                      <Text style={styles.chartSectionTitle}>Treatment & Protocol Details</Text>
                    </View>
                    <Text style={styles.chartText}>Treatment Name: {selectedRx.treatment}</Text>
                    <Text style={styles.chartText}>
                      Doctor: {(selectedRx.doctorId && typeof selectedRx.doctorId === 'object') ? selectedRx.doctorId.full_name : 'Prescribing Doctor'}
                    </Text>
                    <Text style={styles.chartText}>Status: {selectedRx.status.toUpperCase()}</Text>

                    <ProgressBar
                      progress={selectedRx.duration > 0 ? (selectedRx.progressCompleted / selectedRx.duration) * 100 : 0}
                      label={`Sessions Completed: ${selectedRx.progressCompleted} of ${selectedRx.duration}`}
                      color={Colors.primary}
                      height={10}
                      style={{ marginVertical: 8 }}
                    />
                    <Text style={styles.remainingText}>
                      Sessions Remaining: {Math.max(0, selectedRx.duration - selectedRx.progressCompleted)}
                    </Text>

                    {selectedRx.plan ? (
                      <View style={styles.boxContainer}>
                        <Text style={styles.boxTitle}>Doctor Protocol Instructions:</Text>
                        <Text style={styles.boxText}>{selectedRx.plan}</Text>
                      </View>
                    ) : null}

                    {selectedRx.notes ? (
                      <View style={styles.boxContainerAlt}>
                        <Text style={styles.boxTitle}>Doctor Advice & Notes:</Text>
                        <Text style={styles.boxText}>{selectedRx.notes}</Text>
                      </View>
                    ) : null}
                  </Card>

                  {/* Therapy Sessions History */}
                  <Card style={styles.chartCard}>
                    <View style={styles.chartTitleRow}>
                      <Icon name="calendar" size={14} color={Colors.primary} />
                      <Text style={styles.chartSectionTitle}>Scheduled Sessions ({patientAppts.length})</Text>
                    </View>
                    {patientAppts.length === 0 ? (
                      <Text style={styles.emptyChartText}>No session appointments scheduled yet.</Text>
                    ) : (
                      patientAppts.map((appt) => (
                        <View key={appt._id} style={styles.apptRow}>
                          <Text style={styles.apptText}>
                            {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time} — {appt.treatment} ({appt.status})
                          </Text>
                        </View>
                      ))
                    )}
                  </Card>

                  {/* Clinical Progress Notes & Logger */}
                  <Card style={styles.chartCard}>
                    <View style={styles.chartTitleRow}>
                      <Icon name="document" size={14} color={Colors.primary} />
                      <Text style={styles.chartSectionTitle}>Therapy Progress Notes ({patientNotes.length})</Text>
                    </View>
                    {patientNotes.length === 0 ? (
                      <Text style={styles.emptyChartText}>No notes logged for this patient.</Text>
                    ) : (
                      patientNotes.map((note) => (
                        <View key={note._id} style={styles.noteRow}>
                          <Text style={styles.noteAuthor}>
                            {(note.authorId && typeof note.authorId === 'object') ? `${note.authorId.full_name} (${note.authorId.role})` : 'Staff'}
                          </Text>
                          <Text style={styles.noteBody}>{note.note}</Text>
                        </View>
                      ))
                    )}

                    {/* Therapist Note Form */}
                    <View style={styles.addNoteBox}>
                      <Text style={styles.addNoteTitle}>Add Session Progress Note:</Text>
                      <Input
                        placeholder="Log patient response, pain reduction, mobility observations..."
                        value={noteText}
                        onChangeText={setNoteText}
                        multiline
                        numberOfLines={3}
                        style={{ height: 70, textAlignVertical: 'top' }}
                      />
                      <Button
                        title="Save Progress Note"
                        onPress={handleAddNote}
                        loading={savingNote}
                        size="small"
                        variant="primary"
                      />
                    </View>
                  </Card>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
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
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 5,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  patientAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    ...Typography.bodyMedium,
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  treatmentText: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.text,
  },
  doctorText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '60',
  },
  viewChartText: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
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
    alignItems: 'flex-start',
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
  modalSub: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chartCard: {
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    padding: 12,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  chartSectionTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.text,
  },
  chartText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Colors.text,
    marginBottom: 4,
  },
  remainingText: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  boxContainer: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  boxContainerAlt: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  boxTitle: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  boxText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
  emptyChartText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  apptRow: {
    marginBottom: 4,
  },
  apptText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
  },
  noteRow: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  noteAuthor: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.secondary,
  },
  noteBody: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
  },
  addNoteBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
  addNoteTitle: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
});
