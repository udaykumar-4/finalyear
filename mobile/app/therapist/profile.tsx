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
import feedbackService from '../../services/feedbackService';
import userService from '../../services/userService';
import { Feedback } from '../../types/feedback';
import { BlockedSlot } from '../../types/user';
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

export default function TherapistProfileScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading, updateUserInContext, logout } = useAuth();
  const router = useRouter();

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'feedback' | 'slots' | 'profile'>('feedback');

  // Slot blocker state
  const [blockDate, setBlockDate] = useState('2026-08-22');
  const [blockTime, setBlockTime] = useState('11:00');
  const [blocking, setBlocking] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  // Profile Editor state
  const [designation, setDesignation] = useState(user?.designation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'therapist')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setError(null);
    try {
      const fbData = await feedbackService.getTherapistFeedback();
      setFeedbackList(fbData);
    } catch (err: any) {
      setError(err.message || 'Failed to load therapist reviews.');
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

  const handleBlockSlot = async () => {
    if (!blockDate || !blockTime) {
      Alert.alert('Validation Error', 'Please enter date and time to block.');
      return;
    }

    setBlocking(true);
    try {
      const updatedUser = await userService.blockSlot({ date: blockDate, time: blockTime });
      updateUserInContext(updatedUser);
      Alert.alert('Slot Blocked', `Time slot ${blockDate} at ${blockTime} blocked.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to block time slot.');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockSlot = async (slotId?: string) => {
    if (!slotId) return;
    setUnblockingId(slotId);
    try {
      const updatedUser = await userService.unblockSlot(slotId);
      updateUserInContext(updatedUser);
      Alert.alert('Slot Unblocked', 'Time slot removed from blocked schedule.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to unblock slot.');
    } finally {
      setUnblockingId(null);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile({
        designation: designation.trim(),
        phone: phone.trim(),
      });
      updateUserInContext(updated);
      Alert.alert('Profile Saved', 'Your therapist profile has been updated.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Therapist Portal..." />;
  }

  const blockedSlots: BlockedSlot[] = user?.blockedSlots || [];

  return (
    <View style={styles.container}>
      <Header title="Therapist Profile" subtitle="Account & Availability Settings" showLogout={true} />

      {/* Segmented Control Bar */}
      <View style={[styles.tabBarWrapper, { maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center', paddingHorizontal: horizontalPadding }]}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'feedback' && styles.activeTabItem]}
            onPress={() => setActiveTab('feedback')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>
              Reviews ({feedbackList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'slots' && styles.activeTabItem]}
            onPress={() => setActiveTab('slots')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'slots' && styles.activeTabText]}>
              Availability ({blockedSlots.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'profile' && styles.activeTabItem]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profile
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

        {activeTab === 'feedback' ? (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="star" size={15} color={Colors.secondary} />
                <Text style={styles.sectionTitle}>Patient Reviews & Session Ratings</Text>
              </View>
            </View>

            {feedbackList.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Icon name="star" size={32} color={Colors.secondary} />
                </View>
                <Text style={styles.emptyTitle}>No Therapist Reviews Yet</Text>
                <Text style={styles.emptyDesc}>Patient reviews submitted for your Panchakarma sessions will appear here.</Text>
              </Card>
            ) : (
              feedbackList.map((fb) => (
                <Card key={fb._id} style={styles.fbCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.patientRow}>
                      <View style={styles.patientAvatar}>
                        <Icon name="user" size={13} color={Colors.primary} />
                      </View>
                      <Text style={styles.patientName}>
                        {(fb.patientId && typeof fb.patientId === 'object') ? fb.patientId.full_name : 'Patient'}
                      </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={12} color={Colors.secondary} />
                      <Text style={styles.ratingBadgeText}>{fb.therapistRating || fb.overallRating} / 5</Text>
                    </View>
                  </View>

                  {fb.therapistFeedback ? (
                    <Text style={styles.fbText}>"{fb.therapistFeedback}"</Text>
                  ) : fb.overallFeedback ? (
                    <Text style={styles.fbText}>"{fb.overallFeedback}"</Text>
                  ) : null}

                  {fb.createdAt && (
                    <Text style={styles.dateText}>
                      Logged on {new Date(fb.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </Card>
              ))
            )}
          </View>
        ) : activeTab === 'slots' ? (
          <View>
            <Card style={styles.slotCard}>
              <View style={styles.cardTitleRow}>
                <Icon name="clock" size={15} color={Colors.warning} />
                <Text style={styles.cardTitle}>Block Therapy Time Slot</Text>
              </View>
              <Text style={styles.cardSub}>Restricts scheduling during your personal unavailable hours.</Text>

              <Input
                label="Date to Block (YYYY-MM-DD)"
                placeholder="2026-08-22"
                value={blockDate}
                onChangeText={setBlockDate}
              />

              <Input
                label="Time to Block (HH:MM)"
                placeholder="11:00"
                value={blockTime}
                onChangeText={setBlockTime}
              />

              <Button
                title="Block Time Slot"
                onPress={handleBlockSlot}
                loading={blocking}
                variant="danger"
                style={{ marginTop: 8 }}
              />
            </Card>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="calendar" size={15} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Your Blocked Slots ({blockedSlots.length})</Text>
              </View>
            </View>

            {blockedSlots.length === 0 ? (
              <Card style={styles.subCard}>
                <Text style={styles.emptyText}>No time slots currently blocked.</Text>
              </Card>
            ) : (
              blockedSlots.map((slot) => (
                <Card key={slot._id || slot.time} style={styles.slotItemCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.slotTimeRow}>
                      <Icon name="clock" size={13} color={Colors.warning} />
                      <Text style={styles.slotText}>
                        {new Date(slot.date).toLocaleDateString()} at {slot.time}
                      </Text>
                    </View>
                    {slot._id && (
                      <Button
                        title="Unblock"
                        onPress={() => handleUnblockSlot(slot._id)}
                        loading={unblockingId === slot._id}
                        size="small"
                        variant="outline"
                      />
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        ) : (
          <View>
            <Card style={styles.profileCard}>
              <View style={styles.cardTitleRow}>
                <Icon name="therapist" size={15} color={Colors.primary} />
                <Text style={styles.cardTitle}>Therapist Profile Settings</Text>
              </View>

              <Input
                label="Full Name (Read-only)"
                value={user?.full_name}
                editable={false}
                style={{ backgroundColor: Colors.surface }}
              />

              <Input
                label="Clinical Designation / Certification"
                placeholder="Certified Panchakarma Therapist"
                value={designation}
                onChangeText={setDesignation}
              />

              <Input
                label="Contact Phone"
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Button
                title="Save Therapist Profile"
                onPress={handleSaveProfile}
                loading={savingProfile}
                style={{ marginTop: 10 }}
              />
            </Card>

            <Card style={styles.profileCard}>
              <View style={styles.cardTitleRow}>
                <Icon name="gear" size={15} color={Colors.primary} />
                <Text style={styles.cardTitle}>Account Session</Text>
              </View>
              <Button
                title="Sign Out of Therapist Portal"
                onPress={logout}
                variant="danger"
                size="medium"
              />
            </Card>
          </View>
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
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  scrollContent: {
    paddingTop: 10,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
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
    backgroundColor: Colors.secondary + '18',
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
  fbCard: {
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
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    ...Typography.bodyMedium,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
  },
  fbText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  dateText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
  },
  cardSub: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  slotItemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 4,
    padding: 12,
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotText: {
    ...Typography.bodyMedium,
    fontSize: 13,
    color: Colors.text,
  },
  subCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
  },
  emptyText: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 6,
    padding: 14,
  },
});
