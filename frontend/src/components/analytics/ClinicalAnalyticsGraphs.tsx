import React, { useState } from 'react';
import {
  Activity,
  TrendingUp,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  Calendar,
  Layers,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  RefreshCw,
  AlertCircle,
  Database,
  Users,
} from 'lucide-react';
import Card from '../common/Card';
import { OutcomeAnalyticsData } from '../../services/analyticsService';

interface ClinicalAnalyticsGraphsProps {
  data?: OutcomeAnalyticsData | null;
  timeRange?: 'all' | 'week' | 'month' | 'quarter';
  onTimeRangeChange?: (range: 'all' | 'week' | 'month' | 'quarter') => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ClinicalAnalyticsGraphs: React.FC<ClinicalAnalyticsGraphsProps> = ({
  data,
  timeRange = 'all',
  onTimeRangeChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);

  const op = data?.operational;
  const adh = data?.adherence;
  const pr = data?.patientReported;
  const clin = data?.clinical;

  // Real operational counts directly from database
  const totalAppts = op?.totalAppointments ?? 0;
  const completedAppts = op?.completedAppointments ?? 0;
  const scheduledAppts = op?.scheduledAppointments ?? 0;
  const inProgressAppts = op?.inProgressAppointments ?? 0;
  const cancelledAppts = op?.cancelledAppointments ?? 0;
  const completionRate = op?.completionRate ?? 0;

  // Donut chart math (radius = 54, circumference = 2 * PI * 54 = 339.292)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const completedPct = totalAppts > 0 ? (completedAppts / totalAppts) * 100 : 0;
  const scheduledPct = totalAppts > 0 ? (scheduledAppts / totalAppts) * 100 : 0;
  const inProgressPct = totalAppts > 0 ? (inProgressAppts / totalAppts) * 100 : 0;
  const cancelledPct = totalAppts > 0 ? (cancelledAppts / totalAppts) * 100 : 0;

  const segCompleted = (completedPct / 100) * circumference;
  const segScheduled = (scheduledPct / 100) * circumference;
  const segInProgress = (inProgressPct / 100) * circumference;
  const segCancelled = (cancelledPct / 100) * circumference;

  const offCompleted = 0;
  const offScheduled = -segCompleted;
  const offInProgress = -(segCompleted + segScheduled);
  const offCancelled = -(segCompleted + segScheduled + segInProgress);

  // Modalities list from database
  const modalities = data?.modalities || [];
  const totalModalitySessions = modalities.reduce((sum, m) => sum + (m.count || 0), 0);

  // Weekly Trend points from database
  const weeklyData = data?.weeklyTrend && data.weeklyTrend.length === 7
    ? data.weeklyTrend
    : [
        { day: 'Mon', scheduled: 0, completed: 0, total: 0 },
        { day: 'Tue', scheduled: 0, completed: 0, total: 0 },
        { day: 'Wed', scheduled: 0, completed: 0, total: 0 },
        { day: 'Thu', scheduled: 0, completed: 0, total: 0 },
        { day: 'Fri', scheduled: 0, completed: 0, total: 0 },
        { day: 'Sat', scheduled: 0, completed: 0, total: 0 },
        { day: 'Sun', scheduled: 0, completed: 0, total: 0 },
      ];

  const maxWeeklyValue = Math.max(
    1,
    ...weeklyData.map((d) => Math.max(d.scheduled, d.completed, d.total))
  );
  // Scale Y ceiling to a nice integer above maxWeeklyValue
  const maxTrend = maxWeeklyValue <= 5 ? 5 : Math.ceil(maxWeeklyValue * 1.25);

  const svgWidth = 460;
  const svgHeight = 150;
  const paddingX = 35;
  const paddingY = 22;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const pointsCompleted = weeklyData.map((d, i) => {
    const x = paddingX + (i / (weeklyData.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.completed / maxTrend) * chartH;
    return { x, y, day: d.day, val: d.completed };
  });

  const pointsScheduled = weeklyData.map((d, i) => {
    const x = paddingX + (i / (weeklyData.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.scheduled / maxTrend) * chartH;
    return { x, y, day: d.day, val: d.scheduled };
  });

  const completedLinePath = pointsCompleted.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
    ''
  );

  const completedAreaPath = `${completedLinePath} L ${pointsCompleted[pointsCompleted.length - 1].x} ${
    svgHeight - paddingY
  } L ${pointsCompleted[0].x} ${svgHeight - paddingY} Z`;

  const scheduledLinePath = pointsScheduled.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
    ''
  );

  // Outcome Metrics from database
  const outcomeMetrics = data?.outcomeMetrics && data.outcomeMetrics.length > 0
    ? data.outcomeMetrics
    : [
        {
          name: 'Panchakarma Protocol Adherence',
          value: adh?.adherenceRate ?? 0,
          benchmark: 80,
          count: adh?.totalPrescriptions ?? 0,
          color: '#10B981',
          description: adh?.totalPrescriptions
            ? `${adh.totalCompletedSessions} of ${adh.totalPrescribedSessions} sessions finished`
            : 'No prescriptions recorded in database',
        },
        {
          name: 'Prakriti Assessment Coverage',
          value: clin?.prakritiAssessmentRate ?? 0,
          benchmark: 80,
          count: clin?.uniqueAssessedPatients ?? 0,
          color: '#6366F1',
          description: clin?.totalPatientCount
            ? `${clin.uniqueAssessedPatients || 0} of ${clin.totalPatientCount} registered patients assessed`
            : 'No registered patients',
        },
        {
          name: 'Clinical Appointment Attendance Rate',
          value: op?.completionRate ?? 0,
          benchmark: 75,
          count: op?.totalAppointments ?? 0,
          color: '#059669',
          description: op?.totalAppointments
            ? `${op.completedAppointments} completed out of ${op.totalAppointments} scheduled visits`
            : 'No appointments recorded',
        },
        {
          name: 'Patient Satisfaction Index',
          value: pr?.avgOverallRating ? Math.round((pr.avgOverallRating / 5) * 100) : 0,
          benchmark: 85,
          count: pr?.totalFeedbackCount ?? 0,
          color: '#EA580C',
          description: pr?.totalFeedbackCount
            ? `Average rating ${pr.avgOverallRating} / 5 across ${pr.totalFeedbackCount} evaluations`
            : 'No feedback evaluations submitted yet',
        },
        {
          name: 'Baseline Vitals Documentation Coverage',
          value: clin?.totalPatientCount
            ? Math.round(((clin.patientsWithVitalsRecorded || 0) / clin.totalPatientCount) * 100)
            : 0,
          benchmark: 90,
          count: clin?.totalPatientCount ?? 0,
          color: '#9333EA',
          description: clin?.totalPatientCount
            ? `${clin.patientsWithVitalsRecorded || 0} of ${clin.totalPatientCount} patients documented`
            : 'No patient vitals documented',
        },
      ];

  // Dosha Distribution from database
  const doshaDist = data?.doshaDistribution;
  const totalAssessments = doshaDist?.totalAssessments ?? 0;
  const vataPct = doshaDist?.vataPercent ?? 0;
  const pittaPct = doshaDist?.pittaPercent ?? 0;
  const kaphaPct = doshaDist?.kaphaPercent ?? 0;

  const doshaDemographics = [
    {
      name: 'Vata Predominant',
      percent: vataPct,
      color: '#0284C7',
      label: 'Kinetic, nervous, joint stiffness, dryness',
      therapies: 'Basti, Abhyanga, Shirodhara',
    },
    {
      name: 'Pitta Predominant',
      percent: pittaPct,
      color: '#DC2626',
      label: 'Metabolic heat, inflammatory, acid balance',
      therapies: 'Virechana, Takradhara, Sheetali',
    },
    {
      name: 'Kapha Predominant',
      percent: kaphaPct,
      color: '#16A34A',
      label: 'Stability, congestion, sluggish metabolism',
      therapies: 'Vamana, Swedana, Udvartana, Nasya',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Analytics Filter & Subtitle Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-slate-200)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#E8F5E9',
              color: '#1E3F2B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Database size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                Live Clinical Analytics & Database Distributions
              </h3>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                }}
              >
                Direct Database Query
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', margin: 0 }}>
              Real-time records from Appointments, Prescriptions, Feedbacks, and Prakriti Assessments
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh database analytics"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-slate-200)',
                backgroundColor: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-slate-700)',
                cursor: isRefreshing ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Sync DB'}
            </button>
          )}

          <div
            style={{
              display: 'inline-flex',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-slate-200)',
              backgroundColor: 'var(--color-slate-50)',
              padding: '2px',
            }}
          >
            {(
              [
                { id: 'all', label: 'All Records' },
                { id: 'month', label: 'This Month' },
                { id: 'week', label: 'This Week' },
                { id: 'quarter', label: 'Quarter' },
              ] as const
            ).map((filter) => {
              const active = timeRange === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => onTimeRangeChange && onTimeRangeChange(filter.id)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: active ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: active ? '#1E3F2B' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--color-slate-600)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 1: Panchakarma Modality Distribution & Session Status Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Panchakarma Modalities Volume */}
        <Card
          title="Panchakarma Therapy Modalities Volume"
          subtitle="Aggregated strictly from prescriptions and appointments in MongoDB"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modalities.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2.5rem 1rem',
                  color: 'var(--color-slate-400)',
                  textAlign: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={32} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
                  No therapy procedures logged in database yet
                </span>
                <span style={{ fontSize: '0.75rem', maxWidth: '280px' }}>
                  Create prescriptions or book appointments to see modality breakdown graphs.
                </span>
              </div>
            ) : (
              modalities.map((item, index) => {
                const pctOfTotal =
                  totalModalitySessions > 0
                    ? Math.round((item.count / totalModalitySessions) * 100)
                    : 0;

                return (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-slate-50)',
                      border: '1px solid var(--color-slate-200)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                          {item.name}
                        </span>
                        {item.avgDuration && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--color-slate-500)',
                              backgroundColor: '#FFFFFF',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              border: '1px solid var(--color-slate-200)',
                            }}
                          >
                            {item.avgDuration}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: item.color }}>
                          {item.count} sessions
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                          ({pctOfTotal}% of total)
                        </span>
                      </div>
                    </div>

                    {/* Multi-color Progress Bar */}
                    <div
                      style={{
                        height: '9px',
                        backgroundColor: '#E2E8F0',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: `${pctOfTotal}%`,
                          height: '100%',
                          backgroundColor: item.color,
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.6875rem',
                        color: 'var(--color-slate-500)',
                      }}
                    >
                      <span>
                        Completed: <strong>{item.completedCount}</strong>
                        {item.activeCount ? ` • In-Progress: ${item.activeCount}` : ''}
                      </span>
                      <span style={{ fontWeight: 700, color: item.color }}>
                        {item.completionRate}% completion rate
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {modalities.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-slate-600)',
                  padding: '0.375rem 0.5rem',
                  borderTop: '1px dashed var(--color-slate-200)',
                }}
              >
                <span>Total Therapy Sessions Logged</span>
                <span style={{ color: '#1E3F2B', fontWeight: 800 }}>
                  {totalModalitySessions} sessions ({modalities.length} distinct therapies)
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Session Status Distribution Donut */}
        <Card
          title="Clinical Session Status Distribution"
          subtitle={`Live breakdown of all ${totalAppts} appointments in database`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            {totalAppts === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--color-slate-400)',
                  textAlign: 'center',
                  gap: '0.5rem',
                }}
              >
                <PieIcon size={36} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
                  No appointments found in database
                </span>
                <span style={{ fontSize: '0.75rem' }}>
                  No scheduled, completed, or cancelled visits recorded for this range.
                </span>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                  <svg
                    width="160"
                    height="160"
                    viewBox="0 0 160 160"
                    style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
                  >
                    {/* Background ring */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#F1F5F9"
                      strokeWidth="18"
                      fill="transparent"
                    />

                    {/* Completed arc */}
                    {segCompleted > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="#10B981"
                        strokeWidth="18"
                        strokeDasharray={`${segCompleted} ${circumference}`}
                        strokeDashoffset={offCompleted}
                        fill="transparent"
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    )}

                    {/* Scheduled arc */}
                    {segScheduled > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="#3B82F6"
                        strokeWidth="18"
                        strokeDasharray={`${segScheduled} ${circumference}`}
                        strokeDashoffset={offScheduled}
                        fill="transparent"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    )}

                    {/* In-Progress arc */}
                    {segInProgress > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="#F59E0B"
                        strokeWidth="18"
                        strokeDasharray={`${segInProgress} ${circumference}`}
                        strokeDashoffset={offInProgress}
                        fill="transparent"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    )}

                    {/* Cancelled arc */}
                    {segCancelled > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="#EF4444"
                        strokeWidth="18"
                        strokeDasharray={`${segCancelled} ${circumference}`}
                        strokeDashoffset={offCancelled}
                        fill="transparent"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    )}
                  </svg>

                  {/* Centered KPI metric */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E3F2B', lineHeight: 1 }}>
                      {completionRate}%
                    </span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-slate-500)', fontWeight: 700, marginTop: '2px' }}>
                      COMPLETION
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', fontWeight: 600 }}>
                      {totalAppts} total
                    </span>
                  </div>
                </div>

                {/* Status Legend Pills with real counts */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.625rem',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46' }}>
                        Completed
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#047857' }}>
                      {completedAppts} ({Math.round(completedPct)}%)
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#3B82F6',
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF' }}>
                        Scheduled
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1D4ED8' }}>
                      {scheduledAppts} ({Math.round(scheduledPct)}%)
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#F59E0B',
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>
                        In Progress
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#B45309' }}>
                      {inProgressAppts} ({Math.round(inProgressPct)}%)
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#EF4444',
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B' }}>
                        Cancelled
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#B91C1C' }}>
                      {cancelledAppts} ({Math.round(cancelledPct)}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Weekly Inflow Trend & Clinical Therapeutic Outcome Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Weekly Trend Line & Area Chart */}
        <Card
          title="Weekly Appointment Inflow & Progression"
          subtitle="Real Monday-to-Sunday distribution from appointment timestamps"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '3px',
                      backgroundColor: '#10B981',
                      borderRadius: '2px',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '2px',
                      backgroundColor: '#3B82F6',
                      borderTop: '2px dashed #3B82F6',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>Scheduled</span>
                </div>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                Scale: 0 to {maxTrend} visits/day
              </span>
            </div>

            {/* Native Responsive SVG Area Chart */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg
                width="100%"
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ overflow: 'visible', minWidth: '340px' }}
              >
                <defs>
                  <linearGradient id="areaGradientDb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = svgHeight - paddingY - ratio * chartH;
                  const labelVal = Math.round(ratio * maxTrend);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 3}
                        fontSize="9"
                        fill="#94A3B8"
                        textAnchor="end"
                        fontWeight="600"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Completed Area Fill */}
                <path d={completedAreaPath} fill="url(#areaGradientDb)" />

                {/* Completed Stroke Line */}
                <path
                  d={completedLinePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Scheduled Dashed Line */}
                <path
                  d={scheduledLinePath}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points on Completed */}
                {pointsCompleted.map((p, idx) => (
                  <g key={`comp-${idx}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#FFFFFF"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                    {p.val > 0 && (
                      <text
                        x={p.x}
                        y={p.y - 7}
                        fontSize="10"
                        fontWeight="800"
                        fill="#065F46"
                        textAnchor="middle"
                      >
                        {p.val}
                      </text>
                    )}
                  </g>
                ))}

                {/* Data Points on Scheduled */}
                {pointsScheduled.map((p, idx) => (
                  <g key={`sched-${idx}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill="#3B82F6"
                    />
                    {p.val > 0 && (
                      <text
                        x={p.x}
                        y={p.y - 6}
                        fontSize="9"
                        fontWeight="700"
                        fill="#1E40AF"
                        textAnchor="middle"
                      >
                        {p.val}
                      </text>
                    )}
                  </g>
                ))}

                {/* Day Labels along X Axis */}
                {weeklyData.map((d, idx) => {
                  const x = paddingX + (idx / (weeklyData.length - 1)) * chartW;
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={svgHeight - 4}
                      fontSize="10"
                      fontWeight="700"
                      fill="var(--color-slate-600)"
                      textAnchor="middle"
                    >
                      {d.day}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--color-slate-100)',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)' }}>Total Visited</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-slate-800)' }}>
                  {totalAppts}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)' }}>Completed</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10B981' }}>
                  {completedAppts}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)' }}>Active Queue</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#3B82F6' }}>
                  {scheduledAppts + inProgressAppts}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)' }}>Cancelled</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#EF4444' }}>
                  {cancelledAppts}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Clinical Therapeutic Outcome Attributes - General-Purpose Candle Pillar Chart */}
        <Card
          title="Clinical Therapeutic Outcomes & Quality Indices (Candle Pillars)"
          subtitle="General-purpose pillar candle graph comparing actual database outcomes against clinical target thresholds"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Candle Legend & Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-slate-200)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '16px',
                      borderRadius: '5px',
                      background: 'linear-gradient(180deg, #34D399 0%, #059669 100%)',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>Pillar Fill (Actual DB Value)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #059669',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>Current Level Indicator</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '0px',
                      borderTop: '2px dashed #0F172A',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>Clinical Benchmark Target</span>
                </div>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                Scale: 0% to 100%
              </span>
            </div>

            {/* Native Responsive Candle Pillar SVG Graph */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg
                width="100%"
                height="235"
                viewBox="0 0 520 235"
                style={{ overflow: 'visible', minWidth: '360px' }}
              >
                <defs>
                  {/* Distinct Multi-Color Gradients for Each Attribute */}
                  <linearGradient id="candleGrad-0" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="candleGrad-1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#4338CA" />
                  </linearGradient>
                  <linearGradient id="candleGrad-2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2DD4BF" />
                    <stop offset="100%" stopColor="#0F766E" />
                  </linearGradient>
                  <linearGradient id="candleGrad-3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="#C2410C" />
                  </linearGradient>
                  <linearGradient id="candleGrad-4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="100%" stopColor="#7E22CE" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines at 0%, 25%, 50%, 75%, 100% */}
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 26 + ((100 - pct) / 100) * 150;
                  return (
                    <g key={pct}>
                      <line
                        x1="44"
                        y1={y}
                        x2="502"
                        y2={y}
                        stroke={pct === 0 ? '#CBD5E1' : '#E2E8F0'}
                        strokeDasharray={pct === 0 ? 'none' : '4 4'}
                        strokeWidth={pct === 0 ? '1.5' : '1'}
                      />
                      <text
                        x="36"
                        y={y + 3}
                        fontSize="9"
                        fill="#94A3B8"
                        textAnchor="end"
                        fontWeight="600"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Render each Vertical Candle Pillar */}
                {outcomeMetrics.map((item, idx) => {
                  const colW = (502 - 44) / outcomeMetrics.length;
                  const xCenter = 44 + (idx + 0.5) * colW;
                  const pillarWidth = 32;
                  const pillarX = xCenter - pillarWidth / 2;

                  const trackY = 26;
                  const trackHeight = 150;

                  const val = Math.max(0, Math.min(100, item.value));
                  const bench = Math.max(0, Math.min(100, item.benchmark));
                  const diff = val - bench;
                  const isMet = val >= bench;

                  const fillHeight = (val / 100) * trackHeight;
                  const fillY = trackY + trackHeight - fillHeight;
                  const benchY = trackY + ((100 - bench) / 100) * trackHeight;
                  const capY = val > 0 ? fillY : trackY + trackHeight;

                  const isHovered = hoveredCandle === idx;

                  // Label abbreviations for X-axis
                  const shortName = item.name.includes('Adherence')
                    ? 'Adherence'
                    : item.name.includes('Prakriti')
                    ? 'Prakriti Quiz'
                    : item.name.includes('Attendance')
                    ? 'Attendance'
                    : item.name.includes('Satisfaction')
                    ? 'Satisfaction'
                    : 'Vitals Log';

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredCandle(idx)}
                      onMouseLeave={() => setHoveredCandle(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Transparent column hit area for hover */}
                      <rect
                        x={xCenter - colW / 2}
                        y="10"
                        width={colW}
                        height="220"
                        fill={isHovered ? 'rgba(241, 245, 249, 0.7)' : 'transparent'}
                        rx="6"
                      />

                      {/* Full-Height Candle Pillar Capsule Track */}
                      <rect
                        x={pillarX}
                        y={trackY}
                        width={pillarWidth}
                        height={trackHeight}
                        rx="16"
                        fill="#F1F5F9"
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />

                      {/* Filled Candle Pillar Body (rising to actual value) */}
                      {val > 0 && (
                        <rect
                          x={pillarX}
                          y={fillY}
                          width={pillarWidth}
                          height={fillHeight}
                          rx={val >= 92 ? 16 : 8}
                          fill={`url(#candleGrad-${idx % 5})`}
                          style={{
                            transition: 'all 0.4s ease',
                            filter: isHovered ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.16))' : 'none',
                          }}
                        />
                      )}

                      {/* Benchmark Target Notch across the Candle */}
                      <line
                        x1={pillarX - 4}
                        y1={benchY}
                        x2={pillarX + pillarWidth + 4}
                        y2={benchY}
                        stroke="#0F172A"
                        strokeWidth="2.5"
                        strokeDasharray="3 2"
                      />

                      {/* Glowing Cap / Level Indicator at Top of Pillar */}
                      <circle
                        cx={xCenter}
                        cy={capY}
                        r="7"
                        fill="#FFFFFF"
                        stroke={item.color}
                        strokeWidth="3"
                        style={{
                          filter: `drop-shadow(0 0 5px ${item.color})`,
                          transition: 'all 0.4s ease',
                        }}
                      />
                      <circle
                        cx={xCenter}
                        cy={capY}
                        r="2.5"
                        fill={item.color}
                      />

                      {/* Actual Value Badge floating above candle */}
                      <text
                        x={xCenter}
                        y={val > 0 ? fillY - 10 : trackY + trackHeight - 10}
                        fontSize="11"
                        fontWeight="800"
                        fill={val > 0 ? item.color : '#94A3B8'}
                        textAnchor="middle"
                      >
                        {val}%
                      </text>

                      {/* Benchmark Target Label */}
                      <text
                        x={pillarX + pillarWidth + 6}
                        y={benchY + 3}
                        fontSize="8"
                        fontWeight="700"
                        fill="#64748B"
                        textAnchor="start"
                      >
                        {bench}%
                      </text>

                      {/* Short Attribute Label at X-Axis */}
                      <text
                        x={xCenter}
                        y="196"
                        fontSize="10"
                        fontWeight={isHovered ? '800' : '700'}
                        fill={isHovered ? '#0F172A' : '#475569'}
                        textAnchor="middle"
                      >
                        {shortName}
                      </text>

                      {/* Delta status pill below label */}
                      <g transform={`translate(${xCenter - 22}, 203)`}>
                        <rect
                          width="44"
                          height="15"
                          rx="4"
                          fill={isMet ? '#DCFCE7' : val === 0 ? '#F1F5F9' : '#FEE2E2'}
                        />
                        <text
                          x="22"
                          y="11"
                          fontSize="8.5"
                          fontWeight="800"
                          fill={isMet ? '#166534' : val === 0 ? '#64748B' : '#991B1B'}
                          textAnchor="middle"
                        >
                          {isMet ? `+${diff}%` : val === 0 ? '0% DB' : `${diff}%`}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Active Candle Detail Inspector */}
            {(() => {
              const selectedIdx = hoveredCandle !== null ? hoveredCandle : 0;
              const activeItem = outcomeMetrics[selectedIdx];
              if (!activeItem) return null;
              const diff = activeItem.value - activeItem.benchmark;
              const isMet = activeItem.value >= activeItem.benchmark;

              return (
                <div
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isMet ? '#F0FDF4' : '#F8FAFC',
                    border: `1px solid ${isMet ? '#BBF7D0' : '#E2E8F0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: activeItem.color,
                          display: 'inline-block',
                        }}
                      />
                      <strong style={{ fontSize: '0.875rem', color: 'var(--color-slate-900)' }}>
                        {activeItem.name}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: isMet ? '#DCFCE7' : activeItem.value === 0 ? '#F1F5F9' : '#FEE2E2',
                          color: isMet ? '#166534' : activeItem.value === 0 ? '#64748B' : '#991B1B',
                        }}
                      >
                        {isMet ? 'Target Achieved' : activeItem.value === 0 ? 'Pending Entries' : 'Below Target'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 900, color: activeItem.color }}>
                        {activeItem.value}% Actual
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                        (Benchmark: {activeItem.benchmark}%)
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: isMet ? '#047857' : activeItem.value === 0 ? '#64748B' : '#B91C1C',
                        }}
                      >
                        {isMet ? `+${diff}%` : `${diff}%`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
                    <span>{activeItem.description}</span>
                    <span style={{ fontStyle: 'italic', color: 'var(--color-slate-400)' }}>
                      Hover over any candle pillar to view live attribute metrics
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      </div>

      {/* Row 3: Doshic Demographics & Demographic Distribution */}
      <Card
        title="Doshic Imbalance Demographics (Prakriti Profiles)"
        subtitle={`Computed directly from ${totalAssessments} Prakriti assessment${totalAssessments === 1 ? '' : 's'} recorded in database`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {totalAssessments === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                color: 'var(--color-slate-400)',
                textAlign: 'center',
                gap: '0.5rem',
              }}
            >
              <Users size={32} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
                No Prakriti assessments submitted yet
              </span>
              <span style={{ fontSize: '0.75rem', maxWidth: '320px' }}>
                When patients complete their constitutional evaluation quizzes, constitutional breakdown percentages will populate here.
              </span>
            </div>
          ) : (
            <>
              {/* Segmented Demographics Proportion Bar */}
              <div
                style={{
                  height: '24px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  border: '1px solid var(--color-slate-200)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                {doshaDemographics.map((dosha, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${dosha.percent}%`,
                      backgroundColor: dosha.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      transition: 'width 0.4s ease',
                      minWidth: dosha.percent > 0 ? '24px' : '0',
                    }}
                    title={`${dosha.name}: ${dosha.percent}%`}
                  >
                    {dosha.percent > 10 ? `${dosha.percent}%` : ''}
                  </div>
                ))}
              </div>

              {/* Constitution Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {doshaDemographics.map((dosha, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-slate-50)',
                      border: '1px solid var(--color-slate-200)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: dosha.color,
                            display: 'inline-block',
                          }}
                        />
                        <strong style={{ color: '#1E3F2B', fontSize: '0.875rem' }}>{dosha.name}</strong>
                      </div>
                      <span style={{ fontSize: '1.125rem', fontWeight: 800, color: dosha.color }}>
                        {dosha.percent}%
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
                      {dosha.label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: '#1E3F2B',
                        fontWeight: 600,
                        backgroundColor: '#FFFFFF',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid var(--color-slate-200)',
                        marginTop: '0.25rem',
                      }}
                    >
                      Therapy focus: <strong>{dosha.therapies}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ClinicalAnalyticsGraphs;
