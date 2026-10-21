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
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import noteService from '../../services/noteService';
import { User } from '../../types/user';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
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
import ClinicalSupportModal from '../../components/ClinicalSupportModal';
import DiseasePredictionModal from '../../components/DiseasePredictionModal';
import { useResponsive } from '../../constants/Layout';

export default function DoctorPatientsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [patients, setPatients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected Patient Chart State
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [patientAppts, setPatientAppts] = useState<Appointment[]>([]);
  const [patientRxs, setPatientRxs] = useState<Prescription[]>([]);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Clinical Support Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);

  // Add Note Modal State
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await userService.getAllUsers('patient');
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patient records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenPatientChart = async (patient: User) => {
    setSelectedPatient(patient);
    setChartLoading(true);
    try {
      const [appts, rxs, notesData] = await Promise.all([
        appointmentService.getAppointments({ patientId: patient._id }),
        prescriptionService.getByPatientId(patient._id),
        noteService.getNotesForPatient(patient._id),
      ]);
      setPatientAppts(appts);
      setPatientRxs(rxs);
      setPatientNotes(notesData);
    } catch (err: any) {
      Alert.alert('Chart Error', err.message || 'Error loading patient health chart.');
    } finally {
      setChartLoading(false);
    }
  };

  const handleAddClinicalNote = async () => {
    if (!selectedPatient || !newNoteText.trim()) {
      Alert.alert('Error', 'Please enter a clinical note before saving.');
      return;
    }

    setSavingNote(true);
    try {
      await noteService.createNote({
        patientId: selectedPatient._id,
        note: newNoteText.trim(),
      });
      Alert.alert('Note Saved', 'Clinical observation logged successfully.');
      setNewNoteText('');
      const updatedNotes = await noteService.getNotesForPatient(selectedPatient._id);
      setPatientNotes(updatedNotes);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save clinical note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Patient Chart Directory..." />;
  }

  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    return p.full_name.toLowerCase().includes(query) || (p.email && p.email.toLowerCase().includes(query));
  });

  return (
    <View style={styles.container}>
      <Header title="My Patients" subtitle="Patient Profiles & Records" showLogout={true} />

      <View style={[styles.searchBarContainer, { paddingHorizontal: horizontalPadding, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <Input
          placeholder="Search patients by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: 0 }}
        />
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

        {filteredPatients.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="users" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Patients Found</Text>
            <Text style={styles.emptyDesc}>No patient records match the search query.</Text>
          </Card>
        ) : (
          filteredPatients.map((p) => (
            <TouchableOpacity
              key={p._id}
              activeOpacity={0.85}
              onPress={() => handleOpenPatientChart(p)}
            >
              <Card style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>{p.full_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.headerDetails}>
                    <Text style={styles.patientName}>{p.full_name}</Text>
                    <Text style={styles.patientMeta}>
                      {p.age ? `${p.age} yrs` : 'Age N/A'} • {p.gender || 'Gender N/A'} • {p.phone || 'Phone N/A'}
                    </Text>
                  </View>
                  <View style={styles.chartLinkBadge}>
                    <Text style={styles.viewChartLink}>Chart</Text>
                    <Icon name="chevron-right" size={12} color={Colors.primary} />
                  </View>
                </View>

                {p.condition ? (
                  <View style={styles.conditionBox}>
                    <Text style={styles.conditionText}>Primary Diagnosis: {p.condition}</Text>
                  </View>
                ) : null}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Patient Health Chart Modal */}
      {selectedPatient && (
        <Modal
          visible={!!selectedPatient}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPatient(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedPatient.full_name}</Text>
                  <Text style={styles.modalSub}>
                    Patient ID: #{selectedPatient._id.slice(-6)} • {selectedPatient.gender || 'N/A'} ({selectedPatient.age || 'N/A'} yrs)
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPatient(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {chartLoading ? (
                <LoadingScreen message="Loading Health Chart..." />
              ) : (
                <ScrollView style={{ maxHeight: 480 }}>
                  {/* AI Clinical Support Action Bar */}
                  <View style={styles.aiBarContainer}>
                    <TouchableOpacity
                      style={[styles.aiBarBtn, { backgroundColor: Colors.primary }]}
                      onPress={() => setShowAiModal(true)}
                      activeOpacity={0.8}
                    >
                      <Icon name="sparkle" size={14} color={Colors.white} />
                      <Text style={styles.aiBarBtnText}>Treatment Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.aiBarBtn, { backgroundColor: Colors.secondary }]}
                      onPress={() => setShowPredictionModal(true)}
                      activeOpacity={0.8}
                    >
                      <Icon name="chart" size={14} color={Colors.white} />
                      <Text style={styles.aiBarBtnText}>Disease Prediction</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Patient Bio & Vitals Section */}
                  <Card style={styles.chartCard}>
                    <View style={styles.chartTitleRow}>
                      <Icon name="user" size={14} color={Colors.primary} />
                      <Text style={styles.chartSectionTitle}>Bio & Vitals Summary</Text>
                    </View>
                    <Text style={styles.chartText}>Phone: {selectedPatient.phone || 'N/A'}</Text>
                    <Text style={styles.chartText}>Address: {selectedPatient.address || 'N/A'}</Text>
                    <Text style={styles.chartText}>Emergency Contact: {selectedPatient.emergencyContact || 'N/A'}</Text>
                    <Text style={styles.chartText}>Blood Group: {selectedPatient.bloodGroup || 'N/A'}</Text>
                    <Text style={styles.chartText}>Allergies: {selectedPatient.allergies || 'None reported'}</Text>
                    <Text style={styles.chartText}>Vitals: BP ({selectedPatient.bloodPressure || 'N/A'}), HR ({selectedPatient.heartRate || 'N/A'}), Wt ({selectedPatient.weight || 'N/A'})</Text>
                  </Card>

                  {/* Active Prescriptions / Treatment Plans */}
                  <Card style={styles.chartCard}>
                    <View style={styles.chartTitleRow}>
                      <Icon name="treatment" size={14} color={Colors.primary} />
                      <Text style={styles.chartSectionTitle}>Treatment Plans ({patientRxs.length})</Text>
                    </View>
                    {patientRxs.length === 0 ? (
                      <Text style={styles.emptyChartText}>No treatment plans issued.</Text>
                    ) : (
                      patientRxs.map((rx) => (
                        <View key={rx._id} style={styles.rxRow}>
                          <View style={styles.rxTitleRow}>
                            <Icon name="pill" size={12} color={Colors.primary} />
                            <Text style={styles.rxName}>{rx.treatment} ({rx.status.toUpperCase()})</Text>
                          </View>
                          <ProgressBar
                            progress={rx.duration > 0 ? (rx.progressCompleted / rx.duration) * 100 : 0}
                            label={`Sessions: ${rx.progressCompleted} / ${rx.duration}`}
                          />
                          <Text style={styles.rxSub}>
                            Therapist: {(rx.therapistId && typeof rx.therapistId === 'object') ? rx.therapistId.full_name : 'Therapist'}
                          </Text>
                        </View>
                      ))
                    )}
                  </Card>

                  {/* Consultations History */}
                  <Card style={styles.chartCard}>
                    <View style={styles.chartTitleRow}>
                      <Icon name="calendar" size={14} color={Colors.primary} />
                      <Text style={styles.chartSectionTitle}>Appointments ({patientAppts.length})</Text>
                    </View>
                    {patientAppts.length === 0 ? (
                      <Text style={styles.emptyChartText}>No consultations recorded.</Text>
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

                  {/* Clinical Progress Notes */}
                  <Card style={styles.chartCard}>
                    <View style={styles.chartTitleRow}>
                      <Icon name="document" size={14} color={Colors.primary} />
                      <Text style={styles.chartSectionTitle}>Clinical Notes ({patientNotes.length})</Text>
                    </View>
                    {patientNotes.length === 0 ? (
                      <Text style={styles.emptyChartText}>No notes logged.</Text>
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

                    {/* Add New Clinical Note Form */}
                    <View style={styles.addNoteContainer}>
                      <Text style={styles.addNoteTitle}>Add Clinical Observation:</Text>
                      <Input
                        placeholder="Log observations, response to therapy..."
                        value={newNoteText}
                        onChangeText={setNewNoteText}
                        multiline
                        numberOfLines={3}
                        style={{ height: 70, textAlignVertical: 'top' }}
                      />
                      <Button
                        title="Save Note"
                        onPress={handleAddClinicalNote}
                        loading={savingNote}
                        size="small"
                      />
                    </View>
                  </Card>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Phase 4: Clinical Treatment Decision Support Modal */}
      {selectedPatient && (
        <ClinicalSupportModal
          visible={showAiModal}
          onClose={() => setShowAiModal(false)}
          patientId={selectedPatient._id}
          patientName={selectedPatient.full_name}
          patientCondition={selectedPatient.condition}
        />
      )}

      {/* Phase 5: Disease Prediction Decision Support Modal */}
      {selectedPatient && (
        <DiseasePredictionModal
          visible={showPredictionModal}
          onClose={() => setShowPredictionModal(false)}
          patientId={selectedPatient._id}
          patientName={selectedPatient.full_name}
          patientCondition={selectedPatient.condition}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarContainer: {
    paddingTop: 12,
  },
  scrollContent: {
    paddingTop: 8,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 5,
    padding: 14,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarMiniText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  headerDetails: {
    flex: 1,
  },
  patientName: {
    ...Typography.bodyMedium,
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.text,
  },
  patientMeta: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chartLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewChartLink: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  conditionBox: {
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
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
    fontSize: 18,
    color: Colors.text,
  },
  modalSub: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  aiBarBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  aiBarBtnText: {
    ...Typography.button,
    fontSize: 12,
    color: Colors.white,
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
  emptyChartText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  rxRow: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  rxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rxName: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  rxSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
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
  addNoteContainer: {
    marginTop: 12,
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
