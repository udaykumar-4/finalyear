import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Doctor Pages
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorPatientsPage from './pages/doctor/DoctorPatientsPage';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorPrescriptionsPage from './pages/doctor/DoctorPrescriptionsPage';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';

// Therapist Pages
import TherapistDashboardPage from './pages/therapist/TherapistDashboardPage';
import TherapistSchedulePage from './pages/therapist/TherapistSchedulePage';
import TherapistTreatmentsPage from './pages/therapist/TherapistTreatmentsPage';
import TherapistPatientsPage from './pages/therapist/TherapistPatientsPage';
import TherapistProfilePage from './pages/therapist/TherapistProfilePage';

// Receptionist Pages
import ReceptionistDashboardPage from './pages/receptionist/ReceptionistDashboardPage';
import ReceptionistAppointmentsPage from './pages/receptionist/ReceptionistAppointmentsPage';
import ReceptionistPatientsPage from './pages/receptionist/ReceptionistPatientsPage';
import ReceptionistPaymentsPage from './pages/receptionist/ReceptionistPaymentsPage';
import ReceptionistSettingsPage from './pages/receptionist/ReceptionistSettingsPage';

// Patient Pages
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientTreatmentsPage from './pages/patient/PatientTreatmentsPage';
import PatientReportsPage from './pages/patient/PatientReportsPage';
import PatientFeedbackPage from './pages/patient/PatientFeedbackPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';

