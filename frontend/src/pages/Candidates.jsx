import { useState, useEffect } from 'react';
import { getAllCandidates, updateCandidateStatus, getJobs } from '../services/api';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const statusColors = {
  applied: { bg: '#ebf8ff', color: '#3182ce' },
  under_review: { bg: '#fefcbf', color: '#d69e2e' },
  screened: { bg: '#e9d8fd', color: '#805ad5' },
  shortlisted: { bg: '#c6f6d5', color: '#276749' },
  interview_scheduled: { bg: '#bee3f8', color: '#2b6cb0' },
  technical_round: { bg: '#fed7e2', color: '#97266d' },
  hr_round: { bg: '#feebc8', color: '#c05621' },
  selected: { bg: '#c6f6d5', color: '#22543d' },
  rejected: { bg: '#fed7d7', color: '#c53030' },
  joined: { bg: '#b2f5ea', color: '#234e52' },
};

const recommendationColors = {
  'Highly Recommended': { bg: '#c6f6d5', color: '#22543d' },
  'Recommended': { bg: '#bee3f8', color: '#2b6cb0' },
  'Needs Review': { bg: '#feebc8', color: '#c05621' },
  'Not Suitable': { bg: '#fed7d7', color: '#c53030' },
};

const fraudRiskColors = {
  'Low': { bg: '#c6f6d5', color: '#22543d' },
  'Medium': { bg: '#feebc8', color: '#c05621' },
  'High': { bg: '#fed7d7', color: '#c53030' },
};

const allStatuses = [
  'applied', 'under_review', 'screened', 'shortlisted',
  'interview_scheduled', 'technical_round', 'hr_round',
  'selected', 'rejected', 'joined'
];

const API_BASE = 'https://ai-recruitment-platform-backend-uukb.onrender.com';

