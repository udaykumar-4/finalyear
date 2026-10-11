import apiClient from '../api/client';

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
}

export const analyticsService = {
  getGlobalOutcomes: async (): Promise<OutcomeAnalyticsData> => {
    const response = await apiClient.get<OutcomeAnalyticsData>('/analytics/outcomes');
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
