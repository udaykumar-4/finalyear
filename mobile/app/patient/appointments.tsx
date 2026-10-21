import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import BookAppointmentModal from '../../components/BookAppointmentModal';
import { categorizeAppointmentDate } from '../../utils/appointmentDateUtils';
import { useResponsive } from '../../constants/Layout';

export default function PatientAppointmentsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Book Appointment Modal State
  const [showBookModal, setShowBookModal] = useState(false);

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
      const apptsData = await appointmentService.getAppointments({ patientId: user._id });
      setAppointments(apptsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'patient') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCancelAppointment = (id: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(id);
            try {
              await appointmentService.deleteAppointment(id);
              Alert.alert('Cancelled', 'Your appointment has been cancelled.');
              if (selectedAppt?._id === id) setSelectedAppt(null);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel appointment.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Appointments..." />;
  }

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'today') return categorizeAppointmentDate(a.appointment_date) === 'TODAY';
    if (filterStatus === 'upcoming') return categorizeAppointmentDate(a.appointment_date) === 'UPCOMING';
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <View style={styles.container}>
      <Header title="My Appointments" subtitle="Schedule & Booking History" showLogout={true} />

      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <Button
          title="+ Book Consultation"
          onPress={() => setShowBookModal(true)}
          variant="primary"
          size="medium"
          style={styles.bookBtn}
        />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterWrapper, { maxWidth: containerMaxWidth, alignSelf: 'center' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRowContainer}
          contentContainerStyle={[styles.filterRowContent, { paddingHorizontal: horizontalPadding }]}
        >
          {['all', 'today', 'upcoming', 'scheduled', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.activeFilterChip]}
              onPress={() => setFilterStatus(status)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.activeFilterChipText]}>
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

        {filteredAppointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="calendar" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptyDesc}>No appointment records match the selected filter criteria.</Text>
          </Card>
        ) : (
          filteredAppointments.map((item) => (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.85}
              onPress={() => setSelectedAppt(item)}
            >
              <Card style={styles.apptCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.treatmentRow}>
                    <View style={styles.treatmentIconBadge}>
                      <Icon name="treatment" size={14} color={Colors.primary} />
                    </View>
                    <Text style={styles.treatmentTitle}>{item.treatment}</Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                    <Text style={[styles.statusBadgeText, getStatusTextStyle(item.status)]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoLabelGroup}>
                    <Icon name="calendar" size={12} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Date & Time:</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoLabelGroup}>
                    <Icon name="doctor" size={12} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Doctor:</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {(item.doctorId && typeof item.doctorId === 'object') ? item.doctorId.full_name : 'Assigned Doctor'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoLabelGroup}>
                    <Icon name="therapist" size={12} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Therapist:</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {(item.therapistId && typeof item.therapistId === 'object') ? item.therapistId.full_name : 'Assigned Therapist'}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.costText}>Cost: ₹{item.cost || 1500}</Text>
                  <View style={[styles.paidChip, { backgroundColor: item.isPaid ? Colors.success + '15' : Colors.warning + '18' }]}>
                    <Text style={[styles.paidText, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textSecondary : Colors.warning) }]}>
                      {item.isPaid ? 'PAID' : (item.status === 'cancelled' ? 'CANCELLED' : 'UNPAID')}
                    </Text>
                  </View>
                </View>

                {item.status === 'scheduled' && (
                  <TouchableOpacity
                    style={styles.cancelLink}
                    onPress={() => handleCancelAppointment(item._id)}
                    hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                  >
                    <Text style={styles.cancelLinkText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <Modal
          visible={!!selectedAppt}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAppt(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Appointment Details</Text>
                <TouchableOpacity
                  onPress={() => setSelectedAppt(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                <Text style={styles.modalSub}>{selectedAppt.treatment}</Text>
                <Text style={styles.modalDetail}>Status: {selectedAppt.status.toUpperCase()}</Text>
                <Text style={styles.modalDetail}>
                  Date: {new Date(selectedAppt.appointment_date).toLocaleDateString()}
                </Text>
                <Text style={styles.modalDetail}>Time: {selectedAppt.appointment_time}</Text>
                <Text style={styles.modalDetail}>
                  Doctor: {(selectedAppt.doctorId && typeof selectedAppt.doctorId === 'object') ? selectedAppt.doctorId.full_name : 'N/A'}
                </Text>
                <Text style={styles.modalDetail}>
                  Therapist: {(selectedAppt.therapistId && typeof selectedAppt.therapistId === 'object') ? selectedAppt.therapistId.full_name : 'N/A'}
                </Text>
                <Text style={styles.modalDetail}>Cost: ₹{selectedAppt.cost || 1500}</Text>
                <Text style={styles.modalDetail}>Payment Status: {selectedAppt.isPaid ? 'Paid' : 'Unpaid'}</Text>

                {selectedAppt.specialRequirements ? (
                  <Text style={styles.modalDetail}>Notes: {selectedAppt.specialRequirements}</Text>
                ) : null}
              </ScrollView>

              {selectedAppt.status === 'scheduled' && (
                <Button
                  title="Cancel Appointment"
                  onPress={() => handleCancelAppointment(selectedAppt._id)}
                  variant="danger"
                  size="small"
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Real Availability Book Appointment Modal */}
      <BookAppointmentModal
        visible={showBookModal}
        onClose={() => setShowBookModal(false)}
        patientId={user?._id}
        patientName={user?.full_name}
        onSuccess={fetchData}
      />
    </View>
  );
}

const getStatusBadgeStyle = (status: AppointmentStatus) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: Colors.success + '18' };
    case 'cancelled':
      return { backgroundColor: Colors.error + '18' };
    case 'in-progress':
      return { backgroundColor: Colors.warning + '18' };
    case 'scheduled':
    default:
      return { backgroundColor: Colors.primary + '15' };
  }
};

const getStatusTextStyle = (status: AppointmentStatus) => {
  switch (status) {
    case 'completed':
      return { color: Colors.success };
    case 'cancelled':
      return { color: Colors.error };
    case 'in-progress':
      return { color: Colors.warning };
    case 'scheduled':
    default:
      return { color: Colors.primary };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingTop: 12,
  },
  bookBtn: {
    width: '100%',
  },
  filterWrapper: {
    width: '100%',
  },
  filterRowContainer: {
    flexGrow: 0,
    maxHeight: 52,
    marginVertical: 8,
  },
  filterRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    height: 34,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeFilterChipText: {
    color: Colors.white,
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
  apptCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 5,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  treatmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  treatmentIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treatmentTitle: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 105,
  },
  infoLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.bodyMedium,
    fontSize: 12.5,
    color: Colors.text,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
  costText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  paidChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidText: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelLink: {
    marginTop: 10,
    alignSelf: 'flex-end',
    minHeight: 28,
    justifyContent: 'center',
  },
  cancelLinkText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 35, 24, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    ...Typography.h3,
    fontSize: 17,
    color: Colors.text,
  },
  modalSub: {
    ...Typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  modalDetail: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 6,
  },
});
