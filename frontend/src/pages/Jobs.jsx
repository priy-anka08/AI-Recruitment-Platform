import { useState, useEffect } from 'react';
import { getJobs, createJob, deleteJob } from '../services/api';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://ai-recruitment-platform-backend-uukb.onrender.com';

const Jobs = () => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills_required: '',
    experience_min: 0,
    experience_max: 5,
    salary_min: 0,
    salary_max: 0,
    location: '',
    job_type: 'full-time',
  });

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobCandidates, setJobCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // NEW: skill assessment state
  const [assessment, setAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);

  // NEW: semantic ranking state
  const [semanticRanking, setSemanticRanking] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [rankingError, setRankingError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      skills_required: '',
      experience_min: 0,
      experience_max: 5,
      salary_min: 0,
      salary_max: 0,
      location: '',
      job_type: 'full-time',
    });
    setEditingJob(null);
    setShowForm(false);
  };

  const handleEdit = (job) => {
    setFormData({
      title: job.title,
      description: job.description,
      skills_required: job.skills_required,
      experience_min: job.experience_min,
      experience_max: job.experience_max,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      location: job.location || '',
      job_type: job.job_type,
    });
    setEditingJob(job);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await axios.put(`${API_BASE}/jobs/${editingJob.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await createJob(formData);
      }
      resetForm();
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await deleteJob(id);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`${API_BASE}/jobs/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetails = async (job) => {
    setSelectedJob(job);
    setLoadingCandidates(true);
    // reset AI feature state for the newly opened job
    setAssessment(null);
    setAssessmentError('');
    setShowAnswers(false);
    setSemanticRanking(null);
    setRankingError('');
    try {
      const res = await axios.get(`${API_BASE}/resumes/candidates/${job.id}`);
      setJobCandidates(res.data);
    } catch (err) {
      console.error(err);
      setJobCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const closeDetails = () => {
    setSelectedJob(null);
    setJobCandidates([]);
  };

  // NEW: generate skill assessment MCQs for this job
  const handleGenerateAssessment = async () => {
    if (!selectedJob) return;
    setLoadingAssessment(true);
    setAssessmentError('');
    setShowAnswers(false);
    try {
      const res = await axios.get(`${API_BASE}/candidates/assessment/${selectedJob.id}`);
      setAssessment(res.data);
    } catch (err) {
      setAssessmentError(err.response?.data?.detail || 'Failed to generate assessment');
    } finally {
      setLoadingAssessment(false);
    }
  };

  // NEW: generate semantic ranking for this job's applicants
  const handleGenerateRanking = async () => {
    if (!selectedJob) return;
    setLoadingRanking(true);
    setRankingError('');
    try {
      const res = await axios.get(`${API_BASE}/candidates/rank/${selectedJob.id}`);
      setSemanticRanking(res.data);
    } catch (err) {
      setRankingError(err.response?.data?.detail || 'Failed to generate semantic ranking');
    } finally {
      setLoadingRanking(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#48bb78';
    if (score >= 50) return '#ed8936';
    return '#f56565';
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
              💼 Job Management
            </h1>
            <p style={{ color: '#666', margin: 0 }}>Create and manage job openings</p>
          </div>
          <button
            onClick={() => {
              if (showForm && editingJob) resetForm();
              else setShowForm(!showForm);
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Cancel' : '+ Post New Job'}
          </button>
        </div>

        {/* Create / Edit Job Form */}
        {showForm && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>
              {editingJob ? '✏️ Edit Job' : '📝 Post New Job'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Job Title</label>
                  <input
                    style={inputStyle}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Python Developer"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input
                    style={inputStyle}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Remote, Mumbai"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Job Description</label>
                  <textarea
                    style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role and responsibilities..."
                    required
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Skills Required</label>
                  <input
                    style={inputStyle}
                    value={formData.skills_required}
                    onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                    placeholder="e.g. Python, FastAPI, SQL"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Min Experience (years)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={formData.experience_min}
                    onChange={(e) => setFormData({ ...formData, experience_min: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Max Experience (years)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={formData.experience_max}
                    onChange={(e) => setFormData({ ...formData, experience_max: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Min Salary (₹)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Max Salary (₹)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Job Type</label>
                  <select
                    style={inputStyle}
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="remote">Remote</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {editingJob ? '✅ Update Job' : '🚀 Post Job'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '12px 32px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    color: '#666',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Jobs List */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>💼</p>
            <h3 style={{ color: '#1e3a5f', margin: '0 0 8px' }}>No jobs posted yet</h3>
            <p style={{ color: '#666' }}>Click "Post New Job" to create your first job opening!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {jobs.map((job) => (
              <div key={job.id} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                border: `1px solid ${job.is_active ? '#f0f0f0' : '#fed7d7'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                opacity: job.is_active ? 1 : 0.7,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3a5f' }}>
                      {job.title}
                    </h3>
                    <span style={{
                      padding: '4px 12px',
                      background: '#667eea20',
                      color: '#667eea',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {job.job_type}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      background: job.is_active ? '#48bb7820' : '#f5656520',
                      color: job.is_active ? '#48bb78' : '#f56565',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {job.is_active ? '✅ Active' : '🔴 Closed'}
                    </span>
                  </div>
                  <p style={{ color: '#666', margin: '0 0 12px', fontSize: '14px' }}>
                    {job.description?.substring(0, 120)}...
                  </p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      📍 {job.location || 'Not specified'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      💰 ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      🎓 {job.experience_min}-{job.experience_max} years
                    </span>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#667eea', fontWeight: '600' }}>
                      🛠️ {job.skills_required}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => handleViewDetails(job)}
                    style={{
                      padding: '8px 16px',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      color: '#166534',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    📋 View Details
                  </button>
                  <button
                    onClick={() => handleEdit(job)}
                    style={{
                      padding: '8px 16px',
                      background: '#ebf4ff',
                      border: '1px solid #bee3f8',
                      borderRadius: '8px',
                      color: '#3182ce',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(job.id)}
                    style={{
                      padding: '8px 16px',
                      background: job.is_active ? '#fffbeb' : '#f0fdf4',
                      border: `1px solid ${job.is_active ? '#fbd38d' : '#86efac'}`,
                      borderRadius: '8px',
                      color: job.is_active ? '#d69e2e' : '#166534',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {job.is_active ? '🔒 Close' : '🔓 Reopen'}
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#fff5f5',
                      border: '1px solid #fed7d7',
                      borderRadius: '8px',
                      color: '#f56565',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Job Detail Modal — full description + applicants sorted by match score */}
        {selectedJob && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) closeDetails(); }}
          >
            <div style={{
              background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '720px',
              maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            }}>
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a5f, #2c5364)',
                padding: '24px 28px', borderRadius: '20px 20px 0 0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '20px' }}>
                    {selectedJob.title}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: '#8ab4d4', fontSize: '13px' }}>
                    📍 {selectedJob.location || 'Not specified'} · {selectedJob.job_type}
                  </p>
                </div>
                <button onClick={closeDetails} style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  borderRadius: '8px', color: '#fff', padding: '6px 12px',
                  cursor: 'pointer', fontSize: '16px',
                }}>✕</button>
              </div>

              <div style={{ padding: '28px' }}>
                {/* Full Job Description */}
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                    📝 Job Description
                  </p>
                  <p style={{
                    margin: 0, fontSize: '14px', color: '#333', lineHeight: '1.6',
                    background: '#f7f8fc', padding: '16px', borderRadius: '10px',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {selectedJob.description}
                  </p>
                </div>

                {/* Skills / Experience / Salary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>Experience</p>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#1e3a5f' }}>
                      {selectedJob.experience_min}-{selectedJob.experience_max} yrs
                    </p>
                  </div>
                  <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>Salary</p>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#1e3a5f' }}>
                      ₹{selectedJob.salary_min?.toLocaleString()}-₹{selectedJob.salary_max?.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ background: '#fff7ed', borderRadius: '10px', padding: '12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666' }}>Skills</p>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#1e3a5f' }}>
                      {selectedJob.skills_required}
                    </p>
                  </div>
                </div>

                {/* NEW: Skill Assessment Generator */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                      🧠 Skill Assessment (MCQ Quiz)
                    </p>
                    <button
                      onClick={handleGenerateAssessment}
                      disabled={loadingAssessment}
                      style={{
                        padding: '6px 14px',
                        background: loadingAssessment ? '#ccc' : 'linear-gradient(135deg, #38b2ac, #319795)',
                        border: 'none', borderRadius: '8px', color: '#fff',
                        fontSize: '12px', fontWeight: '600',
                        cursor: loadingAssessment ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loadingAssessment ? '⏳ Generating...' : assessment ? '🔄 Regenerate' : '✨ Generate Quiz'}
                    </button>
                  </div>

                  {assessmentError && (
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#c53030' }}>⚠️ {assessmentError}</p>
                  )}

                  {assessment && (
                    <div style={{
                      background: '#f7f8fc', border: '1px solid #e2e8f0',
                      borderRadius: '12px', padding: '16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                        <button
                          onClick={() => setShowAnswers(!showAnswers)}
                          style={{
                            padding: '4px 10px', background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                            color: '#666', cursor: 'pointer',
                          }}
                        >
                          {showAnswers ? '🙈 Hide Answers' : '👁️ Show Answers'}
                        </button>
                      </div>
                      {assessment.questions?.map((q, i) => (
                        <div key={i} style={{
                          marginBottom: '16px', paddingBottom: '16px',
                          borderBottom: i < assessment.questions.length - 1 ? '1px solid #e2e8f0' : 'none',
                        }}>
                          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#1e3a5f' }}>
                            {i + 1}. {q.question}
                            <span style={{
                              marginLeft: '8px', fontSize: '10px', fontWeight: '600',
                              color: '#38b2ac', background: '#e6fffa', padding: '2px 8px', borderRadius: '10px',
                            }}>
                              {q.skill_tested}
                            </span>
                          </p>
                          <div style={{ display: 'grid', gap: '6px' }}>
                            {q.options?.map((opt, j) => (
                              <div key={j} style={{
                                padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                                background: showAnswers && opt === q.correct_answer ? '#c6f6d5' : '#fff',
                                border: `1px solid ${showAnswers && opt === q.correct_answer ? '#48bb78' : '#e2e8f0'}`,
                                color: showAnswers && opt === q.correct_answer ? '#166534' : '#333',
                              }}>
                                {opt} {showAnswers && opt === q.correct_answer && '✓'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* NEW: Semantic Ranking */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                      🎯 Semantic Candidate Ranking
                    </p>
                    <button
                      onClick={handleGenerateRanking}
                      disabled={loadingRanking}
                      style={{
                        padding: '6px 14px',
                        background: loadingRanking ? '#ccc' : 'linear-gradient(135deg, #9f7aea, #805ad5)',
                        border: 'none', borderRadius: '8px', color: '#fff',
                        fontSize: '12px', fontWeight: '600',
                        cursor: loadingRanking ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loadingRanking ? '⏳ Ranking...' : semanticRanking ? '🔄 Re-rank' : '✨ Rank Candidates'}
                    </button>
                  </div>

                  {rankingError && (
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#c53030' }}>⚠️ {rankingError}</p>
                  )}

                  {semanticRanking && (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {semanticRanking.ranked_candidates?.map((c) => (
                        <div key={c.candidate_id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '12px',
                          padding: '12px 16px', background: '#f7f0ff', borderRadius: '10px',
                          border: '1px solid #e9d8fd',
                        }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: '#9f7aea', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '700', flexShrink: 0,
                          }}>
                            {c.semantic_rank}
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                              {c.candidate_name}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                              {c.reasoning}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applicants sorted by JD match */}
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>
                    👥 Applicants ({jobCandidates.length}) — sorted by JD Match
                  </p>

                  {loadingCandidates ? (
                    <p style={{ color: '#666', fontSize: '14px' }}>Loading applicants...</p>
                  ) : jobCandidates.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '14px' }}>No candidates have applied to this job yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {jobCandidates.map((c) => (
                        <div key={c.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 16px', background: '#f7f8fc', borderRadius: '10px',
                          border: '1px solid #f0f0f0',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: '700', fontSize: '13px',
                            }}>
                              {c.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#1e3a5f' }}>
                                {c.full_name}
                              </p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>{c.email}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>JD Match</p>
                            <p style={{
                              margin: 0, fontWeight: '700', fontSize: '15px',
                              color: getScoreColor(c.ats_score),
                            }}>
                              {c.ats_score}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;