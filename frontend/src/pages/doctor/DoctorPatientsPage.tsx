import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Activity,
  Heart,
  FileText,
  Sparkles,
  Plus,
  X,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  Pill,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { noteService } from '../../services/noteService';
import { User } from '../../types/user';
import { Note } from '../../types/note';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export interface DoctorPatientsPageProps {
  onOpenClinicalSupport: (patientId: string, patientName: string, patientCondition?: string) => void;
  onOpenDiseasePrediction: (patientId: string, patientName: string, patientCondition?: string) => void;
  onOpenPrescribe: (patientId: string) => void;
}

export const DoctorPatientsPage: React.FC<DoctorPatientsPageProps> = ({
  onOpenClinicalSupport,
  onOpenDiseasePrediction,
  onOpenPrescribe,
}) => {
  const [patients, setPatients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers('patient');
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patient records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSelectPatient = async (p: User) => {
    setSelectedPatient(p);
    try {
      const notes = await noteService.getNotesForPatient(p._id);
      setPatientNotes(notes);
    } catch (err) {
      setPatientNotes([]);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !newNoteText.trim()) return;
    setIsAddingNote(true);
    try {
      await noteService.createNote({
        patientId: selectedPatient._id,
        note: newNoteText,
      });
      setNewNoteText('');
      const updatedNotes = await noteService.getNotesForPatient(selectedPatient._id);
      setPatientNotes(updatedNotes);
    } catch (err: any) {
      alert(err.message || 'Failed to add clinical progress note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.condition && p.condition.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Patient Clinical Registry & Diagnostics
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Ayurvedic health charts, doshic imbalance assessments, clinical notes, and AI diagnostic tools
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Search Bar */}
      <Card padding="sm">
        <div style={{ maxWidth: '360px' }}>
          <Input
            placeholder="Search by patient name, email or doshic condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </Card>

      {/* Patient Grid / Table */}
      <Card padding="none">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Condition / Dosha Imbalance</th>
                <th>Vitals Overview</th>
                <th>Contact</th>
                <th>Clinical Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-slate-900)' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {p.gender || 'Patient'} {p.age ? `| ${p.age} yrs` : ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {p.condition || 'General Assessment'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-700)', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span>BP: <strong>{p.bloodPressure || '-'}</strong></span>
                      <span>Pulse: <strong>{p.heartRate || '-'}</strong></span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)' }}>
                      {p.phone || p.email}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSelectPatient(p)}
                      >
                        Open Chart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenClinicalSupport(p._id, p.full_name, p.condition)}
                        title="AI Clinical Support"
                        leftIcon={<Sparkles size={14} />}
                      >
                        AI Support
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onOpenPrescribe(p._id)}
                        title="Prescribe Treatment"
                        leftIcon={<Pill size={14} />}
                      >
                        Prescribe
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No patient records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Patient Details & Clinical Chart Modal */}
      {selectedPatient && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-slate-200)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-slate-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                  {selectedPatient.full_name} - Clinical Health Record
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                  ID: {selectedPatient._id} | {selectedPatient.email}
                </span>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} style={{ color: 'var(--color-slate-400)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Quick AI & Rx Action Toolbar */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenClinicalSupport(selectedPatient._id, selectedPatient.full_name, selectedPatient.condition)}
                  leftIcon={<Sparkles size={14} />}
                >
                  Clinical Decision Support
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenDiseasePrediction(selectedPatient._id, selectedPatient.full_name, selectedPatient.condition)}
                  leftIcon={<Activity size={14} />}
                >
                  Disease & Imbalance Prediction
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onOpenPrescribe(selectedPatient._id);
                    setSelectedPatient(null);
                  }}
                  leftIcon={<Pill size={14} />}
                >
                  Issue Prescription
                </Button>
              </div>

              {/* Vitals Summary Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'var(--color-slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-slate-200)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Blood Pressure</span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    {selectedPatient.bloodPressure || '120/80'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Pulse (Nadi)</span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    {selectedPatient.heartRate || '74 bpm'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Body Weight</span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    {selectedPatient.weight || '68 kg'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>Temperature</span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    {selectedPatient.temperature || '98.4 F'}
                  </div>
                </div>
              </div>

              {/* Clinical Notes Timeline */}
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                  Physician Consultation Notes
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {patientNotes.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid var(--color-slate-200)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ color: 'var(--color-slate-800)', lineHeight: 1.4 }}>{n.note}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', marginTop: '0.25rem' }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Recent Note'}
                      </div>
                    </div>
                  ))}
                  {patientNotes.length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', fontStyle: 'italic' }}>
                      No clinical notes recorded yet.
                    </div>
                  )}
                </div>

                {/* Add Note Input */}
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Enter diagnostic finding or tongue exam notes..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-slate-200)',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <Button type="submit" variant="primary" size="sm" isLoading={isAddingNote}>
                    Add Note
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientsPage;
