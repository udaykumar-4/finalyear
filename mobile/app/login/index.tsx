import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useResponsive } from '../../constants/Layout';

const ROLE_OPTIONS: { role: UserRole; title: string; subtitle: string; icon: string; defaultEmail: string }[] = [
  { role: 'admin', title: 'Administrator', subtitle: 'Clinic staff, audits & operations', icon: '◈', defaultEmail: 'admin@ayursutra.com' },
  { role: 'doctor', title: 'Ayurvedic Physician', subtitle: 'Consultations, patient records & Rx', icon: '✚', defaultEmail: 'doctor@ayursutra.com' },
  { role: 'therapist', title: 'Panchakarma Therapist', subtitle: 'Therapy sessions & progress tracking', icon: '☯', defaultEmail: 'therapist@ayursutra.com' },
  { role: 'receptionist', title: 'Front-Desk Officer', subtitle: 'Patient walk-ins, scheduling & billing', icon: '◪', defaultEmail: 'receptionist@ayursutra.com' },
  { role: 'patient', title: 'Patient / Client', subtitle: 'Appointments, therapy plans & Prakriti', icon: '🪷', defaultEmail: 'patient@ayursutra.com' },
];

export default function LoginScreen() {
  const { insets, isSmallDevice, horizontalPadding } = useResponsive();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Registration & Login Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('patient');
  const [formError, setFormError] = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setRegisterRole(role);
    const roleOpt = ROLE_OPTIONS.find((r) => r.role === role);
    if (roleOpt && !isRegisterMode) {
      setEmail(roleOpt.defaultEmail);
      setPassword('password123'); // Default sample password
    }
    setFormError(null);
    clearError();
  };

  const handleFillDemo = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegisterMode(false);
    const roleOpt = ROLE_OPTIONS.find((r) => r.role === role);
    if (roleOpt) {
      setEmail(roleOpt.defaultEmail);
      setPassword('password123');
    }
    setFormError(null);
    clearError();
  };

  const handleOpenRegister = (role?: UserRole) => {
    const targetRole = role || selectedRole || 'patient';
    setRegisterRole(targetRole);
    setSelectedRole(targetRole);
    setIsRegisterMode(true);
    setFullName('');
    setEmail('');
    setPassword('password123');
    setDesignation(targetRole === 'doctor' ? 'Ayurvedic Physician' : targetRole === 'therapist' ? 'Panchakarma Therapist' : '');
    setFormError(null);
    clearError();
  };

  const handleLoginSubmit = async () => {
    if (!selectedRole) {
      setFormError('Please select a role before signing in.');
      return;
    }
    if (!email.trim() || !password) {
      setFormError('Please enter both email address and password.');
      return;
    }

    setFormError(null);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
      });

      navigateToRole(selectedRole);
    } catch (err: any) {
      // Error handled in AuthContext
    }
  };

  const handleRegisterSubmit = async () => {
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !password) {
      setFormError('Please enter an email address and password.');
      return;
    }
    if (password.length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    setFormError(null);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: registerRole,
        designation: designation.trim() || undefined,
      });

      navigateToRole(registerRole);
    } catch (err: any) {
      // Error handled in AuthContext
    }
  };

  const navigateToRole = (role: UserRole) => {
    switch (role) {
      case 'admin':
        router.replace('/admin');
        break;
      case 'doctor':
        router.replace('/doctor');
        break;
      case 'therapist':
        router.replace('/therapist');
        break;
      case 'receptionist':
        router.replace('/receptionist');
        break;
      case 'patient':
        router.replace('/patient');
        break;
    }
  };

  const currentRoleOpt = ROLE_OPTIONS.find((r) => r.role === (isRegisterMode ? registerRole : selectedRole));

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
            paddingHorizontal: horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>
          {/* App Botanical Header */}
          <View style={styles.headerContainer}>
            <View style={styles.brandCrest}>
              <Text style={styles.brandCrestIcon}>🪷</Text>
            </View>
            <Text style={styles.title}>AyurSutra</Text>
            <Text style={styles.subtitle}>Intelligent Panchakarma Clinical Management</Text>
          </View>

          {/* Auth Mode Toggle (Sign In vs Register) */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeTab, !isRegisterMode && styles.modeTabActive]}
              onPress={() => {
                setIsRegisterMode(false);
                setFormError(null);
                clearError();
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeTabText, !isRegisterMode && styles.modeTabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, isRegisterMode && styles.modeTabActive]}
              onPress={() => handleOpenRegister(selectedRole || 'patient')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeTabText, isRegisterMode && styles.modeTabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* REGISTRATION FORM MODE */}
          {isRegisterMode ? (
            <Card style={styles.loginCard}>
              <View style={styles.loginCardHeader}>
                <TouchableOpacity
                  onPress={() => setIsRegisterMode(false)}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Back to Sign In</Text>
                </TouchableOpacity>
                <View style={styles.selectedRoleBadge}>
                  <Text style={styles.selectedRoleBadgeText}>
                    {registerRole.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.loginTitle}>
                {currentRoleOpt?.icon} Create {currentRoleOpt?.title} Account
              </Text>
              <Text style={styles.registerSubtitle}>
                Join AyurSutra healthcare clinical network.
              </Text>

              {/* Role Selection Chips for Registration */}
              <Text style={styles.inputLabelHeader}>Select Role *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleChipsRow}>
                {ROLE_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.role}
                    style={[
                      styles.roleChip,
                      registerRole === item.role && styles.roleChipActive,
                    ]}
                    onPress={() => {
                      setRegisterRole(item.role);
                      setSelectedRole(item.role);
                      if (item.role === 'doctor') setDesignation('Ayurvedic Physician');
                      else if (item.role === 'therapist') setDesignation('Panchakarma Therapist');
                      else setDesignation('');
                    }}
                  >
                    <Text style={styles.roleChipIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.roleChipText,
                        registerRole === item.role && styles.roleChipTextActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {(formError || error) ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠ {formError || error}</Text>
                </View>
              ) : null}

              <Input
                label="Full Name *"
                placeholder="e.g. Dr. Rajesh Sharma"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setFormError(null);
                }}
              />

              <Input
                label="Email Address *"
                placeholder="e.g. rajesh@ayursutra.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setFormError(null);
                }}
              />

              <Input
                label="Password *"
                placeholder="At least 4 characters"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setFormError(null);
                }}
              />

              {registerRole === 'doctor' || registerRole === 'therapist' ? (
                <Input
                  label="Designation / Qualification"
                  placeholder="e.g. BAMS, MD (Panchakarma)"
                  value={designation}
                  onChangeText={(text) => setDesignation(text)}
                />
              ) : null}

              <Button
                title={`Register as ${registerRole.toUpperCase()}`}
                onPress={handleRegisterSubmit}
                loading={isLoading}
                style={styles.submitBtn}
              />

              <TouchableOpacity
                style={styles.switchAuthBtn}
                onPress={() => setIsRegisterMode(false)}
              >
                <Text style={styles.switchAuthText}>
                  Already have an account? <Text style={styles.highlightText}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            /* SIGN IN MODE */
            <>
              {!selectedRole ? (
                <View style={styles.stepContainer}>
                  <Text style={styles.sectionTitle}>Select Portal to Sign In</Text>

                  {ROLE_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item.role}
                      style={styles.roleCard}
                      onPress={() => handleRoleSelect(item.role)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.roleIconBadge}>
                        <Text style={styles.roleIcon}>{item.icon}</Text>
                      </View>
                      <View style={styles.roleTextContainer}>
                        <Text style={styles.roleTitle}>{item.title}</Text>
                        <Text style={styles.roleSubtitle}>{item.subtitle}</Text>
                      </View>
                      <Text style={styles.arrowText}>→</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Quick Register Banner */}
                  <TouchableOpacity
                    style={styles.registerPromptBanner}
                    onPress={() => handleOpenRegister('patient')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.registerPromptText}>
                      New to AyurSutra? <Text style={styles.highlightText}>Create Patient Account</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Card style={styles.loginCard}>
                  <View style={styles.loginCardHeader}>
                    <TouchableOpacity
                      onPress={() => setSelectedRole(null)}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>← Change Portal</Text>
                    </TouchableOpacity>
                    <View style={styles.selectedRoleBadge}>
                      <Text style={styles.selectedRoleBadgeText}>
                        {selectedRole.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.loginTitle}>
                    {ROLE_OPTIONS.find((r) => r.role === selectedRole)?.icon}{' '}
                    {ROLE_OPTIONS.find((r) => r.role === selectedRole)?.title} Sign In
                  </Text>
                  <Text style={styles.loginSub}>
                    Enter your clinical credentials to access your dashboard.
                  </Text>

                  {(formError || error) ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>⚠ {formError || error}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="Email Address"
                    placeholder="user@ayursutra.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setFormError(null);
                    }}
                  />

                  <Input
                    label="Password"
                    placeholder="Enter password"
                    secureTextEntry
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setFormError(null);
                    }}
                  />

                  {/* Quick Fill Demo Credentials Bar */}
                  <View style={styles.demoFillContainer}>
                    <Text style={styles.demoFillLabel}>Demo Access:</Text>
                    <TouchableOpacity
                      style={styles.demoChip}
                      onPress={() => handleFillDemo(selectedRole)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.demoChipText}>
                        Fill {selectedRole} Credentials
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Button
                    title="Sign In"
                    onPress={handleLoginSubmit}
                    loading={isLoading}
                    style={styles.submitBtn}
                  />

                  <TouchableOpacity
                    style={styles.switchAuthBtn}
                    onPress={() => handleOpenRegister(selectedRole)}
                  >
                    <Text style={styles.switchAuthText}>
                      Need an account? <Text style={styles.highlightText}>Register as {selectedRole.toUpperCase()}</Text>
                    </Text>
                  </TouchableOpacity>
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandCrest: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  brandCrestIcon: {
    fontSize: 32,
  },
  title: {
    ...Typography.display,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.primary,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBEFEA',
    borderRadius: 14,
    padding: 3,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadowElevated,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepContainer: {
    width: '100%',
  },
  sectionTitle: {
    ...Typography.h2,
    fontSize: 17,
    marginBottom: 14,
    textAlign: 'center',
    color: Colors.text,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  roleIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleIcon: {
    fontSize: 20,
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  roleSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  arrowText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  registerPromptBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primarySubtle,
    borderStyle: 'dashed',
  },
  registerPromptText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  loginCard: {
    marginTop: 4,
    padding: 18,
  },
  loginCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedRoleBadge: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedRoleBadgeText: {
    color: Colors.primaryDark,
    fontWeight: '800',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  loginTitle: {
    ...Typography.h1,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.text,
    marginBottom: 2,
  },
  loginSub: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 17,
  },
  registerSubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  inputLabelHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleChipsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  roleChipIcon: {
    fontSize: 13,
    marginRight: 6,
    color: Colors.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12.5,
    fontWeight: '600',
  },
  demoFillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    backgroundColor: '#F3F7F4',
    padding: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoFillLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  demoChip: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoChipText: {
    color: Colors.primaryDark,
    fontSize: 11.5,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 4,
  },
  switchAuthBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchAuthText: {
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
