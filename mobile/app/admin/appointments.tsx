import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { useResponsive } from '../../constants/Layout';

export default function AdminAppointmentsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load master appointment schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, status);
      Alert.alert('Status Updated', `Appointment status set to "${status}".`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Error', err.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    Alert.alert(
      'Delete Appointment Record',
      'Are you sure you want to delete this appointment from the master schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUpdatingId(id);
            try {
              await appointmentService.deleteAppointment(id);
              Alert.alert('Deleted', 'Appointment record removed.');
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete appointment.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Master Appointment Control..." />;
  }

  const filteredItems = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <View style={styles.container}>
      <Header title="All Appointments" subtitle="System-wide Scheduling Management" showLogout={true} />

      {/* Filter Chips */}
      <View style={[styles.filterWrapper, { maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRowContainer}
          contentContainerStyle={[styles.filterRowContent, { paddingHorizontal: horizontalPadding }]}
        >
          {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.activeFilterChip]}
              onPress={() => setFilterStatus(status)}
              activeOpacity={0.8}
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

        {filteredItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="calendar" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptyDesc}>No appointment records match the selected status filter.</Text>
          </Card>
        ) : (
          filteredItems.map((item) => (
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
                  {(item.doctorId && typeof item.doctorId === 'object') ? item.doctorId.full_name : 'Unassigned'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="therapist" size={12} color={Colors.textSecondary} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Therapist: </Text>
                  {(item.therapistId && typeof item.therapistId === 'object') ? item.therapistId.full_name : 'Unassigned'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="card" size={12} color={item.isPaid ? Colors.success : Colors.warning} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Cost / Fee: </Text>
                  ₹{item.cost || 1500} • <Text style={{ fontWeight: '700', color: item.isPaid ? Colors.success : Colors.warning }}>{item.isPaid ? 'PAID' : 'UNPAID PENDING'}</Text>
                </Text>
              </View>

              {/* Admin Actions */}
              <View style={styles.actionRow}>
                {item.status !== 'completed' && (
                  <Button
                    title="Mark Complete"
                    onPress={() => handleUpdateStatus(item._id, 'completed')}
                    loading={updatingId === item._id}
                    size="small"
                    variant="outline"
                    style={{ marginRight: 8, minWidth: 104 }}
                  />
                )}

                <Button
                  title="Delete Record"
                  onPress={() => handleDeleteAppointment(item._id)}
                  loading={updatingId === item._id}
                  size="small"
                  variant="danger"
                  style={{ minWidth: 100 }}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
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
  filterWrapper: {
    paddingVertical: 10,
  },
  filterRowContainer: {
    flexGrow: 0,
  },
  filterRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    minHeight: 34,
    justifyContent: 'center',
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
  },
  activeFilterChipText: {
    color: Colors.white,
  },
  scrollContent: {
    paddingTop: 6,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
});
