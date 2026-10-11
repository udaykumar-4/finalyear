import apiClient from '../api/client';
import {
  PatientTreatmentRecommendationResponse,
  PatientTreatmentRecommendationRecord
} from '../types/patientTreatmentRecommendation';

export const patientTreatmentRecommendationService = {
  generateRecommendation: async (
    symptoms: string,
    quickSelections: string[] = []
  ): Promise<PatientTreatmentRecommendationResponse> => {
    const response = await apiClient.post<PatientTreatmentRecommendationResponse>(
      '/ai/patient-treatment-recommendations',
      {
        symptoms,
        quickSelections,
      }
    );
    return response.data;
  },

  getHistory: async (): Promise<PatientTreatmentRecommendationRecord[]> => {
    const response = await apiClient.get<PatientTreatmentRecommendationRecord[]>(
      '/ai/patient-treatment-recommendations'
    );
    return response.data;
  },

  getById: async (id: string): Promise<PatientTreatmentRecommendationRecord> => {
    const response = await apiClient.get<PatientTreatmentRecommendationRecord>(
      `/ai/patient-treatment-recommendations/${id}`
    );
    return response.data;
  },
};

export default patientTreatmentRecommendationService;
