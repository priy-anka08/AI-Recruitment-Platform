import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const CandidateSlotSelection = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [slotData, setSlotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchSlots();
    else setError('Invalid link. Please contact HR.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`https://ai-recruitment-platform-backend-uukb.onrender.com/interviews/select-slot/${token}`);
      setSlotData(res.data);
    } catch (err) {
      setError('This link is invalid or has expired. Please contact HR.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setConfirming(true);
    try {
      await axios.post(
        `https://ai-recruitment-platform-backend-uukb.onrender.com/interviews/confirm-slot?token=${token}&selected_slot=${selectedSlot}`
      );
      setConfirmed(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', margin: '0 0 8px' }}>🤖</h1>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#1e3a5f' }}>
            B2World AI Recruitment
          </h2>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            Interview Slot Selection
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            ⏳ Loading available slots...
          </div>
        ) : error ? (
          <div style={{
            background: '#fff5f5', border: '1px solid #fed7d7',
            borderRadius: '12px', padding: '20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '32px', margin: '0 0 12px' }}>❌</p>
            <p style={{ color: '#c53030', fontWeight: '600' }}>{error}</p>
          </div>
        ) : confirmed ? (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '12px', padding: '32px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🎉</p>
            <h3 style={{ color: '#166534', margin: '0 0 8px' }}>Slot Confirmed!</h3>
            <p style={{ color: '#166534', fontSize: '14px' }}>
              Your interview has been scheduled. You will receive a confirmation email shortly.
            </p>
            <p style={{ color: '#166534', fontSize: '14px', marginTop: '8px' }}>
              Selected: <strong>{new Date(selectedSlot).toLocaleString()}</strong>
            </p>
          </div>
        ) : slotData && (
          <>
            <div style={{
              background: '#f0f4ff', borderRadius: '12px',
              padding: '16px', marginBottom: '24px',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#666' }}>Candidate</p>
              <p style={{ margin: '0 0 8px', fontWeight: '700', color: '#1e3a5f', fontSize: '16px' }}>
                👤 {slotData.candidate_name}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#666' }}>Interview Type</p>
              <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#667eea' }}>
                📋 {slotData.interview_type?.replace('_', ' ').toUpperCase()} Round
              </p>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#666' }}>Date</p>
              <p style={{ margin: 0, fontWeight: '600', color: '#1e3a5f' }}>
                📅 {slotData.date}
              </p>
            </div>

            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#1e3a5f' }}>
              Select Your Preferred Time Slot:
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {slotData.slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlot(slot.start)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: selectedSlot === slot.start
                      ? '2px solid #667eea'
                      : '2px solid #e2e8f0',
                    background: selectedSlot === slot.start
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : '#fff',
                    color: selectedSlot === slot.start ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                >
                  🕐 {slot.label}
                </button>
              ))}
            </div>

            {selectedSlot && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: '8px', padding: '12px', marginBottom: '20px',
                fontSize: '14px', color: '#166534', fontWeight: '600',
              }}>
                ✅ Selected: {new Date(selectedSlot).toLocaleString()}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!selectedSlot || confirming}
              style={{
                width: '100%', padding: '14px',
                background: !selectedSlot || confirming
                  ? '#ccc'
                  : 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '16px', fontWeight: '700',
                cursor: !selectedSlot || confirming ? 'not-allowed' : 'pointer',
              }}
            >
              {confirming ? '⏳ Confirming...' : '✅ Confirm My Slot'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#999' }}>
              ⚠️ This link expires in 48 hours
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CandidateSlotSelection;