// Modals & Drawers
import BookAppointmentModal from './components/shared/BookAppointmentModal';
import ClinicalSupportModal from './components/ai/ClinicalSupportModal';
import DiseasePredictionModal from './components/ai/DiseasePredictionModal';
import PatientTreatmentRecommendationModal from './components/ai/PatientTreatmentRecommendationModal';
import AIChatbotDrawer from './components/ai/AIChatbotDrawer';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modal States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isPatientRecOpen, setIsPatientRecOpen] = useState(false);

  // Doctor AI modal parameters
  const [clinicalSupportTarget, setClinicalSupportTarget] = useState<{ id: string; name: string } | null>(null);
  const [diseasePredictionTarget, setDiseasePredictionTarget] = useState<{ id: string; name: string } | null>(null);
  const [prescribeTargetPatientId, setPrescribeTargetPatientId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-cream)',
          color: 'var(--color-forest)',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--color-emerald)',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.04em' }}>
          Loading AyurSutra Intelligent Panchakarma OS...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Open modal helpers
  const handleOpenClinicalSupport = (patientId: string, patientName: string) => {
    setClinicalSupportTarget({ id: patientId, name: patientName });
  };

  const handleOpenDiseasePrediction = (patientId: string, patientName: string) => {
    setDiseasePredictionTarget({ id: patientId, name: patientName });
  };

  const handleOpenPrescribe = (patientId: string) => {
    setPrescribeTargetPatientId(patientId);
    setCurrentTab('prescriptions');
  };

  // Render role-specific page
  const renderContent = () => {
    switch (user.role) {
      case 'admin':
        switch (currentTab) {
          case 'users':
            return <AdminUsersPage />;
          case 'appointments':
            return <AdminAppointmentsPage onOpenBookingModal={() => setIsBookModalOpen(true)} />;
          case 'reports':
            return <AdminReportsPage />;
          case 'settings':
            return <AdminSettingsPage />;
          case 'dashboard':
          default:
            return (
              <AdminDashboardPage
                onNavigateTab={setCurrentTab}
                onBookAppointment={() => setIsBookModalOpen(true)}
              />
            );
        }

      case 'doctor':
        switch (currentTab) {
          case 'patients':
            return (
              <DoctorPatientsPage
                onOpenClinicalSupport={handleOpenClinicalSupport}
                onOpenDiseasePrediction={handleOpenDiseasePrediction}
                onOpenPrescribe={handleOpenPrescribe}
              />
            );
          case 'appointments':
            return (
              <DoctorAppointmentsPage
                onOpenClinicalSupport={handleOpenClinicalSupport}
                onOpenBookingModal={() => setIsBookModalOpen(true)}
              />
            );
          case 'prescriptions':
            return <DoctorPrescriptionsPage defaultPatientId={prescribeTargetPatientId} />;
          case 'profile':
            return <DoctorProfilePage />;
          case 'dashboard':
          default:
            return (
              <DoctorDashboardPage
                onNavigateTab={setCurrentTab}
                onOpenClinicalSupport={handleOpenClinicalSupport}
                onOpenBookingModal={() => setIsBookModalOpen(true)}
              />
            );
        }

      case 'therapist':
        switch (currentTab) {
          case 'schedule':
            return <TherapistSchedulePage />;
          case 'treatments':
            return <TherapistTreatmentsPage />;
          case 'patients':
            return <TherapistPatientsPage />;
          case 'profile':
            return <TherapistProfilePage />;
          case 'dashboard':
          default:
            return <TherapistDashboardPage onNavigateTab={setCurrentTab} />;
        }

      case 'receptionist':
        switch (currentTab) {
          case 'appointments':
            return (
              <ReceptionistAppointmentsPage
                onOpenBookingModal={() => setIsBookModalOpen(true)}
              />
            );
          case 'patients':
            return (
              <ReceptionistPatientsPage
                onOpenBookingModal={() => setIsBookModalOpen(true)}
              />
            );
          case 'payments':
            return <ReceptionistPaymentsPage />;
          case 'settings':
            return <ReceptionistSettingsPage />;
          case 'dashboard':
          default:
            return (
              <ReceptionistDashboardPage
                onNavigateTab={setCurrentTab}
                onOpenBookingModal={() => setIsBookModalOpen(true)}
                onOpenRegisterModal={() => setCurrentTab('patients')}
              />
            );
        }

      case 'patient':
        switch (currentTab) {
          case 'appointments':
            return (
              <PatientAppointmentsPage
                onOpenBookingModal={() => setIsBookModalOpen(true)}
              />
            );
          case 'treatments':
            return <PatientTreatmentsPage />;
          case 'reports':
            return <PatientReportsPage />;
          case 'feedback':
            return <PatientFeedbackPage />;
          case 'profile':
            return <PatientProfilePage />;
          case 'dashboard':
          default:
            return (
              <PatientDashboardPage
                onNavigateTab={setCurrentTab}
                onOpenBookingModal={() => setIsBookModalOpen(true)}
                onOpenRecommendationModal={() => setIsPatientRecOpen(true)}
                onOpenAIChat={() => setIsAIChatOpen(true)}
              />
            );
        }

      default:
        return <div>Role unauthorized or unrecognized.</div>;
    }
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return `${user.role.toUpperCase()} Workspace`;
      case 'users':
        return 'User & Clinician Directory';
      case 'appointments':
        return 'Appointments & Schedules';
      case 'reports':
        return 'Medical Reports & Analytics';
      case 'settings':
        return 'System & Clinic Settings';
      case 'patients':
        return 'Patient Records & Charts';
      case 'prescriptions':
        return 'Treatment Prescriptions';
      case 'schedule':
        return 'Daily Therapy Schedule';
      case 'treatments':
        return 'Panchakarma Protocols';
      case 'payments':
        return 'Billing & Cash Desk';
      case 'feedback':
        return 'Session Rating & Feedback';
      case 'profile':
        return 'User Account Profile';
      default:
        return 'Clinical Management';
    }
  };

  return (
    <>
      <DashboardLayout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        title={getPageTitle()}
        subtitle={`AyurSutra Intelligent Panchakarma Clinical Management`}
        onOpenAIChat={() => setIsAIChatOpen(true)}
      >
        {renderContent()}
      </DashboardLayout>

      {/* Global Modals & Drawers */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        currentUserId={user._id}
        userRole={user.role}
      />

      {clinicalSupportTarget && (
        <ClinicalSupportModal
          isOpen={!!clinicalSupportTarget}
          onClose={() => setClinicalSupportTarget(null)}
          patientId={clinicalSupportTarget.id}
          patientName={clinicalSupportTarget.name}
        />
      )}

      {diseasePredictionTarget && (
        <DiseasePredictionModal
          isOpen={!!diseasePredictionTarget}
          onClose={() => setDiseasePredictionTarget(null)}
          patientId={diseasePredictionTarget.id}
          patientName={diseasePredictionTarget.name}
        />
      )}

      <PatientTreatmentRecommendationModal
        isOpen={isPatientRecOpen}
        onClose={() => setIsPatientRecOpen(false)}
      />

      <AIChatbotDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </>
  );
};

export default App;
