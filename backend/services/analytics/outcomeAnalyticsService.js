const Appointment = require('../../models/appointment');
const Prescription = require('../../models/prescription');
const Feedback = require('../../models/feedback');
const User = require('../../models/user');
const PrakritiAssessment = require('../../models/prakritiAssessment');
const cacheService = require('../cache/cacheService');

class OutcomeAnalyticsService {
  /**
   * Global Clinic-Wide Analytics (Admin) - Computed dynamically from database
   */
  async getGlobalOutcomes(timeRange = 'all', { forceRefresh = false } = {}) {
    const cacheKey = `analytics:global:${timeRange}`;
    if (forceRefresh) {
      cacheService.delPattern('analytics:global*');
    }

    return await cacheService.wrap(cacheKey, 60, async () => {
      // Determine cutoff date if a time-range filter is selected
      let cutoffDate = null;
      const now = new Date();
      if (timeRange === 'week') {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'month') {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'quarter') {
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // Query raw documents from MongoDB
      const [allAppointments, allPrescriptions, allFeedback, patientUsers, allAssessments] = await Promise.all([
        Appointment.find({}).lean(),
        Prescription.find({}).lean(),
        Feedback.find({}).lean(),
        User.find({ role: 'patient' }).select('-password').lean(),
        PrakritiAssessment.find({}).lean()
      ]);

      // Apply date filter when specified
      const appointments = cutoffDate
        ? allAppointments.filter(a => new Date(a.appointment_date || a.createdAt) >= cutoffDate)
        : allAppointments;

      const prescriptions = cutoffDate
        ? allPrescriptions.filter(p => new Date(p.createdAt) >= cutoffDate)
        : allPrescriptions;

      const feedback = cutoffDate
        ? allFeedback.filter(f => new Date(f.createdAt) >= cutoffDate)
        : allFeedback;

      // 1. Operational Metrics (from Appointment collection)
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
      const inProgressAppointments = appointments.filter(a => a.status === 'in-progress').length;
      const scheduledAppointments = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;

      const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;
      const cancellationRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0;

      let totalRevenueCollected = 0;
      let pendingReceivables = 0;
      appointments.forEach(a => {
        const cost = Number(a.cost) || 0;
        if (a.isPaid) {
          totalRevenueCollected += cost;
        } else {
          pendingReceivables += cost;
        }
      });

      // 2. Treatment Adherence / Progress Metrics (from Prescription collection)
      const totalPrescriptions = prescriptions.length;
      const completedPrescriptions = prescriptions.filter(p => p.status === 'completed').length;
      const activePrescriptions = prescriptions.filter(p => p.status === 'in-progress').length;

      let totalPrescribedSessions = 0;
      let totalCompletedSessions = 0;
      prescriptions.forEach(p => {
        totalPrescribedSessions += (p.duration || 0);
        totalCompletedSessions += (p.progressCompleted || 0);
      });

      const adherenceRate = totalPrescribedSessions > 0
        ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
        : 0;

      // 3. Patient-Reported Outcomes (from Feedback collection)
      const totalFeedbackCount = feedback.length;
      let sumDoctorRating = 0, countDoctor = 0;
      let sumTherapistRating = 0, countTherapist = 0;
      let sumOverallRating = 0, countOverall = 0;

      feedback.forEach(f => {
        if (f.doctorRating) { sumDoctorRating += f.doctorRating; countDoctor++; }
        if (f.therapistRating) { sumTherapistRating += f.therapistRating; countTherapist++; }
        if (f.overallRating) { sumOverallRating += f.overallRating; countOverall++; }
      });

      const avgDoctorRating = countDoctor > 0 ? Number((sumDoctorRating / countDoctor).toFixed(1)) : 0;
      const avgTherapistRating = countTherapist > 0 ? Number((sumTherapistRating / countTherapist).toFixed(1)) : 0;
      const avgOverallRating = countOverall > 0 ? Number((sumOverallRating / countOverall).toFixed(1)) : 0;

      // 4. Clinical Outcomes Summary (from User & PrakritiAssessment collections)
      const patientsWithVitals = patientUsers.filter(u => u.bloodPressure || u.weight || u.heartRate || u.temperature).length;
      const uniqueAssessedPatients = new Set(allAssessments.map(a => a.patientId ? a.patientId.toString() : '')).size;
      const prakritiAssessmentRate = patientUsers.length > 0 ? Math.round((uniqueAssessedPatients / patientUsers.length) * 100) : 0;
      const vitalsDocumentationRate = patientUsers.length > 0 ? Math.round((patientsWithVitals / patientUsers.length) * 100) : 0;

      // 5. Panchakarma Therapy Modalities Volume (aggregated strictly from Prescriptions and Appointments)
      const therapyMap = {};
      const palette = ['#10B981', '#6366F1', '#EC4899', '#F59E0B', '#8B5CF6', '#06B6D4', '#14B8A6', '#E11D48'];

      prescriptions.forEach(p => {
        if (!p.treatment) return;
        const clean = p.treatment.trim();
        const name = clean.charAt(0).toUpperCase() + clean.slice(1);
        if (!therapyMap[name]) {
          therapyMap[name] = { name, count: 0, completedCount: 0, activeCount: 0, durationDays: 0 };
        }
        therapyMap[name].count += (p.duration || 1);
        therapyMap[name].completedCount += (p.progressCompleted || 0);
        therapyMap[name].durationDays += (p.duration || 1);
        if (p.status === 'in-progress') therapyMap[name].activeCount++;
      });

      appointments.forEach(a => {
        if (!a.treatment) return;
        const clean = a.treatment.trim();
        const name = clean.charAt(0).toUpperCase() + clean.slice(1);
        if (!therapyMap[name]) {
          therapyMap[name] = { name, count: 0, completedCount: 0, activeCount: 0, durationDays: 0 };
        }
        therapyMap[name].count += 1;
        if (a.status === 'completed') therapyMap[name].completedCount += 1;
        if (a.status === 'in-progress' || a.status === 'scheduled') therapyMap[name].activeCount += 1;
      });

      const modalities = Object.values(therapyMap)
        .sort((a, b) => b.count - a.count)
        .map((t, idx) => ({
          name: t.name,
          count: t.count,
          completedCount: t.completedCount,
          activeCount: t.activeCount,
          completionRate: t.count > 0 ? Math.round((t.completedCount / t.count) * 100) : 0,
          color: palette[idx % palette.length],
          avgDuration: t.durationDays > 0 ? `${t.durationDays} day course` : `${t.count} sessions`
        }));

      // 6. Weekly Appointment Volume & Inflow (aggregated from actual Appointment dates)
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyCounts = {};
      dayOrder.forEach(d => { weeklyCounts[d] = { day: d, scheduled: 0, completed: 0, total: 0 }; });

      appointments.forEach(a => {
        const dt = new Date(a.appointment_date || a.createdAt);
        const dayName = daysOfWeek[dt.getDay()];
        if (weeklyCounts[dayName]) {
          weeklyCounts[dayName].total++;
          if (a.status === 'completed') {
            weeklyCounts[dayName].completed++;
          }
          if (a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'in-progress') {
            weeklyCounts[dayName].scheduled++;
          }
        }
      });
      const weeklyTrend = dayOrder.map(d => weeklyCounts[d]);

      // 7. Clinical Therapeutic Outcome Attributes (accurately computed from database models)
      const outcomeMetrics = [
        {
          name: 'Panchakarma Protocol Adherence',
          value: adherenceRate,
          benchmark: 80,
          count: totalPrescriptions,
          color: '#10B981',
          description: totalPrescriptions > 0
            ? `${totalCompletedSessions} of ${totalPrescribedSessions} sessions completed across ${totalPrescriptions} courses`
            : 'No active prescriptions recorded in database'
        },
        {
          name: 'Prakriti Assessment Coverage',
          value: prakritiAssessmentRate,
          benchmark: 80,
          count: allAssessments.length,
          color: '#6366F1',
          description: patientUsers.length > 0
            ? `${uniqueAssessedPatients} of ${patientUsers.length} registered patients assessed`
            : 'No registered patients in database'
        },
        {
          name: 'Clinical Appointment Attendance Rate',
          value: completionRate,
          benchmark: 75,
          count: totalAppointments,
          color: '#059669',
          description: totalAppointments > 0
            ? `${completedAppointments} completed out of ${totalAppointments} total visits`
            : 'No appointments recorded'
        },
        {
          name: 'Patient Satisfaction Index',
          value: avgOverallRating > 0 ? Math.round((avgOverallRating / 5) * 100) : 0,
          benchmark: 85,
          count: totalFeedbackCount,
          color: '#EA580C',
          description: totalFeedbackCount > 0
            ? `Average rating ${avgOverallRating} / 5 across ${totalFeedbackCount} evaluations`
            : 'No feedback evaluations submitted yet'
        },
        {
          name: 'Baseline Vitals Documentation Coverage',
          value: vitalsDocumentationRate,
          benchmark: 90,
          count: patientUsers.length,
          color: '#9333EA',
          description: patientUsers.length > 0
            ? `${patientsWithVitals} of ${patientUsers.length} patients with recorded vitals`
            : 'No patient vitals documented'
        }
      ];

      // 8. Doshic Imbalance Demographics (aggregated directly from Prakriti assessments in MongoDB)
      let vataPercent = 0, pittaPercent = 0, kaphaPercent = 0;
      const dominantCounts = { vata: 0, pitta: 0, kapha: 0, other: 0 };
      if (allAssessments.length > 0) {
        let sumV = 0, sumP = 0, sumK = 0;
        allAssessments.forEach(ass => {
          const v = Number(ass.scores?.vata) || 0;
          const p = Number(ass.scores?.pitta) || 0;
          const k = Number(ass.scores?.kapha) || 0;
          sumV += v;
          sumP += p;
          sumK += k;
          const dom = (ass.dominantConstitution || '').toLowerCase();
          if (dom.includes('vata')) dominantCounts.vata++;
          else if (dom.includes('pitta')) dominantCounts.pitta++;
          else if (dom.includes('kapha')) dominantCounts.kapha++;
          else dominantCounts.other++;
        });
        const totalScore = sumV + sumP + sumK;
        if (totalScore > 0) {
          vataPercent = Math.round((sumV / totalScore) * 100);
          pittaPercent = Math.round((sumP / totalScore) * 100);
          kaphaPercent = Math.max(0, 100 - vataPercent - pittaPercent);
        }
      }

      const doshaDistribution = {
        vataPercent,
        pittaPercent,
        kaphaPercent,
        totalAssessments: allAssessments.length,
        dominantCounts
      };

      return {
        operational: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          inProgressAppointments,
          scheduledAppointments,
          completionRate,
          cancellationRate,
          totalRevenueCollected,
          pendingReceivables
        },
        adherence: {
          totalPrescriptions,
          completedPrescriptions,
          activePrescriptions,
          totalPrescribedSessions,
          totalCompletedSessions,
          adherenceRate
        },
        patientReported: {
          totalFeedbackCount,
          avgDoctorRating,
          avgTherapistRating,
          avgOverallRating
        },
        clinical: {
          totalPatientCount: patientUsers.length,
          patientsWithVitalsRecorded: patientsWithVitals,
          hasReliableVitals: patientsWithVitals > 0,
          prakritiAssessmentRate,
          uniqueAssessedPatients
        },
        modalities,
        weeklyTrend,
        outcomeMetrics,
        doshaDistribution
      };
    });
  }

