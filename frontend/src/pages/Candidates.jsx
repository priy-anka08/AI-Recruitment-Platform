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

  // ADDED: Search & Modal States (Priority 1 & 3)
  const [searchTerm, setSearchTerm] = useState('');
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
    } catch (err) {
      console.error(err);
    }
  };

  // ADDED: Resume Download Action (Priority 4)
  const handleDownloadResume = (e, candidate) => {
    e.stopPropagation();
    if (candidate.resume_url || candidate.resume) {
      const link = document.createElement('a');
      link.href = candidate.resume_url || candidate.resume;
      link.target = '_blank';
      link.download = `${candidate.full_name || 'Candidate'}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Resume file not available for this candidate.');
    }
  };

  // ADDED: Analytics Metrics Calculations (Priority 2)
  const totalCount = candidates.length;
  const avgAtsScore = totalCount > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + (c.ats_score || 0), 0) / totalCount) 
    : 0;
  const shortlistedCount = candidates.filter(c => (c.ats_score || 0) >= 70).length;
  const screenedCount = candidates.filter(c => c.status === 'screened').length;

  // UPDATED: Combined Filter + Search Logic (Priority 1)
  const filtered = candidates.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      (c.full_name && c.full_name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.skills && c.skills.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

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

        {/* ADDED: Priority 2 - Analytics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Total Candidates</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '700', color: '#1e3a5f' }}>{totalCount}</h2>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Avg ATS Score</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '700', color: '#48bb78' }}>{avgAtsScore}%</h2>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Top Matched (70%+)</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '700', color: '#667eea' }}>{shortlistedCount}</h2>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Screened</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '700', color: '#805ad5' }}>{screenedCount}</h2>
          </div>
        </div>

        {/* Filter Tabs & ADDED: Priority 1 - Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                background: filter === 'all' ? '#667eea' : '#fff',
                color: filter === 'all' ? '#fff' : '#666',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              All ({candidates.length})
            </button>
            {allStatuses.map(status => {
              const count = candidates.filter(c => c.status === status).length;
              if (count === 0) return null;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={{
                    padding: '8px 16px',
                    background: filter === status ? statusColors[status]?.color : '#fff',
                    color: filter === status ? '#fff' : '#666',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  {status.replace('_', ' ')} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <input
              type="text"
              placeholder="🔍 Search candidate, skills, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #cbd5e0',
                borderRadius: '20px',
                fontSize: '13px',
                outline: 'none',
                background: '#fff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}
            />
          </div>
        </div>

        {/* Candidates Table */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading candidates...</p>
        ) : filtered.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>👥</p>
            <h3 style={{ color: '#1e3a5f' }}>No candidates found</h3>
          </div>
        ) : (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8fc', borderBottom: '2px solid #e2e8f0' }}>
                  {/* Added Resume column in Header */}
                  {['Candidate', 'Skills', 'Experience', 'ATS Score', 'Status', 'Action', 'Resume'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px',
                      textAlign: h === 'Resume' ? 'center' : 'left',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#1e3a5f',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate, i) => (
                  <tr 
                    key={candidate.id} 
                    onClick={() => setSelectedCandidate(candidate)} // Priority 3: Row Click for Detail Modal
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: '14px',
                        }}>
                          {candidate.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1e3a5f' }}>
                            {candidate.full_name}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                            {candidate.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#666',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {candidate.skills}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#333' }}>
                      {candidate.experience_years} yrs
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px',
                          height: '6px',
                          background: '#e2e8f0',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${candidate.ats_score}%`,
                            height: '100%',
                            background: candidate.ats_score >= 70
                              ? '#48bb78'
                              : candidate.ats_score >= 50
                              ? '#ed8936'
                              : '#f56565',
                            borderRadius: '3px',
                          }} />
                        </div>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: candidate.ats_score >= 70
                            ? '#48bb78'
                            : candidate.ats_score >= 50
                            ? '#ed8936'
                            : '#f56565',
                        }}>
                          {candidate.ats_score}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: statusColors[candidate.status]?.bg || '#f0f0f0',
                        color: statusColors[candidate.status]?.color || '#666',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {candidate.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={candidate.status}
                        onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        {allStatuses.map(s => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* ADDED: Priority 4 - Resume Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDownloadResume(e, candidate)}
                        style={{
                          padding: '6px 12px',
                          background: '#ebf8ff',
                          color: '#3182ce',
                          border: '1px solid #bee3f8',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        📥 Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ADDED: Priority 3 - Candidate Detail Modal */}
        {selectedCandidate && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '500px',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button 
                onClick={() => setSelectedCandidate(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✖
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '20px'
                }}>
                  {selectedCandidate.full_name?.charAt(0)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#1e3a5f' }}>{selectedCandidate.full_name}</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{selectedCandidate.email}</p>
                </div>
              </div>

              <div style={{ background: '#f7f8fc', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px' }}><strong>Status:</strong> {selectedCandidate.status?.replace('_', ' ')}</p>
                <p style={{ margin: '0 0 8px', fontSize: '13px' }}><strong>Experience:</strong> {selectedCandidate.experience_years} Years</p>
                <p style={{ margin: '0 0 8px', fontSize: '13px' }}><strong>ATS Score:</strong> {selectedCandidate.ats_score}%</p>
                <p style={{ margin: 0, fontSize: '13px' }}><strong>Skills:</strong> {selectedCandidate.skills}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  style={{
                    padding: '8px 16px',
                    background: '#e2e8f0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={(e) => handleDownloadResume(e, selectedCandidate)}
                  style={{
                    padding: '8px 16px',
                    background: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  📄 Download Resume
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Candidates;