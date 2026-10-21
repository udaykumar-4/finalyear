export type DoshaType = 'vata' | 'pitta' | 'kapha';

export interface PrakritiOption {
  dosha: DoshaType;
  label: string;
}

export interface PrakritiQuestion {
  id: string;
  category: string;
  title: string;
  description: string;
  options: PrakritiOption[];
}

export interface PrakritiAnswer {
  questionId: string;
  category?: string;
  title?: string;
  selectedDosha: DoshaType;
  answerText: string;
}

export interface PrakritiScores {
  vata: number;
  pitta: number;
  kapha: number;
  rawCounts?: {
    vata: number;
    pitta: number;
    kapha: number;
    total: number;
  };
}

export interface PrakritiProfile {
  element?: string;
  qualities?: string;
  summary: string;
  diet: string[];
  lifestyle: string[];
  seasonal?: string;
}

export interface PrakritiAssessmentRecord {
  _id: string;
  patientId: string;
  questionnaireVersion: string;
  scoringMethodologyVersion: string;
  answers: PrakritiAnswer[];
  scores: PrakritiScores;
  dominantConstitution: string;
  constitutionType: 'Ekadoshaja' | 'Dvandvaja' | 'Sama';
  profile: PrakritiProfile;
  status: 'in-progress' | 'completed';
  disclaimer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrakritiQuestionsResponse {
  questionnaireVersion: string;
  scoringMethodologyVersion: string;
  disclaimer: string;
  totalQuestions: number;
  questions: PrakritiQuestion[];
}

export interface PrakritiLatestResponse {
  assessment: PrakritiAssessmentRecord | null;
}
