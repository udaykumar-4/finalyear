import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import Icon from './Icon';
import aiService, { TreatmentRecommendationResponse } from '../services/aiService';

interface ClinicalSupportModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientCondition?: string;
}

export const ClinicalSupportModal: React.FC<ClinicalSupportModalProps> = ({
  visible,
  onClose,
  patientId,
  patientName,
  patientCondition,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<TreatmentRecommendationResponse | null>(null);

  const handleGenerate = async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.generateTreatmentRecommendation(patientId, symptoms);
      if (!result.success) {
        setError(result.message || 'AI Clinical Decision Support is currently offline.');
      } else {
        setRecommendation(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate treatment recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconContainer}>
              <Icon name="stethoscope" size={20} color={Colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>Clinical Decision Support</Text>
              <Text style={styles.modalSubtitle}>
                Patient: {patientName} • ID #{patientId.slice(-6)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Icon name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Prominent Mandatory Safety Banner */}
          <View style={styles.safetyNoticeCard}>
            <View style={styles.safetyNoticeHeader}>
              <Icon name="alert" size={14} color="#B45309" />
              <Text style={styles.safetyNoticeTitle}>CLINICAL DECISION SUPPORT ONLY</Text>
            </View>
            <Text style={styles.safetyNoticeText}>
              Generated treatment options are for physician review and evaluation. Final prescribing authority rests 100% with the attending doctor.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorCard}>
                <Icon name="alert" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Presenting Clinical Symptoms / Notes"
              placeholder="e.g. Stiffness in lower back, aggravated in morning"
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Generate Treatment Options"
              onPress={handleGenerate}
              loading={loading}
              style={styles.generateBtn}
            />

            {recommendation && recommendation.success && (
              <View style={styles.resultsContainer}>
                {/* Clinical Context */}
                {recommendation.clinicalContext && (
                  <Card style={styles.contextCard}>
                    <View style={styles.cardHeaderRow}>
                      <Icon name="document" size={14} color={Colors.primary} />
                      <Text style={styles.cardHeaderTitle}>Verified Patient Context</Text>
                    </View>
                    <View style={styles.contextGrid}>
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Age / Sex</Text>
                        <Text style={styles.contextValue}>
                          {recommendation.clinicalContext.patientAge} yrs • {recommendation.clinicalContext.gender}
                        </Text>
                      </View>
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Recorded Diagnosis</Text>
                        <Text style={styles.contextValue}>
                          {recommendation.clinicalContext.recordedCondition || 'None'}
                        </Text>
                      </View>
                      <View style={styles.contextItemFull}>
                        <Text style={styles.contextLabel}>Known Allergies</Text>
                        <Text style={styles.contextValue}>
                          {recommendation.clinicalContext.knownAllergies || 'No allergies recorded'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                )}

                {/* Contraindication Warnings */}
                {recommendation.contraindicationWarnings && recommendation.contraindicationWarnings.length > 0 && (
                  <View style={styles.warningBox}>
                    <View style={styles.warningHeaderRow}>
                      <Icon name="alert" size={14} color={Colors.error} />
                      <Text style={styles.warningTitle}>Contraindication & Safety Warnings</Text>
                    </View>
                    {recommendation.contraindicationWarnings.map((warn, i) => (
                      <View key={i} style={styles.warningRow}>
                        <Text style={styles.warningDot}>•</Text>
                        <Text style={styles.warningItem}>{warn}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Suggested Options Header */}
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.optionsHeader}>
                    Suggested Treatment Options ({recommendation.suggestedOptions?.length || 0})
                  </Text>
                </View>

                {recommendation.suggestedOptions?.map((opt, idx) => (
                  <Card key={idx} style={styles.optionCard}>
                    <View style={styles.optTitleRow}>
                      <View style={styles.optBadge}>
                        <Text style={styles.optNumber}>Option {idx + 1}</Text>
                      </View>
                      <Text style={styles.optName}>{opt.treatmentName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Suggested Duration:</Text>
                      <Text style={styles.detailText}>{opt.suggestedSessions} sessions</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Primary Objective:</Text>
                      <Text style={styles.detailText}>{opt.primaryObjective}</Text>
                    </View>

                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Ayurvedic Rationale:</Text>
                      <Text style={styles.detailParagraph}>{opt.rationale}</Text>
                    </View>

                    {opt.considerations ? (
                      <View style={styles.detailBlock}>
                        <Text style={styles.detailLabel}>Clinical Considerations:</Text>
                        <Text style={styles.detailParagraph}>{opt.considerations}</Text>
                      </View>
                    ) : null}
                  </Card>
                ))}

                {/* Uncertainty */}
                {recommendation.uncertainty && (
                  <View style={styles.uncertaintyContainer}>
                    <Icon name="shield" size={14} color={Colors.textMuted} />
                    <Text style={styles.uncertaintyText}>
                      Clinical Certainty Assessment: {recommendation.uncertainty}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight || '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.text,
  },
  modalSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  safetyNoticeCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  safetyNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  safetyNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  safetyNoticeText: {
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorBg || '#FEE2E2',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },
  generateBtn: {
    marginVertical: 12,
  },
  resultsContainer: {
    marginTop: 8,
  },
  contextCard: {
    backgroundColor: Colors.cardAlt || '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    ...Typography.h3,
    fontSize: 13,
    color: Colors.text,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contextItem: {
    width: '48%',
  },
  contextItemFull: {
    width: '100%',
    marginTop: 4,
  },
  contextLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  contextValue: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
  },
  warningDot: {
    color: Colors.error,
    marginRight: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  warningItem: {
    fontSize: 11.5,
    color: Colors.error,
    lineHeight: 16,
    flex: 1,
  },
  sectionHeadingRow: {
    marginBottom: 10,
  },
  optionsHeader: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
  },
  optionCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
  },
  optTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  optBadge: {
    backgroundColor: Colors.primary + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  optName: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  detailLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.text,
  },
  detailText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailBlock: {
    marginTop: 6,
  },
  detailParagraph: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  uncertaintyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  uncertaintyText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

export default ClinicalSupportModal;
