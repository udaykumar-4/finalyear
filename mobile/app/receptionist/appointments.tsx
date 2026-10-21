import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { User } from '../../types/user';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import SmartSchedulingModal from '../../components/SmartSchedulingModal';
import BookAppointmentModal from '../../components/BookAppointmentModal';
import { categorizeAppointmentDate } from '../../utils/appointmentDateUtils';
import { useResponsive } from '../../constants/Layout';

export default function ReceptionistAppointmentsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming'>('today');

  // Booking & Optimizer Modal States
  const [showBookModal, setShowBookModal] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');

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
      const [apptsData, pData, dData, tData] = await Promise.all([
        appointmentService.getAppointments(),
        userService.getAllUsers('patient'),
        userService.getAllUsers('doctor'),
        userService.getAllUsers('therapist'),
      ]);
      setAppointments(apptsData);
      setPatients(pData);
      setDoctors(dData);
      setTherapists(tData);
      if (pData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pData[0]._id);
        setSelectedPatientName(pData[0].full_name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load master appointments list.');
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

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, newStatus);
      Alert.alert('Status Updated', `Appointment marked as "${newStatus}".`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update appointment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePayment = async (id: string, currentPaid: boolean) => {
    setUpdatingId(id);
    try {
      await appointmentService.updatePaymentStatus(id, !currentPaid);
      Alert.alert('Payment Updated', `Payment marked as ${!currentPaid ? 'PAID' : 'UNPAID'}.`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Failed to update payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSlotSelectedFromOptimizer = (time: string, date: string) => {
    setShowOptimizerModal(false);
    setShowBookModal(true);
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Master Schedule..." />;
  }

  const filteredAppts = appointments.filter((a) => {
    const cat = categorizeAppointmentDate(a.appointment_date);
    if (filterTab === 'today') return cat === 'TODAY';
    if (filterTab === 'upcoming') return cat === 'UPCOMING';
    return true;
  });

  return (
    <View style={styles.container}>
      <Header title="Clinic Appointments" subtitle="Reception Schedule & Booking Desk" showLogout={true} />

      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <Button
          title="+ Book Consultation"
          onPress={() => setShowBookModal(true)}
          variant="primary"
          size="medium"
          style={{ width: '48.5%' }}
        />
        <Button
          title="Slot Optimizer"
          onPress={() => setShowOptimizerModal(true)}
          variant="secondary"
          size="medium"
          style={{ width: '48.5%' }}
        />
      </View>

      {/* Select Patient Selector for Receptionist */}
      <View style={[styles.patientSelectorRow, { paddingHorizontal: horizontalPadding, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <Text style={styles.selectLabel}>Booking Patient:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {patients.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={[styles.patientChip, selectedPatientId === p._id && styles.activePatientChip]}
              onPress={() => {
                setSelectedPatientId(p._id);
                setSelectedPatientName(p.full_name);
              }}
              activeOpacity={0.8}
            >
              <Icon name="user" size={12} color={selectedPatientId === p._id ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.patientChipText, selectedPatientId === p._id && styles.activePatientChipText]}>
                {p.full_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Segmented Filter Bar */}
      <View style={[styles.tabBarWrapper, { maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center', paddingHorizontal: horizontalPadding }]}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'today' && styles.activeTabItem]}
            onPress={() => setFilterTab('today')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterTab === 'today' && styles.activeTabText]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'upcoming' && styles.activeTabItem]}
            onPress={() => setFilterTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterTab === 'upcoming' && styles.activeTabText]}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'all' && styles.activeTabItem]}
            onPress={() => setFilterTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterTab === 'all' && styles.activeTabText]}>
              All ({appointments.length})
            </Text>
          </TouchableOpacity>
        </View>
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

        {filteredAppts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="calendar" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptyDesc}>No clinic appointments match the selected filter.</Text>
          </Card>
        ) : (
          filteredAppts.map((item) => (
            <Card key={item._id} style={styles.apptCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatar}>
                    <Icon name="user" size={14} color={Colors.primary} />
                  </View>
                  <Text style={styles.patientName}>
                    {(item.patientId && typeof item.patientId === 'object') ? item.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getBadgeBg(item.status) }]}>
                  <Text style={[styles.statusBadgeText, { color: getBadgeColor(item.status) }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="treatment" size={12} color={Colors.primary} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Treatment: </Text>
                  {item.treatment}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="calendar" size={12} color={Colors.textSecondary} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Schedule: </Text>
                  {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="doctor" size={12} color={Colors.textSecondary} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Doctor: </Text>
                  {(item.doctorId && typeof item.doctorId === 'object') ? item.doctorId.full_name : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="therapist" size={12} color={Colors.textSecondary} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Therapist: </Text>
                  {(item.therapistId && typeof item.therapistId === 'object') ? item.therapistId.full_name : 'N/A'}
                </Text>
              </View>

              {/* Payment & Status Control Actions */}
              <View style={styles.actionSection}>
                <View style={styles.paymentRow}>
                  <Text style={styles.costText}>
                    Fee: ₹{item.cost || 1500} {item.status === 'cancelled' ? '(Cancelled)' : ''}
                  </Text>
                  {item.status !== 'cancelled' && (
                    <Button
                      title={item.isPaid ? 'PAID' : 'Mark Paid'}
                      onPress={() => handleTogglePayment(item._id, !!item.isPaid)}
                      loading={updatingId === item._id}
                      size="small"
                      variant={item.isPaid ? 'outline' : 'primary'}
                      style={{ minWidth: 90 }}
                    />
                  )}
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Change Status:</Text>
                  <View style={styles.btnGroup}>
                    {item.status !== 'completed' && (
                      <Button
                        title="Completed"
                        onPress={() => handleUpdateStatus(item._id, 'completed')}
                        loading={updatingId === item._id}
                        size="small"
                        variant="outline"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    {item.status !== 'cancelled' && (
                      <Button
                        title="Cancel"
                        onPress={() => handleUpdateStatus(item._id, 'cancelled')}
                        loading={updatingId === item._id}
                        size="small"
                        variant="danger"
                      />
                    )}
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Smart Scheduling Optimizer Modal */}
      <SmartSchedulingModal
        visible={showOptimizerModal}
        onClose={() => setShowOptimizerModal(false)}
        staffId={doctors[0]?._id || therapists[0]?._id}
        staffName={doctors[0]?.full_name || therapists[0]?.full_name}
        onSelectSlot={handleSlotSelectedFromOptimizer}
      />

      {/* Real Availability Book Appointment Modal */}
      <BookAppointmentModal
        visible={showBookModal}
        onClose={() => setShowBookModal(false)}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        onSuccess={fetchData}
      />
    </View>
  );
}

const getBadgeBg = (status: AppointmentStatus) => {
  switch (status) {
    case 'completed':
      return Colors.success + '18';
    case 'cancelled':
      return Colors.error + '18';
    case 'in-progress':
      return Colors.warning + '18';
    case 'scheduled':
    default:
      return Colors.primary + '15';
  }
};

const getBadgeColor = (status: AppointmentStatus) => {
  switch (status) {
    case 'completed':
      return Colors.success;
    case 'cancelled':
      return Colors.error;
    case 'in-progress':
      return Colors.warning;
    case 'scheduled':
    default:
      return Colors.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  patientSelectorRow: {
    marginTop: 10,
  },
  selectLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  patientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    minHeight: 34,
  },
  activePatientChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  patientChipText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activePatientChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  tabBarWrapper: {
    paddingTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTabItem: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
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
    marginTop: 4,
  },
  itemDetail: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.text,
  },
  detailLabel: {
    color: Colors.textSecondary,
  },
  actionSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  btnGroup: {
    flexDirection: 'row',
  },
});