const emptyManualForm = {
  full_name: '', email: '', phone: '', job_id: '',
  skills: '', experience_years: 0, education: '',
};

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [bulkJobId, setBulkJobId] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [addError, setAddError] = useState('');

  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState('');

  // NEW: fraud check state
  const [fraudResult, setFraudResult] = useState(null);
  const [loadingFraud, setLoadingFraud] = useState(false);
  const [fraudError, setFraudError] = useState('');

  // NEW: offer recommendation state
  const [offerResult, setOfferResult] = useState(null);
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [offerError, setOfferError] = useState('');

  // NEW: pipeline prediction state
  const [pipelineResult, setPipelineResult] = useState(null);
  const [loadingPipeline, setLoadingPipeline] = useState(false);
  const [pipelineError, setPipelineError] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    setInterviewQuestions(null);
    setQuestionsError('');
    setFraudResult(null);
    setFraudError('');
    setOfferResult(null);
    setOfferError('');
    setPipelineResult(null);
    setPipelineError('');
  }, [selectedCandidate?.id]);

  const fetchCandidates = async () => {
    try {
      const res = await getAllCandidates();
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateCandidateStatus(id, status);
      fetchCandidates();
      if (selectedCandidate?.id === id) {
        setSelectedCandidate(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openBulkModal = async () => {
    setShowBulkModal(true);
    setBulkResult(null);
    setBulkFile(null);
    setBulkJobId('');
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkResult(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkJobId || !bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await axios.post(
        `${API_BASE}/candidates/bulk-upload/${bulkJobId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setBulkResult(res.data);
      fetchCandidates();
    } catch (err) {
      console.error(err);
      setBulkResult({ message: 'Upload failed', added: 0, skipped: 0, errors: ['Something went wrong'] });
    } finally {
      setBulkUploading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API_BASE}/candidates/export/excel`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'candidates_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setManualForm(emptyManualForm);
    setAddError('');
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddError('');
  };

  const handleAddCandidate = async () => {
    if (!manualForm.full_name || !manualForm.email || !manualForm.job_id) {
      setAddError('Name, Email and Job are required');
      return;
    }
    setAddingCandidate(true);
    setAddError('');
    try {
      await axios.post(`${API_BASE}/candidates/`, manualForm);
      setShowAddModal(false);
      fetchCandidates();
    } catch (err) {
      setAddError(err.response?.data?.detail || 'Failed to add candidate');
    } finally {
      setAddingCandidate(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedCandidate) return;
    setLoadingQuestions(true);
    setQuestionsError('');
    try {
      const res = await axios.get(`${API_BASE}/candidates/${selectedCandidate.id}/interview-questions`);
      setInterviewQuestions(res.data);
    } catch (err) {
      setQuestionsError(err.response?.data?.detail || 'Failed to generate questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // NEW: run fraud check for the currently open candidate
  const handleFraudCheck = async () => {
    if (!selectedCandidate) return;
    setLoadingFraud(true);
    setFraudError('');
    try {
      const res = await axios.get(`${API_BASE}/candidates/${selectedCandidate.id}/fraud-check`);
      setFraudResult(res.data);
    } catch (err) {
      setFraudError(err.response?.data?.detail || 'Failed to run fraud check');
    } finally {
      setLoadingFraud(false);
    }
  };

  // NEW: run offer recommendation for the currently open candidate
  const handleOfferRecommendation = async () => {
    if (!selectedCandidate) return;
    setLoadingOffer(true);
    setOfferError('');
    try {
      const res = await axios.get(`${API_BASE}/candidates/${selectedCandidate.id}/offer-recommendation`);
      setOfferResult(res.data);
    } catch (err) {
      setOfferError(err.response?.data?.detail || 'Failed to generate offer recommendation');
    } finally {
      setLoadingOffer(false);
    }
  };

  // NEW: run pipeline prediction for the currently open candidate
  const handlePipelinePrediction = async () => {
    if (!selectedCandidate) return;
    setLoadingPipeline(true);
    setPipelineError('');
    try {
      const res = await axios.get(`${API_BASE}/candidates/${selectedCandidate.id}/pipeline-prediction`);
      setPipelineResult(res.data);
    } catch (err) {
      setPipelineError(err.response?.data?.detail || 'Failed to generate pipeline prediction');
    } finally {
      setLoadingPipeline(false);
    }
  };

  const filtered = candidates
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      search === '' ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.toLowerCase().includes(search.toLowerCase())
    );

  const stats = {
    total: candidates.length,
    selected: candidates.filter(c => c.status === 'selected').length,
    screened: candidates.filter(c => c.status === 'screened').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    avgAts: candidates.length
      ? Math.round(candidates.reduce((sum, c) => sum + (c.ats_score || 0), 0) / candidates.length)
      : 0,
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#48bb78';
    if (score >= 50) return '#ed8936';
    return '#f56565';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
              👥 Candidates
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Manage and track all candidates — {candidates.length} total
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openAddModal}
              style={{
                padding: '10px 18px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '10px',
                color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              }}
            >
              ➕ Add Candidate
            </button>
            <button
              onClick={openBulkModal}
              style={{
                padding: '10px 18px', background: '#f0fdf4',
                border: '1px solid #86efac', borderRadius: '10px',
                color: '#166534', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              }}
            >
              📥 Bulk Upload
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: '10px 18px', background: '#ebf4ff',
                border: '1px solid #bee3f8', borderRadius: '10px',
                color: '#3182ce', cursor: exporting ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: '600',
              }}
            >
              {exporting ? '⏳ Exporting...' : '📤 Export Excel'}
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: stats.total, icon: '👥', color: '#667eea' },
            { label: 'Screened', value: stats.screened, icon: '🔍', color: '#805ad5' },
            { label: 'Selected', value: stats.selected, icon: '✅', color: '#48bb78' },
            { label: 'Rejected', value: stats.rejected, icon: '❌', color: '#f56565' },
            { label: 'Avg ATS', value: `${stats.avgAts}%`, icon: '🎯', color: '#ed8936' },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '12px', padding: '16px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${card.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>
                {card.icon}
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#666' }}>{card.label}</p>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: card.color }}>
                  {card.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search by name, email or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '10px 16px', border: '2px solid #e2e8f0',
              borderRadius: '10px', fontSize: '14px', outline: 'none',
              width: '300px', background: '#fff',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                background: filter === 'all' ? '#667eea' : '#fff',
                color: filter === 'all' ? '#fff' : '#666',
                border: '1px solid #e2e8f0', borderRadius: '20px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              }}
            >
              All ({candidates.length})
            </button>
            {allStatuses.map(status => {
              const count = candidates.filter(c => c.status === status).length;
              if (count === 0) return null;
              return (
                <button key={status} onClick={() => setFilter(status)}
                  style={{
                    padding: '8px 16px',
                    background: filter === status ? statusColors[status]?.color : '#fff',
                    color: filter === status ? '#fff' : '#666',
                    border: '1px solid #e2e8f0', borderRadius: '20px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  }}
                >
                  {status.replace(/_/g, ' ')} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading candidates...</p>
        ) : filtered.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '60px',
            textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>👥</p>
            <h3 style={{ color: '#1e3a5f' }}>No candidates found</h3>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #1e3a5f, #2c5364)' }}>
                  {['Candidate', 'Skills', 'Experience', 'ATS Score', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left',
                      fontSize: '13px', fontWeight: '700', color: '#fff',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate, i) => (
                  <tr key={candidate.id} style={{
                    borderBottom: '1px solid #f0f0f0',
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.2s',
                  }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: '700', fontSize: '14px',
                        }}>
                          {candidate.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1e3a5f' }}>
                            {candidate.full_name}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{candidate.email}</p>
                          {candidate.phone && (
                            <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>{candidate.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                        {candidate.skills?.split(',').slice(0, 3).map((skill, j) => (
                          <span key={j} style={{
                            padding: '2px 6px', borderRadius: '6px',
                            background: '#667eea15', color: '#667eea',
                            fontSize: '11px', fontWeight: '600',
                          }}>
                            {skill.trim()}
                          </span>
                        ))}
                        {candidate.skills?.split(',').length > 3 && (
                          <span style={{ fontSize: '11px', color: '#999' }}>
                            +{candidate.skills.split(',').length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#333' }}>
                      {candidate.experience_years} yrs
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${candidate.ats_score}%`, height: '100%',
                            background: getScoreColor(candidate.ats_score), borderRadius: '3px',
                          }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: getScoreColor(candidate.ats_score) }}>
                          {candidate.ats_score}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: statusColors[candidate.status]?.bg || '#f0f0f0',
                        color: statusColors[candidate.status]?.color || '#666',
                        borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      }}>
                        {candidate.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select
                          value={candidate.status}
                          onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                          style={{
                            padding: '6px 10px', border: '1px solid #e2e8f0',
                            borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none',
                          }}
                        >
                          {allStatuses.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setSelectedCandidate(candidate)}
                          style={{
                            padding: '6px 10px', background: '#667eea15',
                            border: '1px solid #667eea40', borderRadius: '8px',
                            color: '#667eea', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                          }}
                        >
                          👁️ View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Candidate Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 1100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) closeAddModal(); }}
          >
            <div style={{
              background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px',
              padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              maxHeight: '90vh', overflow: 'auto',
            }}>
              <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>➕ Add Candidate</h3>

              {addError && (
                <div style={{
                  padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7',
                  borderRadius: '8px', color: '#c53030', fontSize: '13px', marginBottom: '14px',
                }}>
                  ⚠️ {addError}
                </div>
              )}

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={manualForm.full_name}
                onChange={(e) => setManualForm({ ...manualForm, full_name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                style={{
                  width: '100%', padding: '10px 14px', marginBottom: '14px',
                  border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Email *
              </label>
              <input
                type="email"
                value={manualForm.email}
                onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                placeholder="e.g. rahul@example.com"
                style={{
                  width: '100%', padding: '10px 14px', marginBottom: '14px',
                  border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Phone
              </label>
              <input
                type="text"
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                style={{
                  width: '100%', padding: '10px 14px', marginBottom: '14px',
                  border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Job *
              </label>
              <select
                value={manualForm.job_id}
                onChange={(e) => setManualForm({ ...manualForm, job_id: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', marginBottom: '14px',
                  border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none',
                }}
              >
                <option value="">-- Choose a job --</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Skills (comma separated)
              </label>
              <input
                type="text"
                value={manualForm.skills}
                onChange={(e) => setManualForm({ ...manualForm, skills: e.target.value })}
                placeholder="e.g. Python, React, SQL"
                style={{
                  width: '100%', padding: '10px 14px', marginBottom: '14px',
                  border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    value={manualForm.experience_years}
                    onChange={(e) => setManualForm({ ...manualForm, experience_years: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                    Education
                  </label>
                  <input
                    type="text"
                    value={manualForm.education}
                    onChange={(e) => setManualForm({ ...manualForm, education: e.target.value })}
                    placeholder="e.g. B.Tech CSE"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={handleAddCandidate}
                  disabled={addingCandidate}
                  style={{
                    flex: 1, padding: '12px', border: 'none', borderRadius: '10px',
                    background: addingCandidate ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#fff', fontWeight: '600', fontSize: '14px',
                    cursor: addingCandidate ? 'not-allowed' : 'pointer',
                  }}
                >
                  {addingCandidate ? '⏳ Adding...' : '✅ Add Candidate'}
                </button>
                <button
                  onClick={closeAddModal}
                  style={{
                    padding: '12px 20px', background: '#f1f5f9',
                    border: '1px solid #e2e8f0', borderRadius: '10px',
                    color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkModal && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 1100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) closeBulkModal(); }}
          >
            <div style={{
              background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '440px',
              padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            }}>
              <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>📥 Bulk Upload Candidates</h3>

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Select Job
              </label>
              <select
                value={bulkJobId}
                onChange={(e) => setBulkJobId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', marginBottom: '16px',
                  border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none',
                }}
              >
                <option value="">-- Choose a job --</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                Excel File (.xlsx) — Columns: Name, Email, Phone
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setBulkFile(e.target.files[0])}
                style={{
                  width: '100%', padding: '10px', marginBottom: '16px',
                  border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '13px',
                }}
              />

              {bulkResult && (
                <div style={{
                  padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
                  background: bulkResult.added > 0 ? '#f0fdf4' : '#fff5f5',
                  color: bulkResult.added > 0 ? '#166534' : '#c53030',
                }}>
                  ✅ Added: {bulkResult.added} &nbsp; ⏭️ Skipped: {bulkResult.skipped}
                  {bulkResult.errors?.length > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '12px' }}>
                      {bulkResult.errors.map((e, i) => <div key={i}>⚠️ {e}</div>)}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleBulkUpload}
                  disabled={!bulkJobId || !bulkFile || bulkUploading}
                  style={{
                    flex: 1, padding: '12px', border: 'none', borderRadius: '10px',
                    background: (!bulkJobId || !bulkFile || bulkUploading) ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#fff', fontWeight: '600', fontSize: '14px',
                    cursor: (!bulkJobId || !bulkFile || bulkUploading) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bulkUploading ? '⏳ Uploading...' : '🚀 Upload'}
                </button>
                <button
                  onClick={closeBulkModal}
                  style={{
                    padding: '12px 20px', background: '#f1f5f9',
                    border: '1px solid #e2e8f0', borderRadius: '10px',
                    color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Detail Modal */}
        {selectedCandidate && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedCandidate(null); }}
          >
            <div style={{
              background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '680px',
              maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            }}>
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a5f, #2c5364)',
                padding: '24px 28px', borderRadius: '20px 20px 0 0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: '700', fontSize: '20px',
                  }}>
                    {selectedCandidate.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
                      {selectedCandidate.full_name}
                    </h3>
                    <p style={{ margin: 0, color: '#8ab4d4', fontSize: '13px' }}>
                      {selectedCandidate.email}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  borderRadius: '8px', color: '#fff', padding: '6px 12px',
                  cursor: 'pointer', fontSize: '16px',
                }}>✕</button>
              </div>

              <div style={{ padding: '28px' }}>
                {/* Score Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>ATS Score</p>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: getScoreColor(selectedCandidate.ats_score) }}>
                      {selectedCandidate.ats_score}%
                    </h3>
                  </div>
                  <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>Experience</p>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                      {selectedCandidate.experience_years} yrs
                    </h3>
                  </div>
                  <div style={{
                    background: statusColors[selectedCandidate.status]?.bg || '#f0f0f0',
                    borderRadius: '10px', padding: '14px', textAlign: 'center',
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>Status</p>
                    <h3 style={{
                      margin: 0, fontSize: '14px', fontWeight: '700',
                      color: statusColors[selectedCandidate.status]?.color || '#666',
                    }}>
                      {selectedCandidate.status?.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  {[
                    { label: '📧 Email', value: selectedCandidate.email },
                    { label: '📞 Phone', value: selectedCandidate.phone || 'N/A' },
                    { label: '🎓 Education', value: selectedCandidate.education || 'N/A' },
                    { label: '💼 Experience', value: `${selectedCandidate.experience_years} years` },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#f7f8fc', borderRadius: '8px', padding: '12px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>{item.label}</p>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1e3a5f' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Resume */}
<div style={{ marginBottom: '20px' }}>
  <p
    style={{
      margin: '0 0 10px',
      fontSize: '13px',
      fontWeight: '700',
      color: '#1e3a5f',
    }}
  >
    📄 Resume
  </p>

  {selectedCandidate.resume_url ? (
    <div style={{ display: 'flex', gap: '10px' }}>

      <a
        href={selectedCandidate.resume_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '10px 16px',
          background: '#667eea',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        👁️ View Resume
      </a>

      <a
        href={selectedCandidate.resume_url.replace(
          '/upload/',
          '/upload/fl_attachment/'
        )}
        style={{
          padding: '10px 16px',
          background: '#f1f5f9',
          color: '#1e3a5f',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
          border: '1px solid #e2e8f0',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ⬇️ Download
      </a>

    </div>
  ) : (
    <p
      style={{
        margin: 0,
        fontSize: '13px',
        color: '#999',
      }}
    >
      No resume uploaded
    </p>
  )}
</div>

                {/* Interview Questions */}
                {selectedCandidate.resume_text && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                        🎤 Interview Questions
                      </p>
                      <button
                        onClick={handleGenerateQuestions}
                        disabled={loadingQuestions}
                        style={{
                          padding: '6px 14px',
                          background: loadingQuestions ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                          border: 'none', borderRadius: '8px', color: '#fff',
                          fontSize: '12px', fontWeight: '600',
                          cursor: loadingQuestions ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loadingQuestions ? '⏳ Generating...' : interviewQuestions ? '🔄 Regenerate' : '✨ Generate Questions'}
                      </button>
                    </div>

                    {questionsError && (
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#c53030' }}>⚠️ {questionsError}</p>
                    )}

                    {interviewQuestions && (
                      <div style={{
                        background: '#f7f8fc', border: '1px solid #e2e8f0',
                        borderRadius: '12px', padding: '16px',
                      }}>
                        {[
                          { key: 'technical_questions', label: '🧠 Technical', color: '#667eea' },
                          { key: 'behavioral_questions', label: '🤝 Behavioral', color: '#805ad5' },
                          { key: 'resume_specific_questions', label: '📄 Resume-Specific', color: '#ed8936' },
                        ].map(section => (
                          interviewQuestions[section.key]?.length > 0 && (
                            <div key={section.key} style={{ marginBottom: '14px' }}>
                              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '700', color: section.color }}>
                                {section.label}
                              </p>
                              <ol style={{ margin: 0, paddingLeft: '18px' }}>
                                {interviewQuestions[section.key].map((q, i) => (
                                  <li key={i} style={{ fontSize: '13px', color: '#333', marginBottom: '6px', lineHeight: '1.5' }}>
                                    {q}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* NEW: Fraud Check */}
                {selectedCandidate.resume_text && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                        🔍 Resume Authenticity Check
                      </p>
                      <button
                        onClick={handleFraudCheck}
                        disabled={loadingFraud}
                        style={{
                          padding: '6px 14px',
                          background: loadingFraud ? '#ccc' : 'linear-gradient(135deg, #ed8936, #dd6b20)',
                          border: 'none', borderRadius: '8px', color: '#fff',
                          fontSize: '12px', fontWeight: '600',
                          cursor: loadingFraud ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loadingFraud ? '⏳ Checking...' : fraudResult ? '🔄 Re-check' : '🔍 Run Check'}
                      </button>
                    </div>

                    {fraudError && (
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#c53030' }}>⚠️ {fraudError}</p>
                    )}

                    {fraudResult && (
                      <div style={{
                        background: '#f7f8fc', border: '1px solid #e2e8f0',
                        borderRadius: '12px', padding: '16px',
                      }}>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: fraudRiskColors[fraudResult.risk_level]?.bg || '#f0f0f0',
                            color: fraudRiskColors[fraudResult.risk_level]?.color || '#666',
                          }}>
                            {fraudResult.risk_level === 'Low' ? '✅' : fraudResult.risk_level === 'Medium' ? '⚠️' : '🚨'} {fraudResult.risk_level} Risk
                          </span>
                        </div>

                        {fraudResult.notes && (
                          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#333', lineHeight: '1.5' }}>
                            {fraudResult.notes}
                          </p>
                        )}

                        {fraudResult.red_flags?.length > 0 && (
                          <ul style={{ margin: 0, paddingLeft: '18px' }}>
                            {fraudResult.red_flags.map((flag, i) => (
                              <li key={i} style={{ fontSize: '13px', color: '#c53030', marginBottom: '6px', lineHeight: '1.5' }}>
                                {flag}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* NEW: AI Offer Recommendation */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                      💰 AI Offer Recommendation
                    </p>
                    <button
                      onClick={handleOfferRecommendation}
                      disabled={loadingOffer}
                      style={{
                        padding: '6px 14px',
                        background: loadingOffer ? '#ccc' : 'linear-gradient(135deg, #38a169, #2f855a)',
                        border: 'none', borderRadius: '8px', color: '#fff',
                        fontSize: '12px', fontWeight: '600',
                        cursor: loadingOffer ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loadingOffer ? '⏳ Calculating...' : offerResult ? '🔄 Re-calculate' : '💰 Get Recommendation'}
                    </button>
                  </div>

                  {offerError && (
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#c53030' }}>⚠️ {offerError}</p>
                  )}

                  {offerResult && (
                    <div style={{
                      background: '#f0fff4', border: '1px solid #c6f6d5',
                      borderRadius: '12px', padding: '16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#666' }}>Recommended Salary</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#276749' }}>
                          ₹{Number(offerResult.recommended_salary || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Suggested Range</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          ₹{Number(offerResult.salary_range_low || 0).toLocaleString('en-IN')} – ₹{Number(offerResult.salary_range_high || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {offerResult.confidence_level && (
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: '700',
                            background: '#c6f6d5', color: '#276749',
                          }}>
                            Confidence: {offerResult.confidence_level}
                          </span>
                        </div>
                      )}
                      {offerResult.reasoning && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#333', lineHeight: '1.5' }}>
                          {offerResult.reasoning}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* NEW: AI Candidate Pipeline Prediction */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                      📈 AI Pipeline Prediction
                    </p>
                    <button
                      onClick={handlePipelinePrediction}
                      disabled={loadingPipeline}
                      style={{
                        padding: '6px 14px',
                        background: loadingPipeline ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        border: 'none', borderRadius: '8px', color: '#fff',
                        fontSize: '12px', fontWeight: '600',
                        cursor: loadingPipeline ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loadingPipeline ? '⏳ Predicting...' : pipelineResult ? '🔄 Re-predict' : '📈 Predict Outcome'}
                    </button>
                  </div>

                  {pipelineError && (
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#c53030' }}>⚠️ {pipelineError}</p>
                  )}

                  {pipelineResult && (
                    <div style={{
                      background: '#f7f8ff', border: '1px solid #e0e7ff',
                      borderRadius: '12px', padding: '16px',
                    }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ flex: 1, textAlign: 'center', background: '#fff', borderRadius: '10px', padding: '10px' }}>
                          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>Interview Success</p>
                          <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#667eea' }}>
                            {pipelineResult.interview_success_probability}%
                          </p>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', background: '#fff', borderRadius: '10px', padding: '10px' }}>
                          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>Offer Acceptance</p>
                          <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#667eea' }}>
                            {pipelineResult.offer_acceptance_probability}%
                          </p>
                        </div>
                      </div>

                      {pipelineResult.overall_hire_likelihood && (
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: '700',
                            background: '#e0e7ff', color: '#4c51bf',
                          }}>
                            Overall Likelihood: {pipelineResult.overall_hire_likelihood}
                          </span>
                        </div>
                      )}

                      {pipelineResult.key_strengths?.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#276749' }}>✅ Strengths</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {pipelineResult.key_strengths.map((s, i) => (
                              <span key={i} style={{
                                padding: '3px 10px', borderRadius: '12px',
                                background: '#c6f6d5', color: '#276749',
                                fontSize: '11px', fontWeight: '600',
                              }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pipelineResult.risk_factors?.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#c53030' }}>⚠️ Risk Factors</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {pipelineResult.risk_factors.map((r, i) => (
                              <span key={i} style={{
                                padding: '3px 10px', borderRadius: '12px',
                                background: '#fed7d7', color: '#c53030',
                                fontSize: '11px', fontWeight: '600',
                              }}>{r}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pipelineResult.reasoning && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#333', lineHeight: '1.5' }}>
                          {pipelineResult.reasoning}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Insights — Summary, Recommendation, Skill Gap */}
                {(selectedCandidate.ai_summary || selectedCandidate.recommendation_label) && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                      🤖 AI Insights
                    </p>

                    <div style={{
                      background: 'linear-gradient(135deg, #f0f4ff, #f7f0ff)',
                      border: '1px solid #e0e7ff',
                      borderRadius: '12px',
                      padding: '16px',
                    }}>
                      {selectedCandidate.recommendation_label && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: recommendationColors[selectedCandidate.recommendation_label]?.bg || '#f0f0f0',
                            color: recommendationColors[selectedCandidate.recommendation_label]?.color || '#666',
                          }}>
                            ⭐ {selectedCandidate.recommendation_label}
                          </span>
                        </div>
                      )}

                      {selectedCandidate.ai_summary && (
                        <p style={{
                          margin: '0 0 14px', fontSize: '13px', color: '#333',
                          lineHeight: '1.6', fontStyle: 'italic',
                        }}>
                          "{selectedCandidate.ai_summary}"
                        </p>
                      )}

                      {(selectedCandidate.matched_skills || selectedCandidate.missing_skills) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {selectedCandidate.matched_skills && (
                            <div>
                              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#166534' }}>
                                ✅ Matched Skills
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {selectedCandidate.matched_skills.split(',').map((s, i) => (
                                  <span key={i} style={{
                                    padding: '3px 8px', borderRadius: '10px', fontSize: '11px',
                                    background: '#c6f6d5', color: '#166534', fontWeight: '600',
                                  }}>
                                    {s.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedCandidate.missing_skills && (
                            <div>
                              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#c53030' }}>
                                ❌ Missing Skills
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {selectedCandidate.missing_skills.split(',').map((s, i) => (
                                  <span key={i} style={{
                                    padding: '3px 8px', borderRadius: '10px', fontSize: '11px',
                                    background: '#fed7d7', color: '#c53030', fontWeight: '600',
                                  }}>
                                    {s.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedCandidate.skills && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                      🛠️ Skills
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedCandidate.skills.split(',').map((skill, i) => (
                        <span key={i} style={{
                          padding: '4px 10px', borderRadius: '12px',
                          background: '#667eea15', color: '#667eea',
                          fontSize: '12px', fontWeight: '600',
                        }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Candidate Timeline */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                    📈 Recruitment Timeline
                  </p>
                  <div style={{ display: 'flex', gap: '0', overflowX: 'auto', paddingBottom: '8px' }}>
                    {allStatuses.map((s, i) => {
                      const currentIndex = allStatuses.indexOf(selectedCandidate.status);
                      const isPast = i <= currentIndex;
                      const isCurrent = s === selectedCandidate.status;
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: isCurrent ? '#667eea' : isPast ? '#48bb78' : '#e2e8f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto 4px',
                              fontSize: '10px', color: isPast || isCurrent ? '#fff' : '#999',
                              fontWeight: '700', border: isCurrent ? '2px solid #667eea' : 'none',
                            }}>
                              {isPast && !isCurrent ? '✓' : i + 1}
                            </div>
                            <p style={{
                              margin: 0, fontSize: '9px',
                              color: isCurrent ? '#667eea' : isPast ? '#48bb78' : '#999',
                              fontWeight: isCurrent ? '700' : '400',
                              maxWidth: '50px', lineHeight: '1.2',
                            }}>
                              {s.replace(/_/g, ' ')}
                            </p>
                          </div>
                          {i < allStatuses.length - 1 && (
                            <div style={{
                              width: '20px', height: '2px',
                              background: i < currentIndex ? '#48bb78' : '#e2e8f0',
                              flexShrink: 0,
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Update Status */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    value={selectedCandidate.status}
                    onChange={(e) => handleStatusUpdate(selectedCandidate.id, e.target.value)}
                    style={{
                      flex: 1, padding: '10px 14px',
                      border: '2px solid #667eea', borderRadius: '8px',
                      fontSize: '14px', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {allStatuses.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    style={{
                      padding: '10px 20px', background: '#f1f5f9',
                      border: '1px solid #e2e8f0', borderRadius: '8px',
                      color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Candidates;