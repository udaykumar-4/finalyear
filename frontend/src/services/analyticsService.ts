import apiClient from '../api/client';

export interface TherapyModalityStat {
  name: string;
  count: number;
  completedCount: number;
  activeCount?: number;
  completionRate: number;
  color: string;
  avgDuration?: string;
}

export interface WeeklyTrendStat {
  day: string;
  scheduled: number;
  completed: number;
  total: number;
}

export interface OutcomeMetricStat {
  name: string;
  value: number;
  benchmark: number;
  count: number;
  color: string;
  description: string;
}

export interface DoshaDistributionStat {
  vataPercent: number;
  pittaPercent: number;
  kaphaPercent: number;
  totalAssessments: number;
  dominantCounts?: {
    vata: number;
    pitta: number;
    kapha: number;
    other: number;
  };
}

export interface OutcomeAnalyticsData {
  operational?: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    inProgressAppointments?: number;
    scheduledAppointments?: number;
    completionRate: number;
    cancellationRate?: number;
    totalRevenueCollected?: number;
    pendingReceivables?: number;
  };
  adherence?: {
    totalPrescriptions: number;
    completedPrescriptions: number;
    activePrescriptions?: number;
    totalPrescribedSessions: number;
    totalCompletedSessions: number;
    adherenceRate: number;
  };
  patientReported?: {
    totalFeedbackCount: number;
    avgDoctorRating?: number;
    avgTherapistRating?: number;
    avgOverallRating?: number;
    feedbackSubmitted?: number;
  };
  clinical?: {
    totalPatientCount?: number;
    patientsWithVitalsRecorded?: number;
    hasReliableVitals?: boolean;
    hasVitalsData?: boolean;
    prakritiAssessmentRate?: number;
    uniqueAssessedPatients?: number;
    vitals?: {
      bloodPressure?: string;
      heartRate?: string;
      weight?: string;
      temperature?: string;
    } | null;
  };
  patient?: {
    _id: string;
    full_name: string;
    condition?: string;
  };
  modalities?: TherapyModalityStat[];
  weeklyTrend?: WeeklyTrendStat[];
  outcomeMetrics?: OutcomeMetricStat[];
  doshaDistribution?: DoshaDistributionStat;
}

export const analyticsService = {
  getGlobalOutcomes: async (timeRange?: string, refresh?: boolean): Promise<OutcomeAnalyticsData> => {
    const params: Record<string, string | boolean> = {};
    if (timeRange) params.timeRange = timeRange;
    if (refresh) params.refresh = refresh;
    const response = await apiClient.get<OutcomeAnalyticsData>('/analytics/outcomes', { params });
    return response.data;
  },

  getDoctorOutcomes: async (doctorId?: string): Promise<OutcomeAnalyticsData> => {
    const params = doctorId ? { doctorId } : undefined;
    const response = await apiClient.get<OutcomeAnalyticsData>('/analytics/outcomes/doctor', { params });
    return response.data;
  },

  getTherapistOutcomes: async (therapistId?: string): Promise<OutcomeAnalyticsData> => {
    const params = therapistId ? { therapistId } : undefined;
    const response = await apiClient.get<OutcomeAnalyticsData>('/analytics/outcomes/therapist', { params });
    return response.data;
  },

  getPatientOutcomes: async (patientId?: string): Promise<OutcomeAnalyticsData> => {
    const params = patientId ? { patientId } : undefined;
    const response = await apiClient.get<OutcomeAnalyticsData>('/analytics/outcomes/patient', { params });
    return response.data;
  },
};

export default analyticsService;
