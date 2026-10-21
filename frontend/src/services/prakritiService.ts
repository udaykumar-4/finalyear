import apiClient from '../api/client';
import {
  PrakritiQuestionsResponse,
  PrakritiAssessmentRecord,
  PrakritiLatestResponse,
  PrakritiAnswer,
} from '../types/prakriti';

export const prakritiService = {
  getQuestions: async (): Promise<PrakritiQuestionsResponse> => {
    const response = await apiClient.get<PrakritiQuestionsResponse>('/prakriti/questions');
    return response.data;
  },

  submitAssessment: async (answers: PrakritiAnswer[]): Promise<PrakritiAssessmentRecord> => {
    const response = await apiClient.post<PrakritiAssessmentRecord>('/prakriti/assessments', {
      answers,
    });
    return response.data;
  },

  getLatestAssessment: async (): Promise<PrakritiAssessmentRecord | null> => {
    const response = await apiClient.get<PrakritiLatestResponse>('/prakriti/assessments/latest');
    return response.data.assessment;
  },

  getHistory: async (): Promise<PrakritiAssessmentRecord[]> => {
    const response = await apiClient.get<PrakritiAssessmentRecord[]>('/prakriti/assessments');
    return response.data;
  },

  getById: async (id: string): Promise<PrakritiAssessmentRecord> => {
    const response = await apiClient.get<PrakritiAssessmentRecord>(`/prakriti/assessments/${id}`);
    return response.data;
  },
};

export default prakritiService;
