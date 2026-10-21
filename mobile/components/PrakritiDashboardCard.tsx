import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PrakritiAssessmentRecord } from '../types/prakriti';
import { PRAKRITI_THEME } from '../constants/prakritiData';
import { useResponsive } from '../constants/Layout';

interface PrakritiDashboardCardProps {
  latestAssessment: PrakritiAssessmentRecord | null;
  loading?: boolean;
}

export default function PrakritiDashboardCard({
  latestAssessment,
  loading = false,
}: PrakritiDashboardCardProps) {
  const router = useRouter();
  const { isSmallDevice } = useResponsive();

  const isCompleted = !!latestAssessment;
  const assessmentDate = latestAssessment?.createdAt
    ? new Date(latestAssessment.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <View style={styles.cardContainer}>
      {/* Top Banner Tag */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Text style={styles.leafIcon}>🪷</Text>
          <Text style={styles.topTag}>AYURVEDIC CONSTITUTION</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            isCompleted ? styles.statusPillCompleted : styles.statusPillPending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isCompleted ? styles.statusTextCompleted : styles.statusTextPending,
            ]}
          >
            {isCompleted ? 'Completed' : 'Not Started'}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <Text style={styles.title}>Discover Your Prakriti</Text>
      <Text style={styles.description}>
        Explore your Ayurvedic constitution through a guided assessment.
      </Text>

      {/* Dynamic State Info */}
      {isCompleted && latestAssessment ? (
        <View style={styles.completedInfoBox}>
          <View style={styles.constitutionHeader}>
            <Text style={styles.dominantText}>
              🌿 {latestAssessment.dominantConstitution}
            </Text>
            <Text style={styles.typeTag}>{latestAssessment.constitutionType}</Text>
          </View>

          {/* Scores Breakdown Bar */}
          <View style={styles.miniScoreRow}>
            <View style={[styles.miniScoreBadge, { backgroundColor: PRAKRITI_THEME.vata.light }]}>
              <Text style={[styles.miniScoreText, { color: PRAKRITI_THEME.vata.primary }]}>
                Vata: {latestAssessment.scores.vata}%
              </Text>
            </View>
            <View style={[styles.miniScoreBadge, { backgroundColor: PRAKRITI_THEME.pitta.light }]}>
              <Text style={[styles.miniScoreText, { color: PRAKRITI_THEME.pitta.primary }]}>
                Pitta: {latestAssessment.scores.pitta}%
              </Text>
            </View>
            <View style={[styles.miniScoreBadge, { backgroundColor: PRAKRITI_THEME.kapha.light }]}>
              <Text style={[styles.miniScoreText, { color: PRAKRITI_THEME.kapha.primary }]}>
                Kapha: {latestAssessment.scores.kapha}%
              </Text>
            </View>
          </View>

          {assessmentDate && (
            <Text style={styles.dateLabel}>Assessed on: {assessmentDate}</Text>
          )}
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {isCompleted ? (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, isSmallDevice && { paddingHorizontal: 8, paddingVertical: 9 }]}
              onPress={() => router.push('/patient/prakriti?mode=result')}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryBtnText, isSmallDevice && { fontSize: 11 }]}>View Results</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, isSmallDevice && { paddingHorizontal: 8, paddingVertical: 8 }]}
              onPress={() => router.push('/patient/prakriti?mode=quiz')}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, isSmallDevice && { fontSize: 11 }]}>Retake Assessment</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={() => router.push('/patient/prakriti?mode=intro')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>Start Assessment →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#D4E2D4',
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    marginBottom: 6,
    shadowColor: '#1E3F2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leafIcon: {
    fontSize: 16,
  },
  topTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2D5A3C',
    letterSpacing: 0.8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillPending: {
    backgroundColor: '#F1F5F9',
  },
  statusPillCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#64748B',
  },
  statusTextCompleted: {
    color: '#2E7D32',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3F2B',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  completedInfoBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  constitutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dominantText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3F2B',
  },
  typeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C7C5D',
    backgroundColor: '#EBF2EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniScoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  miniScoreBadge: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  miniScoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#2D5A3C',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2D5A3C',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#2D5A3C',
    fontSize: 13,
    fontWeight: '700',
  },
});
