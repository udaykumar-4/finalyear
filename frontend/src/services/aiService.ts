import apiClient from '../api/client';

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  isPersonalized?: boolean;
}

export interface ChatResponse {
  success: boolean;
  conversationId?: string;
  response: string;
  isPersonalized?: boolean;
  isEmergency?: boolean;
  disclaimer?: string;
  status?: string;
}

export interface ChatConversationRecord {
  _id: string;
  userId: string;
  role: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedOption {
  treatmentName: string;
  suggestedSessions: number;
  primaryObjective: string;
  rationale: string;
  considerations: string;
}

export interface TreatmentRecommendationResponse {
  success: boolean;
  recommendationId?: string;
  clinicalContext?: {
    patientAge: number | string;
    gender: string;
    recordedCondition: string;
    presentingSymptoms: string;
    hasRecordedAllergies: boolean;
    knownAllergies: string;
    activeTherapy: string;
  };
  suggestedOptions?: SuggestedOption[];
  contraindicationWarnings?: string[];
  uncertainty?: string;
  clinicianReviewRequired?: boolean;
  disclaimer?: string;
  status?: string;
  message?: string;
}

export interface PossibleCondition {
  conditionName: string;
  probabilityCategory: string;
  supportingFactors: string[];
  differentialConsiderations: string;
}

export interface DiseasePredictionResponse {
  success: boolean;
  predictionId?: string;
  clinicalContext?: {
    patientAge: number | string;
    gender: string;
    presentingSymptoms: string;
    recordedCondition: string;
  };
  possibleConditions?: PossibleCondition[];
  uncertainty?: string;
  limitations?: string;
  clinicianReviewRequired?: boolean;
  disclaimer?: string;
  status?: string;
  message?: string;
}

export const aiService = {
  sendMessage: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/ai/chat/message', {
      message,
      conversationId,
    });
    return response.data;
  },

  getHistory: async (): Promise<ChatConversationRecord[]> => {
    const response = await apiClient.get<ChatConversationRecord[]>('/ai/chat/history');
    return response.data;
  },

  deleteConversation: async (conversationId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/ai/chat/history/${conversationId}`);
    return response.data;
  },

  generateTreatmentRecommendation: async (
    patientId: string,
    presentingSymptoms?: string
  ): Promise<TreatmentRecommendationResponse> => {
    const response = await apiClient.post<TreatmentRecommendationResponse>(
      '/ai/treatment-recommendations/generate',
      {
        patientId,
        presentingSymptoms: presentingSymptoms || '',
      }
    );
    return response.data;
  },

  getPatientRecommendations: async (
    patientId: string
  ): Promise<TreatmentRecommendationResponse[]> => {
    const response = await apiClient.get<TreatmentRecommendationResponse[]>(
      `/ai/treatment-recommendations/${patientId}`
    );
    return response.data;
  },

  generateDiseasePrediction: async (
    patientId: string,
    presentingSymptoms?: string
  ): Promise<DiseasePredictionResponse> => {
    const response = await apiClient.post<DiseasePredictionResponse>(
      '/ai/predictions/generate',
      {
        patientId,
        presentingSymptoms: presentingSymptoms || '',
      }
    );
    return response.data;
  },

  getPatientPredictions: async (
    patientId: string
  ): Promise<DiseasePredictionResponse[]> => {
    const response = await apiClient.get<DiseasePredictionResponse[]>(
      `/ai/predictions/patient/${patientId}`
    );
    return response.data;
  },
};

export default aiService;
