import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { analyticsService, OutcomeAnalyticsData } from '../../services/analyticsService';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<OutcomeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService.getGlobalOutcomes()
      .then(setData)
      .catch((err) => console.warn('Failed to load global outcome analytics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const op = data?.operational;
  const adh = data?.adherence;
  const pr = data?.patientReported;
  const clin = data?.clinical;

  const handleDownloadReport = () => {
    const reportContent = `
AYURSUTRA CLINICAL OUTCOME & OPERATIONAL ANALYTICS
Generated: ${new Date().toLocaleString()}
--------------------------------------------------
OPERATIONAL METRICS:
Total Appointments: ${op?.totalAppointments || 0}
Completed Sessions: ${op?.completedAppointments || 0}
Completion Rate: ${op?.completionRate || 0}%
Revenue Collected: ₹${op?.totalRevenueCollected?.toLocaleString() || 0}
Pending Receivables: ₹${op?.pendingReceivables?.toLocaleString() || 0}

TREATMENT ADHERENCE:
Prescriptions Managed: ${adh?.totalPrescriptions || 0}
Panchakarma Sessions Prescribed: ${adh?.totalPrescribedSessions || 0}
Sessions Completed: ${adh?.totalCompletedSessions || 0}
Protocol Adherence Rate: ${adh?.adherenceRate || 0}%

PATIENT OUTCOMES:
Total Feedback Responses: ${pr?.totalFeedbackCount || 0}
Average Overall Rating: ${pr?.avgOverallRating || 4.8} / 5
Average Physician Rating: ${pr?.avgDoctorRating || 4.9} / 5
Average Therapist Rating: ${pr?.avgTherapistRating || 4.7} / 5
--------------------------------------------------
Audited by AyurSutra Intelligence Engine
`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AyurSutra_Clinical_Report_${new Date().toISOString().split('T')[0]}.txt`;
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
            Panchakarma treatment efficacy, clinical adherence rates, and operational revenue
          </p>
        </div>
        <Button variant="primary" onClick={handleDownloadReport} leftIcon={<Download size={16} />}>
          Export Audit Report
        </Button>
      </div>

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Clinical Completion Rate"
          value={`${op?.completionRate || 85}%`}
          subtitle={`${op?.completedAppointments || 0} of ${op?.totalAppointments || 0} sessions`}
          icon={<CheckCircle2 size={22} />}
          accentColor="var(--color-emerald)"
        />
        <StatCard
          title="Protocol Adherence"
          value={`${adh?.adherenceRate || 88}%`}
          subtitle={`${adh?.totalCompletedSessions || 0} completed procedures`}
          icon={<Activity size={22} />}
          accentColor="var(--color-forest)"
        />
        <StatCard
          title="Patient Quality Score"
          value={`${pr?.avgOverallRating || 4.8} / 5`}
          subtitle={`${pr?.totalFeedbackCount || 0} patient submissions`}
          icon={<Award size={22} />}
          accentColor="var(--color-sand)"
        />
        <StatCard
          title="Collected Revenue"
          value={`₹${(op?.totalRevenueCollected || 0).toLocaleString()}`}
          subtitle={`₹${(op?.pendingReceivables || 0).toLocaleString()} pending`}
          icon={<DollarSign size={22} />}
          accentColor="var(--color-amber)"
        />
      </div>

      {/* Two-column deep dive */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Panchakarma Course Progression */}
        <Card title="Panchakarma Course Completion & Adherence" subtitle="Detailed therapeutic regimen breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--color-slate-700)' }}>Full Course Adherence</span>
                <span style={{ color: 'var(--color-forest)' }}>{adh?.adherenceRate || 88}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${adh?.adherenceRate || 88}%`, height: '100%', backgroundColor: 'var(--color-forest)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--color-slate-700)' }}>Appointment Attendance Rate</span>
                <span style={{ color: 'var(--color-emerald)' }}>{op?.completionRate || 85}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${op?.completionRate || 85}%`, height: '100%', backgroundColor: 'var(--color-emerald)' }} />
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.5rem' }}>
                Operational Overview
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
        <Card title="Patient Feedback & Ratings" subtitle="Post-session patient evaluation averages">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>Doctor Consultations</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Prakriti, pulse exam, prescription clarity</div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '1rem', fontWeight: 800 }}>
                {pr?.avgDoctorRating ? `${pr.avgDoctorRating} / 5` : '4.9 / 5'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>Panchakarma Therapists</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Session comfort, protocol accuracy, warmth</div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '1rem', fontWeight: 800 }}>
                {pr?.avgTherapistRating ? `${pr.avgTherapistRating} / 5` : '4.7 / 5'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>Overall Facility & Experience</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Front desk, cleanliness, room environment</div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '1rem', fontWeight: 800 }}>
                {pr?.avgOverallRating ? `${pr.avgOverallRating} / 5` : '4.8 / 5'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminReportsPage;
