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
import reportService, { PatientReportData } from '../../services/reportService';
import Colors from '../../constants/Colors';
import Typography from '../../constants/Typography';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { useResponsive } from '../../constants/Layout';

export default function PatientReportScreen() {
  const { bottomContentPadding, horizontalPadding, containerMaxWidth } = useResponsive();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reportData, setReportData] = useState<PatientReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setError(null);
    try {
      const data = await reportService.getMyReport();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch medical health report.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExportPDF = () => {
    Alert.alert(
      'Medical Summary Ready',
      `Full report summary for ${reportData?.user.full_name || 'Patient'} loaded.\nTotal Appointments: ${reportData?.appointments.length || 0}\nPrescriptions: ${reportData?.prescriptions.length || 0}`
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Aggregating Health Records..." />;
  }

  const patient = reportData?.user || user;
  const docName = patient?.assignedDoctor && (typeof patient.assignedDoctor === 'object') ? patient.assignedDoctor.full_name : 'Assigned Doctor N/A';

  return (
    <View style={styles.container}>
      <Header title="My Medical Report" subtitle="Health Summary & Discharge Record" showLogout={true} />

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

        {/* Action Header Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerIconBadge}>
              <Icon name="report" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.bannerTitle}>Patient Health Report</Text>
              <Text style={styles.bannerSub}>Complete chronological history of consultations, prescriptions, and clinical notes.</Text>
            </View>
            <Button
              title="Export"
              onPress={handleExportPDF}
              size="small"
              variant="outline"
            />
          </View>
        </Card>

        {/* Section 1: Personal & Vitals */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="user" size={14} color={Colors.primary} />
            <Text style={styles.sectionTitle}>1. Personal & Vital Signs</Text>
          </View>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Full Name</Text>
              <Text style={styles.gridValue}>{patient?.full_name}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Email</Text>
              <Text style={styles.gridValue}>{patient?.email}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Age / Gender</Text>
              <Text style={styles.gridValue}>{patient?.age ? `${patient.age} yrs` : 'N/A'} • {patient?.gender || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Blood Group</Text>
              <Text style={styles.gridValue}>{patient?.bloodGroup || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Blood Pressure</Text>
              <Text style={styles.gridValue}>{patient?.bloodPressure || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Heart Rate</Text>
              <Text style={styles.gridValue}>{patient?.heartRate || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Weight</Text>
              <Text style={styles.gridValue}>{patient?.weight || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Temperature</Text>
              <Text style={styles.gridValue}>{patient?.temperature || 'N/A'}</Text>
            </View>
          </View>
        </Card>

        {/* Section 2: Assigned Care Team */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="doctor" size={14} color={Colors.primary} />
            <Text style={styles.sectionTitle}>2. Primary Care Physician</Text>
          </View>
          <View style={styles.physicianBox}>
            <View style={styles.physicianAvatar}>
              <Icon name="doctor" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.careDocName}>{docName}</Text>
              <Text style={styles.careDocSub}>Lead Ayurvedic Physician & Panchakarma Specialist</Text>
            </View>
          </View>
        </Card>

        {/* Section 3: Prescriptions History */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="treatment" size={14} color={Colors.primary} />
            <Text style={styles.sectionTitle}>3. Panchakarma Prescriptions ({reportData?.prescriptions.length || 0})</Text>
          </View>

          {!reportData?.prescriptions || reportData.prescriptions.length === 0 ? (
            <Text style={styles.emptyText}>No prescription history found.</Text>
          ) : (
            reportData.prescriptions.map((rx) => (
              <View key={rx._id} style={styles.historyRow}>
                <View style={styles.rowTop}>
                  <View style={styles.historyNameRow}>
                    <Icon name="pill" size={13} color={Colors.primary} />
                    <Text style={styles.rowTitle}>{rx.treatment}</Text>
                  </View>
                  <View style={[styles.rowBadge, { backgroundColor: rx.status === 'completed' ? Colors.success + '18' : Colors.warning + '18' }]}>
                    <Text style={[styles.rowBadgeText, { color: rx.status === 'completed' ? Colors.success : Colors.warning }]}>
                      {rx.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowSub}>
                  Duration: {rx.duration} days ({rx.progressCompleted} completed)
                </Text>
                {rx.notes ? <Text style={styles.rowNotes}>Doctor Notes: {rx.notes}</Text> : null}
              </View>
            ))
          )}
        </Card>

        {/* Section 4: Appointments History */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="calendar" size={14} color={Colors.primary} />
            <Text style={styles.sectionTitle}>4. Consultations & Sessions ({reportData?.appointments.length || 0})</Text>
          </View>

          {!reportData?.appointments || reportData.appointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointment history found.</Text>
          ) : (
            reportData.appointments.map((appt) => (
              <View key={appt._id} style={styles.historyRow}>
                <View style={styles.rowTop}>
                  <View style={styles.historyNameRow}>
                    <Icon name="calendar" size={13} color={Colors.primary} />
                    <Text style={styles.rowTitle}>{appt.treatment}</Text>
                  </View>
                  <View style={[styles.rowBadge, { backgroundColor: appt.status === 'completed' ? Colors.success + '18' : Colors.primary + '15' }]}>
                    <Text style={[styles.rowBadgeText, { color: appt.status === 'completed' ? Colors.success : Colors.primary }]}>
                      {appt.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rowSub}>
                  {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Section 5: Clinical Notes History */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="document" size={14} color={Colors.primary} />
            <Text style={styles.sectionTitle}>5. Clinical Progress Notes ({reportData?.notes.length || 0})</Text>
          </View>

          {!reportData?.notes || reportData.notes.length === 0 ? (
            <Text style={styles.emptyText}>No clinical notes recorded.</Text>
          ) : (
            reportData.notes.map((note) => (
              <View key={note._id} style={styles.historyRow}>
                <View style={styles.noteAuthorRow}>
                  <Icon name="user" size={12} color={Colors.primary} />
                  <Text style={styles.noteAuthor}>
                    {(note.authorId && typeof note.authorId === 'object') ? `${note.authorId.full_name} (${note.authorId.role})` : 'Author'}
                  </Text>
                </View>
                <Text style={styles.noteBody}>{note.note}</Text>
              </View>
            ))
          )}
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
    marginBottom: 10,
    padding: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTitle: {
    ...Typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  bannerSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    marginVertical: 6,
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 14.5,
    color: Colors.text,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: 10,
  },
  gridLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  gridValue: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  physicianBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  physicianAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  careDocName: {
    ...Typography.bodyMedium,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.text,
  },
  careDocSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '70',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  rowTitle: {
    ...Typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  rowBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rowBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
  },
  rowSub: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowNotes: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 3,
  },
  noteAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  noteAuthor: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  noteBody: {
    ...Typography.body,
    fontSize: 12.5,
    color: Colors.text,
    lineHeight: 18,
  },
  emptyText: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});
