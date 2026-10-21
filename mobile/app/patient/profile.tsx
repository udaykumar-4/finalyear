import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import { useResponsive } from '../../constants/Layout';

export default function PatientProfileScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading, updateUserInContext, logout } = useAuth();
  const router = useRouter();

  // Form Fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');

  // Vitals
  const [bp, setBp] = useState(user?.bloodPressure || '');
  const [hr, setHr] = useState(user?.heartRate || '');
  const [weight, setWeight] = useState(user?.weight || '');
  const [temp, setTemp] = useState(user?.temperature || '');

  const [saving, setSaving] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAge(user.age ? String(user.age) : '');
      setGender(user.gender || 'Male');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setEmergencyContact(user.emergencyContact || '');
      setBloodGroup(user.bloodGroup || '');
      setAllergies(user.allergies || '');
      setBp(user.bloodPressure || '');
      setHr(user.heartRate || '');
      setWeight(user.weight || '');
      setTemp(user.temperature || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        full_name: fullName.trim(),
        age: age ? parseInt(age, 10) : undefined,
        gender,
        phone: phone.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        bloodGroup: bloodGroup.trim(),
        allergies: allergies.trim(),
        bloodPressure: bp.trim(),
        heartRate: hr.trim(),
        weight: weight.trim(),
        temperature: temp.trim(),
      });

      updateUserInContext(updated);
      Alert.alert('Profile Saved', 'Your personal details and vitals have been updated.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <LoadingScreen message="Loading Profile Settings..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="My Profile" subtitle="Account & Health Summary" showLogout={true} />

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
        {/* Personal Details */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="user" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Personal Details</Text>
          </View>

          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="Email Address (Read-only)"
            value={user?.email}
            editable={false}
            style={{ backgroundColor: Colors.surface }}
          />

          <View style={styles.rowGrid}>
            <Input
              label="Age"
              placeholder="e.g. 34"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
              containerStyle={{ flex: 1, marginRight: 8 }}
            />
            <Input
              label="Blood Group"
              placeholder="e.g. O+"
              value={bloodGroup}
              onChangeText={setBloodGroup}
              containerStyle={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.activeGenderChip]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderText, gender === g && styles.activeGenderText]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Phone Number"
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Input
            label="Residential Address"
            placeholder="e.g. 123 MG Road, Bangalore"
            value={address}
            onChangeText={setAddress}
          />

          <Input
            label="Emergency Contact"
            placeholder="Name - +91 9876543211"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
          />

          <Input
            label="Known Allergies / Medical Notes"
            placeholder="e.g. Dust allergy, Lactose intolerance"
            value={allergies}
            onChangeText={setAllergies}
          />
        </Card>

        {/* Vital Signs */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="heart" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Vital Signs Record</Text>
          </View>

          <View style={styles.rowGrid}>
            <Input
              label="Blood Pressure"
              placeholder="120/80 mmHg"
              value={bp}
              onChangeText={setBp}
              containerStyle={{ flex: 1, marginRight: 8 }}
            />
            <Input
              label="Heart Rate"
              placeholder="72 bpm"
              value={hr}
              onChangeText={setHr}
              containerStyle={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          <View style={styles.rowGrid}>
            <Input
              label="Weight"
              placeholder="68 kg"
              value={weight}
              onChangeText={setWeight}
              containerStyle={{ flex: 1, marginRight: 8 }}
            />
            <Input
              label="Temperature"
              placeholder="98.6 °F"
              value={temp}
              onChangeText={setTemp}
              containerStyle={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          <Button
            title="Save Profile & Vitals"
            onPress={handleSaveProfile}
            loading={saving}
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Account Controls */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="gear" size={15} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Account Session</Text>
          </View>
          <Button
            title="Sign Out of Mobile App"
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
    marginVertical: 6,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
  },
  rowGrid: {
    flexDirection: 'row',
  },
  label: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  activeGenderChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeGenderText: {
    color: Colors.white,
    fontWeight: '700',
  },
});
