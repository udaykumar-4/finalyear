import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  Heart,
  DollarSign,
  Activity,
  Award,
  RefreshCw,
} from 'lucide-react';
import { analyticsService, OutcomeAnalyticsData } from '../../services/analyticsService';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import ClinicalAnalyticsGraphs from '../../components/analytics/ClinicalAnalyticsGraphs';

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<OutcomeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month' | 'quarter'>('all');

  const fetchAnalytics = useCallback((range: 'all' | 'week' | 'month' | 'quarter', refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    analyticsService
      .getGlobalOutcomes(range, refresh)
      .then(setData)
      .catch((err) => console.warn('Failed to load global outcome analytics:', err))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [fetchAnalytics, timeRange]);

  const handleTimeRangeChange = (range: 'all' | 'week' | 'month' | 'quarter') => {
    setTimeRange(range);
  };

  const handleRefresh = () => {
    fetchAnalytics(timeRange, true);
  };

  const op = data?.operational;
  const adh = data?.adherence;
  const pr = data?.patientReported;
  const clin = data?.clinical;

  const handleDownloadReport = () => {
    const reportContent = `
AYURSUTRA CLINICAL OUTCOME & OPERATIONAL AUDIT REPORT
Generated: ${new Date().toLocaleString()}
Filter Period: ${timeRange.toUpperCase()}
--------------------------------------------------
OPERATIONAL METRICS (DATABASE RECORD):
Total Appointments: ${op?.totalAppointments ?? 0}
Completed Sessions: ${op?.completedAppointments ?? 0}
Scheduled Sessions: ${op?.scheduledAppointments ?? 0}
In-Progress Sessions: ${op?.inProgressAppointments ?? 0}
Cancelled Sessions: ${op?.cancelledAppointments ?? 0}
Completion Rate: ${op?.completionRate ?? 0}%
Cancellation Rate: ${op?.cancellationRate ?? 0}%
Revenue Collected: ₹${op?.totalRevenueCollected?.toLocaleString() ?? 0}
Pending Receivables: ₹${op?.pendingReceivables?.toLocaleString() ?? 0}

TREATMENT ADHERENCE:
Prescriptions Managed: ${adh?.totalPrescriptions ?? 0}
Completed Prescriptions: ${adh?.completedPrescriptions ?? 0}
Active Prescriptions: ${adh?.activePrescriptions ?? 0}
Panchakarma Sessions Prescribed: ${adh?.totalPrescribedSessions ?? 0}
Panchakarma Sessions Completed: ${adh?.totalCompletedSessions ?? 0}
Protocol Adherence Rate: ${adh?.adherenceRate ?? 0}%

PATIENT FEEDBACK OUTCOMES:
Total Feedback Submissions: ${pr?.totalFeedbackCount ?? 0}
Average Overall Rating: ${pr && pr.avgOverallRating ? `${pr.avgOverallRating} / 5` : 'No reviews recorded'}
Average Physician Rating: ${pr && pr.avgDoctorRating ? `${pr.avgDoctorRating} / 5` : 'No reviews recorded'}
Average Therapist Rating: ${pr && pr.avgTherapistRating ? `${pr.avgTherapistRating} / 5` : 'No reviews recorded'}

CLINICAL & PRAKRITI METRICS:
Total Patients: ${clin?.totalPatientCount ?? 0}
Patients with Documented Vitals: ${clin?.patientsWithVitalsRecorded ?? 0}
Prakriti Assessment Coverage Rate: ${clin?.prakritiAssessmentRate ?? 0}%
--------------------------------------------------
Audited by AyurSutra Live Database Engine
`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AyurSutra_Clinical_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Clinical Outcomes & Intelligence Reports
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Dynamic analytics queried directly from live database appointments, prescriptions, and assessments
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant="outline"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw size={15} />}
          >
            Refresh
          </Button>
          <Button variant="primary" onClick={handleDownloadReport} leftIcon={<Download size={16} />}>
            Export Audit Report
          </Button>
        </div>
      </div>

      {/* KPI Highlights - 100% database driven */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Clinical Completion Rate"
          value={`${op?.completionRate ?? 0}%`}
          subtitle={`${op?.completedAppointments ?? 0} of ${op?.totalAppointments ?? 0} sessions completed`}
          icon={<CheckCircle2 size={22} />}
          accentColor="var(--color-emerald)"
        />
        <StatCard
          title="Protocol Adherence"
          value={`${adh?.adherenceRate ?? 0}%`}
          subtitle={`${adh?.totalCompletedSessions ?? 0} of ${adh?.totalPrescribedSessions ?? 0} prescribed procedures`}
          icon={<Activity size={22} />}
          accentColor="var(--color-forest)"
        />
        <StatCard
          title="Patient Quality Score"
          value={pr && pr.totalFeedbackCount > 0 && pr.avgOverallRating ? `${pr.avgOverallRating} / 5` : 'No reviews'}
          subtitle={`${pr?.totalFeedbackCount ?? 0} patient submissions recorded`}
          icon={<Award size={22} />}
          accentColor="var(--color-sand)"
        />
        <StatCard
          title="Collected Revenue"
          value={`₹${(op?.totalRevenueCollected || 0).toLocaleString()}`}
          subtitle={`₹${(op?.pendingReceivables || 0).toLocaleString()} pending receivables`}
          icon={<DollarSign size={22} />}
          accentColor="var(--color-amber)"
        />
      </div>

      {/* Multi-Attribute Clinical Graphs & Distribution Analytics */}
      <ClinicalAnalyticsGraphs
        data={data}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Two-column deep dive */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Panchakarma Course Progression */}
        <Card title="Panchakarma Course Completion & Adherence" subtitle="Detailed therapeutic regimen breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--color-slate-700)' }}>Full Course Adherence</span>
                <span style={{ color: 'var(--color-forest)' }}>{adh?.adherenceRate ?? 0}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${adh?.adherenceRate ?? 0}%`, height: '100%', backgroundColor: 'var(--color-forest)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--color-slate-700)' }}>Appointment Attendance Rate</span>
                <span style={{ color: 'var(--color-emerald)' }}>{op?.completionRate ?? 0}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${op?.completionRate ?? 0}%`, height: '100%', backgroundColor: 'var(--color-emerald)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.5rem' }}>
                Operational Overview from Database
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
                <div>Total Prescriptions: <strong>{adh?.totalPrescriptions || 0}</strong></div>
                <div>Completed Courses: <strong>{adh?.completedPrescriptions || 0}</strong></div>
                <div>Prescribed Sessions: <strong>{adh?.totalPrescribedSessions || 0}</strong></div>
                <div>Cancelled Sessions: <strong>{op?.cancelledAppointments || 0}</strong></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quality and Clinician Ratings */}
        <Card title="Patient Feedback & Ratings" subtitle="Post-session patient evaluation averages from database">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>Doctor Consultations</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Prakriti, pulse exam, prescription clarity</div>
              </div>
              <span className={`badge ${pr && pr.avgDoctorRating ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.9375rem', fontWeight: 800 }}>
                {pr && pr.avgDoctorRating ? `${pr.avgDoctorRating} / 5` : 'No ratings yet'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>Panchakarma Therapists</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Session comfort, protocol accuracy, warmth</div>
              </div>
              <span className={`badge ${pr && pr.avgTherapistRating ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.9375rem', fontWeight: 800 }}>
                {pr && pr.avgTherapistRating ? `${pr.avgTherapistRating} / 5` : 'No ratings yet'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>Overall Facility & Experience</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Front desk, cleanliness, room environment</div>
              </div>
              <span className={`badge ${pr && pr.avgOverallRating ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.9375rem', fontWeight: 800 }}>
                {pr && pr.avgOverallRating ? `${pr.avgOverallRating} / 5` : 'No ratings yet'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminReportsPage;
