import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Config from '../../constants/Config';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { useResponsive } from '../../constants/Layout';

export default function AdminMoreScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading, updateUserInContext, logout } = useAuth();
  const router = useRouter();

  const [designation, setDesignation] = useState(user?.designation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        designation: designation.trim(),
        phone: phone.trim(),
      });
      updateUserInContext(updated);
      Alert.alert('Profile Saved', 'Your admin profile details have been updated.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Failed to update admin profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Admin Controls" subtitle="System Configuration & Management" showLogout={true} />

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
      >
        {/* Admin Profile Settings */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Icon name="admin" size={15} color={Colors.primary} />
            <Text style={styles.cardTitle}>Admin Profile Settings</Text>
          </View>

          <Input
            label="Full Name (Read-only)"
            value={user?.full_name}
            editable={false}
            style={{ backgroundColor: Colors.surface }}
          />

          <Input
            label="Email Address (Read-only)"
            value={user?.email}
            editable={false}
            style={{ backgroundColor: Colors.surface }}
          />

          <Input
            label="Administrator Title"
            placeholder="Super Administrator"
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
            title="Save Admin Profile"
            onPress={handleSaveProfile}
            loading={saving}
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* System Environment Info */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Icon name="gear" size={15} color={Colors.primary} />
            <Text style={styles.cardTitle}>Mobile App & Server Environment</Text>
          </View>
          <Text style={styles.infoText}>API Endpoint Base URL: {Config.apiUrl}</Text>
          <Text style={styles.infoText}>Storage Key: {Config.secureStoreKeys.userToken}</Text>
          <Text style={styles.infoText}>Target Environment: Expo SDK 57 / React Native</Text>
          <Text style={styles.infoText}>Supported Roles: Admin, Doctor, Therapist, Patient, Receptionist</Text>
        </Card>

        {/* Account Session */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <Icon name="shield" size={15} color={Colors.primary} />
            <Text style={styles.cardTitle}>Account Session</Text>
          </View>
          <Button
            title="Sign Out of Admin Portal"
            onPress={logout}
            variant="danger"
            size="medium"
          />
        </Card>
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
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginBottom: 14,
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
  },
  infoText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 17,
  },
});
