import { useState, useEffect } from 'react';
import { getJobs, createJob, deleteJob } from '../services/api';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

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
        await axios.put(`http://127.0.0.1:8000/jobs/${editingJob.id}`, formData, {
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
      await axios.patch(`http://127.0.0.1:8000/jobs/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
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
      </div>
    </div>
  );
};

export default Jobs;