import { useState, useEffect } from 'react';
import { getAllCandidates, updateCandidateStatus } from '../services/api';
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

const allStatuses = [
  'applied', 'under_review', 'screened', 'shortlisted',
  'interview_scheduled', 'technical_round', 'hr_round',
  'selected', 'rejected', 'joined'
];

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

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

  const filtered = candidates
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      search === '' ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.toLowerCase().includes(search.toLowerCase())
    );

  // Analytics
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
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
            👥 Candidates
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Manage and track all candidates — {candidates.length} total
          </p>
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