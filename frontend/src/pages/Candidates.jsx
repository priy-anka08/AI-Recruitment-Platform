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

  const filtered = filter === 'all'
    ? candidates
    : candidates.filter(c => c.status === filter);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
            👥 Candidates
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Manage and track all candidates — {candidates.length} total
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
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
                  {['Candidate', 'Skills', 'Experience', 'ATS Score', 'Status', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#1e3a5f',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate, i) => (
                  <tr key={candidate.id} style={{
                    borderBottom: '1px solid #f0f0f0',
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                  }}>
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
                    <td style={{ padding: '14px 16px' }}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Candidates;