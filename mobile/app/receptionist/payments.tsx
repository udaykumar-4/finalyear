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
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { useResponsive } from '../../constants/Layout';

export default function ReceptionistPaymentsScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'unpaid' | 'paid' | 'all'>('unpaid');

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
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing records.');
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

  const handleTogglePayment = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      await appointmentService.updatePaymentStatus(id, !currentStatus);
      Alert.alert(
        'Billing Settled',
        `Payment marked as ${!currentStatus ? 'PAID' : 'UNPAID'}.`
      );
      fetchData();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Failed to update payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Billing & Cash Desk..." />;
  }

  // Calculate Billing Metrics
  const paidAppointments = appointments.filter((a) => a.isPaid);
  const unpaidAppointments = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled');

  const totalPaidRevenue = paidAppointments.reduce((acc, a) => acc + (a.cost || 1500), 0);
  const totalPendingBilling = unpaidAppointments.reduce((acc, a) => acc + (a.cost || 1500), 0);

  const filteredItems = appointments.filter((a) => {
    if (filterTab === 'unpaid') return !a.isPaid && a.status !== 'cancelled';
    if (filterTab === 'paid') return a.isPaid;
    return a.status !== 'cancelled' || a.isPaid;
  });

  return (
    <View style={styles.container}>
      <Header title="Billing & Payments" subtitle="Collection & Receipts Desk" showLogout={true} />

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

        {/* Revenue Summary Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Collected Revenue"
            value={`₹${totalPaidRevenue.toLocaleString('en-IN')}`}
            icon="card"
            color={Colors.success}
          />
          <StatCard
            title="Pending Billing"
            value={`₹${totalPendingBilling.toLocaleString('en-IN')}`}
            icon="clock"
            color={Colors.warning}
          />
        </View>

        {/* Filter Segmented Control */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'unpaid' && styles.activeTabItem]}
            onPress={() => setFilterTab('unpaid')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterTab === 'unpaid' && styles.activeTabText]}>
              Unpaid ({unpaidAppointments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'paid' && styles.activeTabItem]}
            onPress={() => setFilterTab('paid')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterTab === 'paid' && styles.activeTabText]}>
              Paid ({paidAppointments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'all' && styles.activeTabItem]}
            onPress={() => setFilterTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterTab === 'all' && styles.activeTabText]}>
              All ({appointments.filter(a => a.status !== 'cancelled' || a.isPaid).length})
            </Text>
          </TouchableOpacity>
        </View>

        {filteredItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="card" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Billing Records</Text>
            <Text style={styles.emptyDesc}>No appointment bills match the selected filter.</Text>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item._id} style={styles.billCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <View style={styles.patientAvatar}>
                    <Icon name="user" size={14} color={Colors.primary} />
                  </View>
                  <Text style={styles.patientName}>
                    {(item.patientId && typeof item.patientId === 'object') ? item.patientId.full_name : 'Patient'}
                  </Text>
                </View>
                <View style={[styles.costBadgeContainer, { backgroundColor: item.isPaid ? Colors.success + '15' : Colors.warning + '18' }]}>
                  <Text style={[styles.costBadge, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textSecondary : Colors.warning) }]}>
                    ₹{item.cost || 1500}
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

              <View style={styles.cardFooter}>
                <View style={[styles.statusChip, { backgroundColor: item.isPaid ? Colors.success + '15' : Colors.warning + '18' }]}>
                  <Text style={[styles.statusText, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textSecondary : Colors.warning) }]}>
                    {item.isPaid ? 'PAID' : (item.status === 'cancelled' ? 'CANCELLED' : 'UNPAID PENDING')}
                  </Text>
                </View>
                {item.status !== 'cancelled' && (
                  <Button
                    title={item.isPaid ? 'Mark Unpaid' : 'Settle Payment'}
                    onPress={() => handleTogglePayment(item._id, !!item.isPaid)}
                    loading={updatingId === item._id}
                    size="small"
                    variant={item.isPaid ? 'outline' : 'primary'}
                    style={{ minWidth: 104 }}
                  />
                )}
              </View>
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
    paddingTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 10,
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
  billCard: {
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
  costBadgeContainer: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  costBadge: {
    ...Typography.metric,
    fontSize: 14,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  itemDetail: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.text,
  },
  detailLabel: {
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
