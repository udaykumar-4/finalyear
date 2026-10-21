import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import prakritiService from '../../services/prakritiService';
import {
  PrakritiQuestion,
  PrakritiAnswer,
  PrakritiAssessmentRecord,
  DoshaType,
} from '../../types/prakriti';
import {
  DEFAULT_QUESTIONS,
  PRAKRITI_THEME,
  CLINICAL_DISCLAIMER,
} from '../../constants/prakritiData';
import Header from '../../components/Header';
import Colors from '../../constants/Colors';
import { useResponsive } from '../../constants/Layout';

type ViewMode = 'intro' | 'quiz' | 'review' | 'result' | 'history';

export default function PrakritiAssessmentScreen() {
  const { insets, isTablet, horizontalPadding } = useResponsive();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<ViewMode>((params.mode as ViewMode) || 'intro');
  const [questions, setQuestions] = useState<PrakritiQuestion[]>(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, { dosha: DoshaType; text: string }>>({});
  const [latestAssessment, setLatestAssessment] = useState<PrakritiAssessmentRecord | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<PrakritiAssessmentRecord | null>(null);
  const [history, setHistory] = useState<PrakritiAssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing assessment & question data
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [qRes, latest, hist] = await Promise.all([
          prakritiService.getQuestions().catch(() => null),
          prakritiService.getLatestAssessment().catch(() => null),
          prakritiService.getHistory().catch(() => []),
        ]);

        if (isMounted) {
          if (qRes && qRes.questions && qRes.questions.length > 0) {
            setQuestions(qRes.questions);
          }
          if (latest) {
            setLatestAssessment(latest);
            setActiveAssessment(latest);
            // If user opened with mode=result or if latest exists and no specific mode was specified
            if (params.mode === 'result') {
              setMode('result');
            } else if (params.mode === 'quiz') {
              setMode('quiz');
            } else if (!params.mode) {
              setMode('result');
            }
          } else {
            setMode('intro');
          }
          setHistory(hist || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to initialize assessment.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [params.mode]);

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const handleSelectOption = (dosha: DoshaType, label: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { dosha, text: label },
    }));
  };

  const handleNext = () => {
    if (!selectedAnswers[currentQuestion.id]) {
      Alert.alert('Selection Required', 'Please select the description that best matches your natural baseline constitution.');
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setMode('review');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setMode('intro');
    }
  };

  const startNewQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setMode('quiz');
  };

  const handleSubmitAssessment = async () => {
    // Validate all questions answered
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert(
        'Incomplete Assessment',
        `Please complete all questions before submitting. Unanswered: ${unanswered.map((u) => u.title).join(', ')}`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: PrakritiAnswer[] = questions.map((q) => {
        const ans = selectedAnswers[q.id];
        return {
          questionId: q.id,
          category: q.category,
          title: q.title,
          selectedDosha: ans.dosha,
          answerText: ans.text,
        };
      });

      const result = await prakritiService.submitAssessment(payload);
      setActiveAssessment(result);
      setLatestAssessment(result);
      // Refresh history in background
      prakritiService.getHistory().then((h) => setHistory(h)).catch(() => {});
      setMode('result');
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment.');
      Alert.alert('Submission Error', err.message || 'Could not complete assessment submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRAKRITI_THEME.forestGreen} />
        <Text style={styles.loadingText}>Loading Prakriti Assessment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Prakriti Assessment 🌿"
        subtitle={
          mode === 'quiz'
            ? `Question ${currentIndex + 1} of ${questions.length}`
            : mode === 'result'
            ? 'Constitutional Profile'
            : mode === 'history'
            ? 'Assessment History'
            : 'Ayurvedic Constitution'
        }
        showLogout={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 20) + 30,
            maxWidth: isTablet ? 600 : undefined,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* VIEW 1: INTRO SCREEN */}
        {/* ========================================================================= */}
        {mode === 'intro' && (
          <View style={styles.introContainer}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeIcon}>🪷</Text>
              <Text style={styles.heroBadgeText}>AYURVEDIC CONSTITUTIONAL SCIENCE</Text>
            </View>

            <Text style={styles.heroTitle}>Discover Your Inherent Prakriti</Text>

            <Text style={styles.heroParagraph}>
              In Classical Ayurveda, <Text style={styles.bold}>Prakriti</Text> is your unique biological and metabolic blueprint, determined at conception and shaped by the three Doshas: <Text style={styles.vataHighlight}>Vata</Text> (Kinetic), <Text style={styles.pittaHighlight}>Pitta</Text> (Transformative), and <Text style={styles.kaphaHighlight}>Kapha</Text> (Cohesive).
            </Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>🌿 Understanding the Difference:</Text>
              <Text style={styles.infoCardBullet}>
                • <Text style={styles.bold}>Prakriti (Constitution):</Text> Your lifelong natural baseline tendencies (bone frame, baseline skin, natural digestion).
              </Text>
              <Text style={styles.infoCardBullet}>
                • <Text style={styles.bold}>Vikriti (Imbalance):</Text> Temporary symptoms or current illnesses caused by diet, stress, or weather.
              </Text>
              <Text style={styles.infoCardNote}>
                *Please answer based on your lifelong natural tendencies since youth, rather than temporary current illnesses.
              </Text>
            </View>

            <View style={styles.featuresRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⏱️</Text>
                <Text style={styles.featureLabel}>8 Questions (~3 min)</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureLabel}>Dosha Score Breakdown</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🥗</Text>
                <Text style={styles.featureLabel}>Diet & Lifestyle Advice</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={startNewQuiz}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnPrimaryText}>
                {latestAssessment ? 'Start Retake Assessment →' : 'Begin Assessment →'}
              </Text>
            </TouchableOpacity>

            {latestAssessment && (
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => setMode('result')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnSecondaryText}>View Previous Result</Text>
              </TouchableOpacity>
            )}

            {history.length > 0 && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setMode('history')}
              >
                <Text style={styles.linkButtonText}>View Assessment History ({history.length} records) →</Text>
              </TouchableOpacity>
            )}

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>{CLINICAL_DISCLAIMER}</Text>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: QUESTIONNAIRE STEP-BY-STEP */}
        {/* ========================================================================= */}
        {mode === 'quiz' && currentQuestion && (
          <View style={styles.quizContainer}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Question {currentIndex + 1} of {questions.length}</Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* Question Header Card */}
            <View style={styles.questionCard}>
              <Text style={styles.questionCategory}>{currentQuestion.category.toUpperCase()}</Text>
              <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
              <Text style={styles.questionDesc}>{currentQuestion.description}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsList}>
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswers[currentQuestion.id]?.dosha === opt.dosha;
                const doshaMeta = PRAKRITI_THEME[opt.dosha];

                return (
                  <TouchableOpacity
                    key={opt.dosha}
                    style={[
                      styles.optionCard,
                      isSelected && {
                        borderColor: doshaMeta.primary,
                        backgroundColor: doshaMeta.light,
                      },
                    ]}
                    onPress={() => handleSelectOption(opt.dosha, opt.label)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionTopRow}>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && { borderColor: doshaMeta.primary },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioCircleInner,
                              { backgroundColor: doshaMeta.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionDoshaLabel,
                          { color: isSelected ? doshaMeta.primary : '#4B5563' },
                        ]}
                      >
                        {doshaMeta.name}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navPrevBtn}
                onPress={handlePrevious}
                activeOpacity={0.8}
              >
                <Text style={styles.navPrevText}>← Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navNextBtn,
                  !selectedAnswers[currentQuestion.id] && styles.btnDisabled,
                ]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.navNextText}>
                  {currentIndex === questions.length - 1 ? 'Review Answers →' : 'Next Question →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: REVIEW BEFORE SUBMITTING */}
        {/* ========================================================================= */}
        {mode === 'review' && (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewHeading}>Review Your Selections</Text>
            <Text style={styles.reviewSub}>
              Review your answers below before generating your constitutional profile. You can tap any question to modify your answer.
            </Text>

            {questions.map((q, idx) => {
              const selected = selectedAnswers[q.id];
              const doshaMeta = selected ? PRAKRITI_THEME[selected.dosha] : null;

              return (
                <TouchableOpacity
                  key={q.id}
                  style={styles.reviewItemCard}
                  onPress={() => {
                    setCurrentIndex(idx);
                    setMode('quiz');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.reviewItemHeader}>
                    <Text style={styles.reviewItemNumber}>Q{idx + 1}. {q.title}</Text>
                    {doshaMeta && (
                      <View style={[styles.reviewDoshaBadge, { backgroundColor: doshaMeta.light }]}>
                        <Text style={[styles.reviewDoshaText, { color: doshaMeta.primary }]}>
                          {selected.dosha.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reviewItemAnswer}>
                    {selected ? selected.text : 'Unanswered'}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.actionBtnPrimary, submitting && styles.btnDisabled]}
              onPress={handleSubmitAssessment}
              activeOpacity={0.8}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnPrimaryText}>Submit & Calculate Prakriti 🌿</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => {
                setCurrentIndex(questions.length - 1);
                setMode('quiz');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnSecondaryText}>← Back to Questions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: RESULTS DISPLAY */}
        {/* ========================================================================= */}
        {mode === 'result' && activeAssessment && (
          <View style={styles.resultContainer}>
            {/* Dominant Banner */}
            <View style={styles.resultBanner}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>
                  {activeAssessment.constitutionType.toUpperCase()} CONSTITUTION
                </Text>
              </View>
              <Text style={styles.resultTitle}>🌿 {activeAssessment.dominantConstitution}</Text>
              <Text style={styles.resultDate}>
                Assessed on{' '}
                {new Date(activeAssessment.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Visual Comparison Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Tri-Dosha Ratio Comparison</Text>
              <Text style={styles.chartDesc}>
                Your constitutional scores calculated across 8 key physiological dimensions:
              </Text>

              {/* Vata Bar */}
              <View style={styles.meterRow}>
                <View style={styles.meterLabels}>
                  <Text style={[styles.meterName, { color: PRAKRITI_THEME.vata.primary }]}>
                    Vata (Air/Space)
                  </Text>
                  <Text style={styles.meterValue}>{activeAssessment.scores.vata}%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${activeAssessment.scores.vata}%`,
                        backgroundColor: PRAKRITI_THEME.vata.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Pitta Bar */}
              <View style={styles.meterRow}>
                <View style={styles.meterLabels}>
                  <Text style={[styles.meterName, { color: PRAKRITI_THEME.pitta.primary }]}>
                    Pitta (Fire/Water)
                  </Text>
                  <Text style={styles.meterValue}>{activeAssessment.scores.pitta}%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${activeAssessment.scores.pitta}%`,
                        backgroundColor: PRAKRITI_THEME.pitta.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Kapha Bar */}
              <View style={styles.meterRow}>
                <View style={styles.meterLabels}>
                  <Text style={[styles.meterName, { color: PRAKRITI_THEME.kapha.primary }]}>
                    Kapha (Water/Earth)
                  </Text>
                  <Text style={styles.meterValue}>{activeAssessment.scores.kapha}%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${activeAssessment.scores.kapha}%`,
                        backgroundColor: PRAKRITI_THEME.kapha.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.calculationNote}>
                <Text style={styles.calculationNoteText}>
                  ℹ️ <Text style={styles.bold}>Methodology:</Text> Evaluated via classical Samhita typology (v{activeAssessment.scoringMethodologyVersion || '1.0'}). Constitution classification applies Ekadoshaja thresholds (≥45% with lead) or Dvandvaja dual combinations.
                </Text>
              </View>
            </View>

            {/* Profile Overview Card */}
            {activeAssessment.profile && (
              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>Constitutional Qualities (Gunas)</Text>
                <Text style={styles.detailText}>{activeAssessment.profile.summary}</Text>

                {activeAssessment.profile.qualities ? (
                  <View style={styles.gunasPillContainer}>
                    <Text style={styles.gunasLabel}>Core Attributes:</Text>
                    <Text style={styles.gunasText}>{activeAssessment.profile.qualities}</Text>
                  </View>
                ) : null}

                {/* Dietary Guidance */}
                {activeAssessment.profile.diet && activeAssessment.profile.diet.length > 0 && (
                  <View style={styles.guidanceBlock}>
                    <Text style={styles.guidanceTitle}>🥗 Dietary Recommendations (Pathya)</Text>
                    {activeAssessment.profile.diet.map((item, idx) => (
                      <Text key={idx} style={styles.guidanceBullet}>• {item}</Text>
                    ))}
                  </View>
                )}

                {/* Lifestyle Guidance */}
                {activeAssessment.profile.lifestyle && activeAssessment.profile.lifestyle.length > 0 && (
                  <View style={styles.guidanceBlock}>
                    <Text style={styles.guidanceTitle}>🧘 Daily Lifestyle & Regimen (Dinacharya)</Text>
                    {activeAssessment.profile.lifestyle.map((item, idx) => (
                      <Text key={idx} style={styles.guidanceBullet}>• {item}</Text>
                    ))}
                  </View>
                )}

                {/* Seasonal Guidance */}
                {activeAssessment.profile.seasonal ? (
                  <View style={styles.guidanceBlock}>
                    <Text style={styles.guidanceTitle}>🍂 Seasonal Care (Ritucharya)</Text>
                    <Text style={styles.guidanceBullet}>• {activeAssessment.profile.seasonal}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Actions */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={startNewQuiz}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnPrimaryText}>Retake Assessment 🔄</Text>
              </TouchableOpacity>

              {history.length > 1 && (
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => setMode('history')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnSecondaryText}>View Assessment History ({history.length})</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.replace('/patient')}
              >
                <Text style={styles.linkButtonText}>← Return to Patient Dashboard</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                {activeAssessment.disclaimer || CLINICAL_DISCLAIMER}
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: HISTORY LIST */}
        {/* ========================================================================= */}
        {mode === 'history' && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Past Prakriti Assessments</Text>
            <Text style={styles.historySub}>
              All constitutional evaluations recorded for your patient profile:
            </Text>

            {history.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No historical assessments found.</Text>
                <TouchableOpacity
                  style={[styles.actionBtnPrimary, { marginTop: 14 }]}
                  onPress={startNewQuiz}
                >
                  <Text style={styles.actionBtnPrimaryText}>Take Assessment Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              history.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.historyCard}
                  onPress={() => {
                    setActiveAssessment(item);
                    setMode('result');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyCardTitle}>🌿 {item.dominantConstitution}</Text>
                    <Text style={styles.historyCardBadge}>{item.constitutionType}</Text>
                  </View>
                  <Text style={styles.historyCardDate}>
                    📅 {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={styles.historyScoresRow}>
                    <Text style={[styles.historyScorePill, { color: PRAKRITI_THEME.vata.primary }]}>
                      V: {item.scores.vata}%
                    </Text>
                    <Text style={[styles.historyScorePill, { color: PRAKRITI_THEME.pitta.primary }]}>
                      P: {item.scores.pitta}%
                    </Text>
                    <Text style={[styles.historyScorePill, { color: PRAKRITI_THEME.kapha.primary }]}>
                      K: {item.scores.kapha}%
                    </Text>
                  </View>
                  <Text style={styles.historyTapText}>Tap to inspect full report →</Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={[styles.actionBtnPrimary, { marginTop: 16 }]}
              onPress={startNewQuiz}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnPrimaryText}>Take New Assessment →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => setMode(latestAssessment ? 'result' : 'intro')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnSecondaryText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },

  // INTRO VIEW
  introContainer: {
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF2EB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeIcon: {
    fontSize: 14,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2D5A3C',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3F2B',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroParagraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  bold: {
    fontWeight: '700',
  },
  vataHighlight: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  pittaHighlight: {
    color: '#EA580C',
    fontWeight: '700',
  },
  kaphaHighlight: {
    color: '#059669',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1E0D1',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 8,
  },
  infoCardBullet: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 6,
  },
  infoCardNote: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },

  // BUTTONS
  actionBtnPrimary: {
    backgroundColor: '#2D5A3C',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#1E3F2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2D5A3C',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionBtnSecondaryText: {
    color: '#2D5A3C',
    fontSize: 14,
    fontWeight: '700',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  linkButtonText: {
    color: '#2D5A3C',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // QUIZ VIEW
  quizContainer: {
    width: '100%',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2D5A3C',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2D5A3C',
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1E0D1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  questionCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5C7C5D',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 6,
  },
  questionDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionDoshaLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  optionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    paddingLeft: 28,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navPrevBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  navPrevText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },
  navNextBtn: {
    flex: 2,
    backgroundColor: '#2D5A3C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  navNextText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // REVIEW VIEW
  reviewContainer: {
    width: '100%',
  },
  reviewHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 4,
  },
  reviewSub: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 16,
  },
  reviewItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewItemNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3F2B',
  },
  reviewDoshaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewDoshaText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reviewItemAnswer: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },

  // RESULT VIEW
  resultContainer: {
    width: '100%',
  },
  resultBanner: {
    backgroundColor: '#EBF2EB',
    borderWidth: 1.5,
    borderColor: '#C8DBC9',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultBadge: {
    backgroundColor: '#2D5A3C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 12,
    color: '#5C7C5D',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 4,
  },
  chartDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
  },
  meterRow: {
    marginBottom: 12,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  meterName: {
    fontSize: 13,
    fontWeight: '700',
  },
  meterValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  meterTrack: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 5,
  },
  calculationNote: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  calculationNoteText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  gunasPillContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  gunasLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 2,
  },
  gunasText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  guidanceBlock: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 6,
  },
  guidanceBullet: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 4,
  },
  resultActions: {
    marginTop: 8,
  },

  // HISTORY VIEW
  historyContainer: {
    width: '100%',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 4,
  },
  historySub: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 14,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3F2B',
  },
  historyCardBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C7C5D',
    backgroundColor: '#EBF2EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyCardDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  historyScoresRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  historyScorePill: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyTapText: {
    fontSize: 11,
    color: '#2D5A3C',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // DISCLAIMER
  disclaimerBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    textAlign: 'center',
  },
});
