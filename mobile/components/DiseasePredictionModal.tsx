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
import aiService, { DiseasePredictionResponse } from '../services/aiService';

interface DiseasePredictionModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientCondition?: string;
}

export const DiseasePredictionModal: React.FC<DiseasePredictionModalProps> = ({
  visible,
  onClose,
  patientId,
  patientName,
  patientCondition,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<DiseasePredictionResponse | null>(null);

  const handleGenerate = async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.generateDiseasePrediction(patientId, symptoms);
      if (!result.success) {
        setError(result.message || 'AI Clinical Prediction Support is currently offline.');
      } else {
        setPrediction(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate disease prediction support.');
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
              <Icon name="sparkle" size={20} color={Colors.secondary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>Disease Prediction Support</Text>
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
              <Text style={styles.safetyNoticeTitle}>NOT A CONFIRMED DIAGNOSIS</Text>
            </View>
            <Text style={styles.safetyNoticeText}>
              Generated differential conditions are for physician review and evaluation. Final diagnostic authority rests 100% with the attending doctor.
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
              label="Presenting Clinical Symptoms / Signs"
              placeholder="e.g. Joint pain, morning stiffness, dryness, digestive sluggishness"
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Generate Differential Guidance"
              onPress={handleGenerate}
              loading={loading}
              style={styles.generateBtn}
            />

            {prediction && prediction.success && (
              <View style={styles.resultsContainer}>
                {/* Clinical Context */}
                {prediction.clinicalContext && (
                  <Card style={styles.contextCard}>
                    <View style={styles.cardHeaderRow}>
                      <Icon name="document" size={14} color={Colors.primary} />
                      <Text style={styles.cardHeaderTitle}>Verified Patient Context</Text>
                    </View>
                    <View style={styles.contextGrid}>
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Age / Sex</Text>
                        <Text style={styles.contextValue}>
                          {prediction.clinicalContext.patientAge} yrs • {prediction.clinicalContext.gender}
                        </Text>
                      </View>
                      <View style={styles.contextItemFull}>
                        <Text style={styles.contextLabel}>Presenting Symptoms</Text>
                        <Text style={styles.contextValue}>
                          {prediction.clinicalContext.presentingSymptoms || 'None specified'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                )}

                {/* Possible Differential Conditions */}
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.optionsHeader}>
                    Possible Differential Conditions ({prediction.possibleConditions?.length || 0})
                  </Text>
                </View>

                {prediction.possibleConditions?.map((cond, idx) => (
                  <Card key={idx} style={styles.optionCard}>
                    <View style={styles.optTitleRow}>
                      <View style={styles.probabilityBadge}>
                        <Text style={styles.probabilityText}>
                          {cond.probabilityCategory || 'Differential'}
                        </Text>
                      </View>
                      <Text style={styles.optName}>{cond.conditionName}</Text>
                    </View>

                    {cond.supportingFactors && cond.supportingFactors.length > 0 && (
                      <View style={styles.factorsBlock}>
                        <Text style={styles.detailLabel}>Supporting Factors:</Text>
                        {cond.supportingFactors.map((sf, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{sf}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {cond.differentialConsiderations ? (
                      <View style={styles.considerationsBlock}>
                        <Text style={styles.detailLabel}>Differential Rule-Outs:</Text>
                        <Text style={styles.detailParagraph}>
                          {cond.differentialConsiderations}
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                ))}

                {/* Uncertainty & Limitations */}
                {prediction.uncertainty && (
                  <View style={styles.uncertaintyContainer}>
                    <Icon name="shield" size={14} color={Colors.textMuted} />
                    <Text style={styles.uncertaintyText}>
                      Certainty Assessment: {prediction.uncertainty}
                    </Text>
                  </View>
                )}

                {prediction.limitations && (
                  <View style={styles.limitationCard}>
                    <View style={styles.limitationHeader}>
                      <Icon name="alert" size={14} color={Colors.textSecondary} />
                      <Text style={styles.limitationTitle}>Diagnostic Limitations</Text>
                    </View>
                    <Text style={styles.limitationText}>{prediction.limitations}</Text>
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
    backgroundColor: (Colors.secondary || '#D97706') + '15',
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
    borderLeftColor: Colors.secondary || '#D97706',
    borderRadius: 14,
    padding: 14,
  },
  optTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  probabilityBadge: {
    backgroundColor: (Colors.secondary || '#D97706') + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  probabilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary || '#D97706',
    textTransform: 'uppercase',
  },
  optName: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  factorsBlock: {
    marginTop: 4,
  },
  detailLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  bulletDot: {
    color: Colors.textSecondary,
    marginRight: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  bulletText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  considerationsBlock: {
    marginTop: 8,
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
  limitationCard: {
    backgroundColor: Colors.cardAlt || '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  limitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  limitationTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  limitationText: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});

export default DiseasePredictionModal;
