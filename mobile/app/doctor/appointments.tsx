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
import { Appointment, AppointmentStatus } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { categorizeAppointmentDate } from '../../utils/appointmentDateUtils';
import { useResponsive } from '../../constants/Layout';

export default function DoctorAppointmentsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming'>('today');

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
      const data = await appointmentService.getAppointments({ doctorId: user._id });
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor appointments.');
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

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, newStatus);
      Alert.alert('Status Updated', `Appointment status changed to "${newStatus}".`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Error', err.message || 'Failed to update appointment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Consultations Schedule..." />;
  }

  const filteredAppts = appointments.filter((a) => {
    const cat = categorizeAppointmentDate(a.appointment_date);
    if (filterTab === 'today') return cat === 'TODAY';
    if (filterTab === 'upcoming') return cat === 'UPCOMING';
    return true;
  });

  return (
    <View style={styles.container}>
      <Header title="Consultation Schedule" subtitle="Appointments & Patient Consultations" showLogout={true} />

      {/* Filter Tabs */}
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
            <Text style={styles.emptyTitle}>No Consultations Found</Text>
            <Text style={styles.emptyDesc}>No appointment records match the selected view filter.</Text>
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
                <Icon name="therapist" size={12} color={Colors.textSecondary} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Therapist: </Text>
                  {(item.therapistId && typeof item.therapistId === 'object') ? item.therapistId.full_name : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="card" size={12} color={item.isPaid ? Colors.success : Colors.warning} />
                <Text style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Payment: </Text>
                  <Text style={{ fontWeight: '700', color: item.isPaid ? Colors.success : Colors.warning }}>
                    {item.isPaid ? 'PAID (₹' + (item.cost || 1500) + ')' : 'UNPAID'}
                  </Text>
                </Text>
              </View>

              {/* Doctor Status Action Buttons */}
              <View style={styles.statusActionRow}>
                <Text style={styles.actionLabel}>Update Status:</Text>
                <View style={styles.actionBtnGroup}>
                  {item.status !== 'completed' && (
                    <Button
                      title="Complete"
                      onPress={() => handleUpdateStatus(item._id, 'completed')}
                      loading={updatingId === item._id}
                      size="small"
                      variant="primary"
                      style={styles.actionBtn}
                    />
                  )}

                  {item.status !== 'in-progress' && item.status !== 'completed' && (
                    <Button
                      title="In-Progress"
                      onPress={() => handleUpdateStatus(item._id, 'in-progress')}
                      loading={updatingId === item._id}
                      size="small"
                      variant="outline"
                      style={styles.actionBtn}
                    />
                  )}

                  {item.status !== 'cancelled' && item.status !== 'completed' && (
                    <Button
                      title="Cancel"
                      onPress={() => handleUpdateStatus(item._id, 'cancelled')}
                      loading={updatingId === item._id}
                      size="small"
                      variant="danger"
                      style={styles.actionBtn}
                    />
                  )}
                </View>
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
  tabBarWrapper: {
    paddingTop: 12,
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
  statusActionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLabel: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    minWidth: 78,
  },
});
