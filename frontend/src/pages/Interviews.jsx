import { useState, useEffect } from 'react';
import { getInterviews, scheduleInterview, getJobs, getAllCandidates } from '../services/api';
import Sidebar from '../components/Sidebar';

const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    candidate_id: '',
    job_id: '',
    scheduled_time: '',
    interview_type: 'technical',
    duration_minutes: '60',
    meeting_link: '',
    notes: '',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [intRes, jobRes, canRes] = await Promise.all([
        getInterviews(), getJobs(), getAllCandidates(),
      ]);
      setInterviews(intRes.data);
      setJobs(jobRes.data);
      setCandidates(canRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await scheduleInterview(formData);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    scheduled: { bg: '#ebf8ff', color: '#3182ce' },
    completed: { bg: '#c6f6d5', color: '#276749' },
    cancelled: { bg: '#fed7d7', color: '#c53030' },
  };

  const typeColors = {
    technical: { bg: '#e9d8fd', color: '#805ad5' },
    hr: { bg: '#feebc8', color: '#c05621' },
    final: { bg: '#bee3f8', color: '#2b6cb0' },
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
              Interview Scheduling
            </h1>
            <p style={{ color: '#666', margin: 0 }}>Schedule and manage candidate interviews</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            {showForm ? 'Cancel' : '+ Schedule Interview'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', marginBottom: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>Schedule New Interview</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Select Candidate</label>
                  <select style={inputStyle} value={formData.candidate_id} onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value })} required>
                    <option value="">-- Select Candidate --</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} - {c.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Select Job</label>
                  <select style={inputStyle} value={formData.job_id} onChange={(e) => setFormData({ ...formData, job_id: e.target.value })} required>
                    <option value="">-- Select Job --</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date and Time</label>
                  <input style={inputStyle} type="datetime-local" value={formData.scheduled_time} onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Interview Type</label>
                  <select style={inputStyle} value={formData.interview_type} onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}>
                    <option value="technical">Technical Round</option>
                    <option value="hr">HR Round</option>
                    <option value="final">Final Round</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <select style={inputStyle} value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Meeting Link</label>
                  <input style={inputStyle} type="text" placeholder="https://meet.google.com/..." value={formData.meeting_link} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Any special instructions..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>
              <button type="submit" style={{ marginTop: '20px', padding: '12px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                Schedule Interview
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : interviews.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📅</p>
            <h3 style={{ color: '#1e3a5f' }}>No interviews scheduled yet</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {interviews.map((interview) => (
              <div key={interview.id} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#667eea20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    📅
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ padding: '3px 10px', background: typeColors[interview.interview_type]?.bg || '#f0f0f0', color: typeColors[interview.interview_type]?.color || '#666', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {interview.interview_type} round
                      </span>
                      <span style={{ padding: '3px 10px', background: statusColors[interview.status]?.bg || '#f0f0f0', color: statusColors[interview.status]?.color || '#666', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {interview.status}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#1e3a5f' }}>
                      {new Date(interview.scheduled_time).toLocaleString()}
                    </p>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                      Duration: {interview.duration_minutes} mins
                      {interview.meeting_link && (
                        <span style={{ marginLeft: '12px' }}>
                          <a href={interview.meeting_link} target="_blank" rel="noreferrer" style={{ color: '#667eea', fontWeight: '600' }}>
                            Join Meeting
                          </a>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;