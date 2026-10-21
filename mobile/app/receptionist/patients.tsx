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
import appointmentService from '../../services/appointmentService';
import { User } from '../../types/user';
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { useResponsive } from '../../constants/Layout';

export default function ReceptionistPatientsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [patients, setPatients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register Walk-In Patient Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('Patient123');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [registering, setRegistering] = useState(false);

  // Patient Info View Modal State
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [patientAppts, setPatientAppts] = useState<Appointment[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'receptionist')) {
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
    if (user && user.role === 'receptionist') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRegisterPatient = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      Alert.alert('Validation Error', 'Please complete Name, Email, and Phone fields.');
      return;
    }

    setRegistering(true);
    try {
      await authService.register({
        full_name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'patient',
        age: regAge ? parseInt(regAge, 10) : undefined,
        gender: regGender,
        phone: regPhone.trim(),
        address: regAddress.trim(),
      });

      Alert.alert('Registration Successful', `Walk-in patient "${regName}" registered successfully!`);
      setShowRegModal(false);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegAddress('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Error registering patient.');
    } finally {
      setRegistering(false);
    }
  };

  const handleViewPatientDetails = async (patient: User) => {
    setSelectedPatient(patient);
    setInfoLoading(true);
    try {
      const appts = await appointmentService.getAppointments({ patientId: patient._id });
      setPatientAppts(appts);
    } catch {
      // non-fatal
    } finally {
      setInfoLoading(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Patient Records..." />;
  }

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || (p.email && p.email.toLowerCase().includes(q));
  });

  return (
    <View style={styles.container}>
      <Header title="Patient Directory" subtitle="Patient Registration & Records" showLogout={true} />

      <View style={[styles.topActionContainer, { paddingHorizontal: horizontalPadding, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <Button
          title="+ Register Walk-In Patient"
          onPress={() => setShowRegModal(true)}
          variant="primary"
          size="medium"
          style={{ width: '100%', marginBottom: 10 }}
        />
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
            <Text style={styles.emptyDesc}>No patient records match your search criteria.</Text>
          </Card>
        ) : (
          filteredPatients.map((p) => (
            <TouchableOpacity
              key={p._id}
              activeOpacity={0.85}
              onPress={() => handleViewPatientDetails(p)}
            >
              <Card style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarText}>{p.full_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{p.full_name}</Text>
                    <View style={styles.patientSubRow}>
                      <Text style={styles.patientSub}>
                        {p.age ? `${p.age} yrs` : 'Age N/A'} • {p.gender || 'N/A'} • {p.phone || 'No Phone'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.viewBadge}>
                    <Text style={styles.viewLink}>View</Text>
                    <Icon name="chevron-right" size={12} color={Colors.primary} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Patient Info Modal */}
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
                  <Text style={styles.modalSub}>Patient File #{selectedPatient._id.slice(-6)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPatient(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                <Card style={styles.infoCard}>
                  <View style={styles.infoTitleRow}>
                    <Icon name="document" size={14} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Operational Contact Data</Text>
                  </View>
                  <Text style={styles.infoText}>Email: {selectedPatient.email}</Text>
                  <Text style={styles.infoText}>Phone: {selectedPatient.phone || 'N/A'}</Text>
                  <Text style={styles.infoText}>Address: {selectedPatient.address || 'N/A'}</Text>
                  <Text style={styles.infoText}>Emergency Contact: {selectedPatient.emergencyContact || 'N/A'}</Text>
                </Card>

                <Card style={styles.infoCard}>
                  <View style={styles.infoTitleRow}>
                    <Icon name="calendar" size={14} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Appointments History ({patientAppts.length})</Text>
                  </View>
                  {infoLoading ? (
                    <Text style={styles.emptyText}>Loading appointments...</Text>
                  ) : patientAppts.length === 0 ? (
                    <Text style={styles.emptyText}>No appointments recorded.</Text>
                  ) : (
                    patientAppts.map((appt) => (
                      <View key={appt._id} style={styles.apptRow}>
                        <Text style={styles.apptText}>
                          {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time} — {appt.treatment} ({appt.status})
                        </Text>
                        <Text style={styles.apptSub}>
                          Doctor: {(appt.doctorId && typeof appt.doctorId === 'object') ? appt.doctorId.full_name : 'N/A'} • Therapist: {(appt.therapistId && typeof appt.therapistId === 'object') ? appt.therapistId.full_name : 'N/A'}
                        </Text>
                      </View>
                    ))
                  )}
                </Card>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Register Walk-In Patient Modal */}
      <Modal
        visible={showRegModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Walk-In Patient</Text>
              <TouchableOpacity
                onPress={() => setShowRegModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Kumar"
                value={regName}
                onChangeText={setRegName}
              />

              <Input
                label="Email Address"
                placeholder="ramesh@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={regEmail}
                onChangeText={setRegEmail}
              />

              <Input
                label="Default Password"
                placeholder="Patient123"
                value={regPassword}
                onChangeText={setRegPassword}
              />

              <View style={{ flexDirection: 'row' }}>
                <Input
                  label="Age"
                  placeholder="35"
                  keyboardType="numeric"
                  value={regAge}
                  onChangeText={setRegAge}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <Input
                  label="Gender"
                  placeholder="Male / Female"
                  value={regGender}
                  onChangeText={setRegGender}
                  containerStyle={{ flex: 1, marginLeft: 8 }}
                />
              </View>

              <Input
                label="Phone Number"
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
                value={regPhone}
                onChangeText={setRegPhone}
              />

              <Input
                label="Residential Address"
                placeholder="City, State"
                value={regAddress}
                onChangeText={setRegAddress}
              />

              <Button
                title="Create Patient Account"
                onPress={handleRegisterPatient}
                loading={registering}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topActionContainer: {
    paddingTop: 12,
  },
  scrollContent: {
    paddingTop: 8,
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
    marginVertical: 4,
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
  avatarText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  patientName: {
    ...Typography.bodyMedium,
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.text,
  },
  patientSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  patientSub: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewLink: {
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
  infoCard: {
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    padding: 12,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.text,
  },
  infoText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Colors.text,
    marginBottom: 4,
  },
  emptyText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  apptRow: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '70',
  },
  apptText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
  },
  apptSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
