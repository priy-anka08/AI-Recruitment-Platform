import { useState, useEffect } from 'react';
import { getInterviews, scheduleInterview, getJobs, getAllCandidates } from '../services/api';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const MEETING_PLATFORMS = {
  zoom: {
    label: '🎥 Zoom',
    color: '#2D8CFF',
    generateLink: () => `https://zoom.us/j/${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    icon: '🎥',
  },
  meet: {
    label: '📹 Google Meet',
    color: '#34A853',
    generateLink: () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const seg = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `https://meet.google.com/${seg()}-${seg()}-${seg()}`;
    },
    icon: '📹',
  },
  teams: {
    label: '💼 Microsoft Teams',
    color: '#6264A7',
    generateLink: () => `https://teams.microsoft.com/l/meetup-join/b2world/${Date.now()}`,
    icon: '💼',
  },
};

const Interviews = () => {
  const { token } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSendSlots, setShowSendSlots] = useState(false);
  const [sendingSlotsLoading, setSendingSlotsLoading] = useState(false);
  const [sendSlotsSuccess, setSendSlotsSuccess] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('zoom');
  const [formData, setFormData] = useState({
    candidate_id: '',
    job_id: '',
    scheduled_time: '',
    interview_type: 'technical',
    duration_minutes: '60',
    meeting_link: '',
    notes: '',
  });
  const [sendSlotsData, setSendSlotsData] = useState({
    candidate_id: '',
    date: '',
    duration_minutes: '60',
    interview_type: 'technical',
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

  const fetchSlots = async (date, duration) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await axios.get(
        `https://ai-recruitment-platform-backend-uukb.onrender.com/interviews/slots?date=${date}&duration_minutes=${duration}`
      );
      setSlots(res.data.slots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setFormData({ ...formData, scheduled_time: '' });
    fetchSlots(date, formData.duration_minutes);
  };

  const handleDurationChange = (duration) => {
    setFormData({ ...formData, duration_minutes: duration, scheduled_time: '' });
    if (selectedDate) fetchSlots(selectedDate, duration);
  };

  const handleSlotSelect = (slot) => {
    setFormData({ ...formData, scheduled_time: slot.start });
  };

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    const link = MEETING_PLATFORMS[platform].generateLink();
    setFormData({ ...formData, meeting_link: link });
  };

  const handleGenerateLink = () => {
    const link = MEETING_PLATFORMS[selectedPlatform].generateLink();
    setFormData({ ...formData, meeting_link: link });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await scheduleInterview(formData);
      setShowForm(false);
      setSlots([]);
      setSelectedDate('');
      setSelectedPlatform('zoom');
      setFormData({
        candidate_id: '', job_id: '', scheduled_time: '',
        interview_type: 'technical', duration_minutes: '60',
        meeting_link: '', notes: '',
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendSlots = async (e) => {
    e.preventDefault();
    setSendingSlotsLoading(true);
    setSendSlotsSuccess('');
    try {
      await axios.post(
        `https://ai-recruitment-platform-backend-uukb.onrender.com/interviews/send-slots/${sendSlotsData.candidate_id}?date=${sendSlotsData.date}&duration_minutes=${sendSlotsData.duration_minutes}&interview_type=${sendSlotsData.interview_type}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSendSlotsSuccess('✅ Slot selection email sent to candidate!');
      setTimeout(() => {
        setSendSlotsSuccess('');
        setShowSendSlots(false);
        setSendSlotsData({ candidate_id: '', date: '', duration_minutes: '60', interview_type: 'technical' });
      }, 3000);
    } catch (err) {
      setSendSlotsSuccess('❌ Failed to send email. Try again.');
    } finally {
      setSendingSlotsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`https://ai-recruitment-platform-backend-uukb.onrender.com/interviews/${id}/status?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this interview?')) return;
    try {
      await axios.delete(`https://ai-recruitment-platform-backend-uukb.onrender.com/interviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const getCandidateName = (id) => {
    const c = candidates.find(c => c.id === id);
    return c ? c.full_name : 'Unknown';
  };

  const getJobTitle = (id) => {
    const j = jobs.find(j => j.id === id);
    return j ? j.title : 'Unknown';
  };

  const getMeetingPlatform = (link) => {
    if (!link) return null;
    if (link.includes('zoom.us')) return { icon: '🎥', label: 'Zoom', color: '#2D8CFF' };
    if (link.includes('meet.google')) return { icon: '📹', label: 'Google Meet', color: '#34A853' };
    if (link.includes('teams.microsoft')) return { icon: '💼', label: 'Teams', color: '#6264A7' };
    return { icon: '🔗', label: 'Meeting', color: '#667eea' };
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
    width: '100%', padding: '10px 14px',
    border: '2px solid #e2e8f0', borderRadius: '8px',
    fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', background: '#fff',
  };

  const labelStyle = {
    display: 'block', marginBottom: '6px',
    fontSize: '13px', fontWeight: '600', color: '#333',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
              📅 Interview Scheduling
            </h1>
            <p style={{ color: '#666', margin: 0 }}>Schedule and manage candidate interviews</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setShowSendSlots(!showSendSlots); setShowForm(false); }}
              style={{
                padding: '12px 24px',
                background: showSendSlots ? '#f7f8fc' : 'linear-gradient(135deg, #48bb78, #38a169)',
                border: '1px solid #e2e8f0', borderRadius: '10px',
                color: showSendSlots ? '#666' : '#fff',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              {showSendSlots ? '✕ Cancel' : '📨 Send Slots to Candidate'}
            </button>
            <button
              onClick={() => { setShowForm(!showForm); setShowSendSlots(false); }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              {showForm ? 'Cancel' : '+ Schedule Interview'}
            </button>
          </div>
        </div>

        {/* Send Slots Form */}
        {showSendSlots && (
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px', marginBottom: '28px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            border: '2px solid #48bb7840',
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>📨 Send Slot Selection Email to Candidate</h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 20px' }}>
              Candidate ko email bheja jayega jisme wo apna preferred interview slot select kar sakta hai.
            </p>
            {sendSlotsSuccess && (
              <div style={{
                padding: '12px', borderRadius: '8px', marginBottom: '16px',
                background: sendSlotsSuccess.includes('✅') ? '#f0fdf4' : '#fff5f5',
                border: `1px solid ${sendSlotsSuccess.includes('✅') ? '#86efac' : '#fed7d7'}`,
                color: sendSlotsSuccess.includes('✅') ? '#166534' : '#c53030',
                fontSize: '14px', fontWeight: '600',
              }}>
                {sendSlotsSuccess}
              </div>
            )}
            <form onSubmit={handleSendSlots}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Select Candidate</label>
                  <select style={inputStyle} value={sendSlotsData.candidate_id}
                    onChange={(e) => setSendSlotsData({ ...sendSlotsData, candidate_id: e.target.value })} required>
                    <option value="">-- Select Candidate --</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Interview Date</label>
                  <input style={inputStyle} type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={sendSlotsData.date}
                    onChange={(e) => setSendSlotsData({ ...sendSlotsData, date: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Interview Type</label>
                  <select style={inputStyle} value={sendSlotsData.interview_type}
                    onChange={(e) => setSendSlotsData({ ...sendSlotsData, interview_type: e.target.value })}>
                    <option value="technical">Technical Round</option>
                    <option value="hr">HR Round</option>
                    <option value="final">Final Round</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Slot Duration</label>
                  <select style={inputStyle} value={sendSlotsData.duration_minutes}
                    onChange={(e) => setSendSlotsData({ ...sendSlotsData, duration_minutes: e.target.value })}>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={sendingSlotsLoading} style={{
                marginTop: '20px', padding: '12px 32px',
                background: sendingSlotsLoading ? '#ccc' : 'linear-gradient(135deg, #48bb78, #38a169)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '15px', fontWeight: '600',
                cursor: sendingSlotsLoading ? 'not-allowed' : 'pointer',
              }}>
                {sendingSlotsLoading ? '⏳ Sending...' : '📨 Send Slot Selection Email'}
              </button>
            </form>
          </div>
        )}

        {/* Schedule Interview Form */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px', marginBottom: '28px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>Schedule New Interview</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Select Candidate</label>
                  <select style={inputStyle} value={formData.candidate_id}
                    onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value })} required>
                    <option value="">-- Select Candidate --</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Select Job</label>
                  <select style={inputStyle} value={formData.job_id}
                    onChange={(e) => setFormData({ ...formData, job_id: e.target.value })} required>
                    <option value="">-- Select Job --</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Interview Type</label>
                  <select style={inputStyle} value={formData.interview_type}
                    onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}>
                    <option value="technical">Technical Round</option>
                    <option value="hr">HR Round</option>
                    <option value="final">Final Round</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <select style={inputStyle} value={formData.duration_minutes}
                    onChange={(e) => handleDurationChange(e.target.value)}>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Select Date for Auto Slots</label>
                  <input style={inputStyle} type="date" value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)} />
                </div>

                {selectedDate && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>
                      Available Slots {loadingSlots ? '(Loading...)' : `(${slots.length} slots)`}
                    </label>
                    {loadingSlots ? (
                      <p style={{ color: '#666', fontSize: '14px' }}>⏳ Generating slots...</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {slots.map((slot, i) => (
                          <button key={i} type="button" onClick={() => handleSlotSelect(slot)}
                            style={{
                              padding: '8px 16px', borderRadius: '8px',
                              border: formData.scheduled_time === slot.start ? '2px solid #667eea' : '2px solid #e2e8f0',
                              background: formData.scheduled_time === slot.start ? '#667eea' : '#fff',
                              color: formData.scheduled_time === slot.start ? '#fff' : '#333',
                              cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            }}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {formData.scheduled_time && (
                      <p style={{ marginTop: '8px', fontSize: '13px', color: '#667eea', fontWeight: '600' }}>
                        ✅ Selected: {new Date(formData.scheduled_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Meeting Platform Selection */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Meeting Platform</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    {Object.entries(MEETING_PLATFORMS).map(([key, platform]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePlatformChange(key)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: selectedPlatform === key ? `2px solid ${platform.color}` : '2px solid #e2e8f0',
                          background: selectedPlatform === key ? `${platform.color}15` : '#fff',
                          color: selectedPlatform === key ? platform.color : '#666',
                          cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                        }}
                      >
                        {platform.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      type="text"
                      placeholder="Meeting link (auto-generated or custom)"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateLink}
                      style={{
                        padding: '10px 16px', whiteSpace: 'nowrap',
                        background: MEETING_PLATFORMS[selectedPlatform].color,
                        border: 'none', borderRadius: '8px', color: '#fff',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      🔄 Generate Link
                    </button>
                  </div>
                  {formData.meeting_link && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#48bb78', fontWeight: '600' }}>
                      ✅ {MEETING_PLATFORMS[selectedPlatform]?.label || 'Meeting'} link ready
                    </p>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                    placeholder="Any special instructions..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>

              <button type="submit" disabled={!formData.scheduled_time} style={{
                marginTop: '20px', padding: '12px 32px',
                background: !formData.scheduled_time ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '15px', fontWeight: '600',
                cursor: !formData.scheduled_time ? 'not-allowed' : 'pointer',
              }}>
                📅 Schedule Interview
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : interviews.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '60px',
            textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📅</p>
            <h3 style={{ color: '#1e3a5f' }}>No interviews scheduled yet</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {interviews.map((interview) => {
              const platform = getMeetingPlatform(interview.meeting_link);
              return (
                <div key={interview.id} style={{
                  background: '#fff', borderRadius: '16px',
                  padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  border: `1px solid ${interview.status === 'cancelled' ? '#fed7d7' : '#f0f0f0'}`,
                  opacity: interview.status === 'cancelled' ? 0.7 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: '#667eea20', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                      }}>
                        📅
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '3px 10px',
                            background: typeColors[interview.interview_type]?.bg || '#f0f0f0',
                            color: typeColors[interview.interview_type]?.color || '#666',
                            borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                          }}>
                            {interview.interview_type} round
                          </span>
                          <span style={{
                            padding: '3px 10px',
                            background: statusColors[interview.status]?.bg || '#f0f0f0',
                            color: statusColors[interview.status]?.color || '#666',
                            borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                          }}>
                            {interview.status}
                          </span>
                          {platform && (
                            <span style={{
                              padding: '3px 10px',
                              background: `${platform.color}15`,
                              color: platform.color,
                              borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                            }}>
                              {platform.icon} {platform.label}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#1e3a5f', fontSize: '15px' }}>
                          👤 {getCandidateName(interview.candidate_id)}
                        </p>
                        <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>
                          💼 {getJobTitle(interview.job_id)}
                        </p>
                        <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#333', fontSize: '13px' }}>
                          🕐 {new Date(interview.scheduled_time).toLocaleString()}
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                          ⏱️ Duration: {interview.duration_minutes} mins
                          {interview.meeting_link && (
                            <a href={interview.meeting_link} target="_blank" rel="noreferrer"
                              style={{
                                marginLeft: '12px', fontWeight: '600',
                                color: platform?.color || '#667eea',
                              }}>
                              {platform?.icon || '🔗'} Join {platform?.label || 'Meeting'}
                            </a>
                          )}
                        </p>
                        {interview.notes && (
                          <p style={{ margin: '6px 0 0', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>
                            📝 {interview.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {interview.status !== 'cancelled' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {interview.status === 'scheduled' && (
                          <button onClick={() => handleStatusUpdate(interview.id, 'completed')}
                            style={{
                              padding: '8px 16px', background: '#f0fdf4',
                              border: '1px solid #86efac', borderRadius: '8px',
                              color: '#166534', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            }}>
                            ✅ Mark Complete
                          </button>
                        )}
                        <button onClick={() => handleCancel(interview.id)}
                          style={{
                            padding: '8px 16px', background: '#fff5f5',
                            border: '1px solid #fed7d7', borderRadius: '8px',
                            color: '#f56565', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                          }}>
                          ❌ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;