  /**
   * Doctor Assigned Patient Analytics - User-scoped cache for 5 mins
   */
  async getDoctorOutcomes(doctorId) {
    return await cacheService.wrap(`analytics:doctor:${doctorId}`, 300, async () => {
      const appointments = await Appointment.find({ doctorId });
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
      const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

      const prescriptions = await Prescription.find({ doctorId });
      const totalPrescriptions = prescriptions.length;
      const completedPrescriptions = prescriptions.filter(p => p.status === 'completed').length;

      let totalPrescribedSessions = 0;
      let totalCompletedSessions = 0;
      prescriptions.forEach(p => {
        totalPrescribedSessions += (p.duration || 0);
        totalCompletedSessions += (p.progressCompleted || 0);
      });
      const adherenceRate = totalPrescribedSessions > 0
        ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
        : 0;

      const feedback = await Feedback.find({ doctorId });
      let sumDoctorRating = 0;
      feedback.forEach(f => { sumDoctorRating += (f.doctorRating || 0); });
      const avgDoctorRating = feedback.length > 0 ? Number((sumDoctorRating / feedback.length).toFixed(1)) : 0;

      return {
        operational: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          completionRate
        },
        adherence: {
          totalPrescriptions,
          completedPrescriptions,
          totalPrescribedSessions,
          totalCompletedSessions,
          adherenceRate
        },
        patientReported: {
          totalFeedbackCount: feedback.length,
          avgDoctorRating
        }
      };
    });
  }

  /**
   * Therapist Assigned Patient Analytics - User-scoped cache for 5 mins
   */
  async getTherapistOutcomes(therapistId) {
    return await cacheService.wrap(`analytics:therapist:${therapistId}`, 300, async () => {
      const prescriptions = await Prescription.find({ therapistId });
      const totalPrescriptions = prescriptions.length;
      const completedPrescriptions = prescriptions.filter(p => p.status === 'completed').length;

      let totalPrescribedSessions = 0;
      let totalCompletedSessions = 0;
      prescriptions.forEach(p => {
        totalPrescribedSessions += (p.duration || 0);
        totalCompletedSessions += (p.progressCompleted || 0);
      });
      const adherenceRate = totalPrescribedSessions > 0
        ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
        : 0;

      const feedback = await Feedback.find({ therapistId });
      let sumTherapistRating = 0;
      feedback.forEach(f => { sumTherapistRating += (f.therapistRating || 0); });
      const avgTherapistRating = feedback.length > 0 ? Number((sumTherapistRating / feedback.length).toFixed(1)) : 0;

      return {
        adherence: {
          totalPrescriptions,
          completedPrescriptions,
          totalPrescribedSessions,
          totalCompletedSessions,
          adherenceRate
        },
        patientReported: {
          totalFeedbackCount: feedback.length,
          avgTherapistRating
        }
      };
    });
  }

  /**
   * Patient Self Analytics (Strictly Scoped) - User-scoped cache for 3 mins
   */
  async getPatientOutcomes(patientId) {
    return await cacheService.wrap(`analytics:patient:${patientId}`, 180, async () => {
      const patientUser = await User.findById(patientId).select('-password');
      if (!patientUser) {
        throw new Error('Patient record not found');
      }

      const appointments = await Appointment.find({ patientId });
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;

      const prescriptions = await Prescription.find({ patientId });
      let totalPrescribedSessions = 0;
      let totalCompletedSessions = 0;
      prescriptions.forEach(p => {
        totalPrescribedSessions += (p.duration || 0);
        totalCompletedSessions += (p.progressCompleted || 0);
      });
      const adherenceRate = totalPrescribedSessions > 0
        ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
        : 0;

      const feedback = await Feedback.find({ patientId });

      const hasVitals = !!(patientUser.bloodPressure || patientUser.heartRate || patientUser.weight || patientUser.temperature);

      return {
        patient: {
          _id: patientUser._id,
          full_name: patientUser.full_name,
          condition: patientUser.condition
        },
        operational: {
          totalAppointments,
          completedAppointments
        },
        adherence: {
          totalPrescriptions: prescriptions.length,
          totalPrescribedSessions,
          totalCompletedSessions,
          adherenceRate
        },
        patientReported: {
          feedbackSubmitted: feedback.length
        },
        clinical: {
          hasVitalsData: hasVitals,
          vitals: hasVitals ? {
            bloodPressure: patientUser.bloodPressure,
            heartRate: patientUser.heartRate,
            weight: patientUser.weight,
            temperature: patientUser.temperature
          } : null
        }
      };
    });
  }
}

module.exports = new OutcomeAnalyticsService();
