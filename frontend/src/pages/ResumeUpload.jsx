import { useState, useEffect } from 'react';
import { getJobs, uploadResume, getCandidatesByJob } from '../services/api';
import Sidebar from '../components/Sidebar';

const ResumeUpload = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCandidates = async (jobId) => {
    try {
      const res = await getCandidatesByJob(jobId);
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJobChange = (e) => {
    setSelectedJob(e.target.value);
    if (e.target.value) fetchCandidates(e.target.value);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedJob) {
      setError('Please select a job and upload a resume!');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadResume(selectedJob, formData);
      setResult(res.data);
      fetchCandidates(selectedJob);
    } catch (err) {
      setError('Upload failed! Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
            📄 AI Resume Screening
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Upload resumes and get instant ATS scores powered by Gemini AI
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* Upload Form */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f', fontSize: '16px' }}>
              🚀 Upload Resume
            </h3>

            {error && (
              <div style={{
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#c53030',
                fontSize: '14px',
              }}>
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleUpload}>
              {/* Job Select */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#333',
                }}>Select Job Position</label>
                <select
                  value={selectedJob}
                  onChange={handleJobChange}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                  required
                >
                  <option value="">-- Select a Job --</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.location || 'Remote'}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#333',
                }}>Upload Resume (PDF / DOCX / TXT)</label>
                <div style={{
                  border: '2px dashed #667eea',
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center',
                  background: '#f7f8ff',
                  cursor: 'pointer',
                }}>
                  <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📁</p>
                  <p style={{ color: '#667eea', fontWeight: '600', margin: '0 0 8px' }}>
                    {file ? file.name : 'Click to select file'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="fileInput"
                  />
                  <label
                    htmlFor="fileInput"
                    style={{
                      padding: '8px 20px',
                      background: '#667eea',
                      color: '#fff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    Browse File
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading
                    ? '#ccc'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Analyzing with AI...' : '🤖 Screen Resume'}
              </button>
            </form>

            {/* Result */}
            {result && (
              <div style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, #f0fff4, #e6fffa)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #c6f6d5',
              }}>
                <h4 style={{ margin: '0 0 16px', color: '#276749', fontSize: '15px' }}>
                  ✅ Resume Analyzed Successfully!
                </h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>👤 Name</span>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>
                      {result.full_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>📧 Email</span>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>
                      {result.email}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>🎓 Education</span>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>
                      {result.education}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>🎯 ATS Score</span>
                    <span style={{
                      padding: '4px 14px',
                      background: result.ats_score >= 70 ? '#c6f6d5' : '#fed7d7',
                      color: result.ats_score >= 70 ? '#276749' : '#c53030',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '14px',
                    }}>
                      {result.ats_score}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Candidates Ranking */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f', fontSize: '16px' }}>
              🏆 Candidate Rankings
            </h3>
            {candidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📊</p>
                <p>Select a job to see candidate rankings</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {candidates.map((c, i) => (
                  <div key={c.id} style={{
                    padding: '16px',
                    background: i === 0 ? '#fffbeb' : '#f7f8fc',
                    borderRadius: '12px',
                    border: i === 0 ? '1px solid #f6e05e' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: i === 0
                        ? 'linear-gradient(135deg, #f6d365, #fda085)'
                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '13px',
                      flexShrink: 0,
                    }}>
                      {i === 0 ? '🥇' : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#1e3a5f' }}>
                        {c.full_name}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                        {c.experience_years} yrs exp • {c.education}
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      background: c.ats_score >= 70 ? '#c6f6d5' : '#fed7d7',
                      color: c.ats_score >= 70 ? '#276749' : '#c53030',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '13px',
                    }}>
                      {c.ats_score}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;