import apiClient from '../api/client';
import {
  PrakritiQuestionsResponse,
  PrakritiAssessmentRecord,
  PrakritiLatestResponse,
  PrakritiAnswer,
} from '../types/prakriti';

export const prakritiService = {
  /**
   * Fetch active questions and methodology version from backend
   */
  getQuestions: async (): Promise<PrakritiQuestionsResponse> => {
    const response = await apiClient.get<PrakritiQuestionsResponse>('/prakriti/questions');
    return response.data;
  },

  /**
   * Submit questionnaire answers and calculate Prakriti constitution
   */
  submitAssessment: async (answers: PrakritiAnswer[]): Promise<PrakritiAssessmentRecord> => {
    const response = await apiClient.post<PrakritiAssessmentRecord>('/prakriti/assessments', {
      answers,
    });
    return response.data;
  },

  /**
   * Fetch latest Prakriti assessment for the logged-in patient
   */
  getLatestAssessment: async (): Promise<PrakritiAssessmentRecord | null> => {
    const response = await apiClient.get<PrakritiLatestResponse>('/prakriti/assessments/latest');
    return response.data.assessment;
  },

  /**
   * Fetch chronological assessment history for the patient
   */
  getHistory: async (): Promise<PrakritiAssessmentRecord[]> => {
    const response = await apiClient.get<PrakritiAssessmentRecord[]>('/prakriti/assessments');
    return response.data;
  },

  /**
   * Fetch a specific assessment record by ID
   */
  getById: async (id: string): Promise<PrakritiAssessmentRecord> => {
    const response = await apiClient.get<PrakritiAssessmentRecord>(`/prakriti/assessments/${id}`);
    return response.data;
  },
};

export default prakritiService;
