import { useState, useEffect, useRef } from 'react';
import { getJobs, getAllCandidates } from '../services/api';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const VoiceScreening = () => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [listeningIndex, setListeningIndex] = useState(null);
  const recognitionRef = useRef(null);

  const [info, setInfo] = useState({
    current_company: '',
    total_experience: '',
    relevant_experience: '',
    current_salary: '',
    expected_salary: '',
    notice_period: '',
    preferred_location: '',
  });

  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobRes, canRes] = await Promise.all([getJobs(), getAllCandidates()]);
      setJobs(jobRes.data);
      setCandidates(canRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedJob || !selectedCandidate) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://ai-recruitment-platform-backend-uukb.onrender.com/voice/questions/${selectedJob}`);
      setQuestions(res.data.questions);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartListening = (questionIndex) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome and type your answer.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognitionRef.current = recognition;
    setIsListening(true);
    setListeningIndex(questionIndex);

    let finalText = '';

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      const currentText = (finalText + interimText).trim();
      setAnswers(prev => ({
        ...prev,
        [questions[questionIndex].question]: currentText
      }));
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
      setListeningIndex(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningIndex(null);
    };

    recognition.start();
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setListeningIndex(null);
  };

  const handleEvaluate = async () => {
    setLoading(true);
    const selectedJobData = jobs.find(j => j.id === selectedJob);
    try {
      const res = await axios.post(
        `https://ai-recruitment-platform-backend-uukb.onrender.com/voice/evaluate/${selectedCandidate}`,
        {
          answers,
          info,
          job_title: selectedJobData?.title || '',
        }
      );
      setResult(res.data);
      setStep(4);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#48bb78';
    if (score >= 50) return '#ed8936';
    return '#f56565';
  };

  const getRecommendationColor = (rec) => {
    if (rec === 'Proceed') return { bg: '#f0fdf4', color: '#166534', border: '#86efac' };
    if (rec === 'Hold') return { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' };
    return { bg: '#fff5f5', color: '#c53030', border: '#fed7d7' };
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '2px solid #e2e8f0', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', marginBottom: '6px',
    fontSize: '13px', fontWeight: '600', color: '#333',
  };

  const selectedCandidateData = candidates.find(c => c.id === selectedCandidate);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
            🎙️ AI Voice Screening
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            AI-powered candidate screening with voice recognition and evaluation
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {['Select Candidate', 'Candidate Info', 'Interview Questions', 'AI Evaluation'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step > i + 1 ? '#48bb78' : step === i + 1 ? '#667eea' : '#e2e8f0',
                color: step >= i + 1 ? '#fff' : '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '700', flexShrink: 0,
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: step === i + 1 ? '#667eea' : '#999' }}>
                {s}
              </span>
              {i < 3 && <span style={{ color: '#e2e8f0', fontSize: '18px' }}>→</span>}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>Select Candidate & Job</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Select Candidate</label>
                <select style={inputStyle} value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}>
                  <option value="">-- Select Candidate --</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Select Job Position</label>
                <select style={inputStyle} value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}>
                  <option value="">-- Select Job --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCandidateData && (
              <div style={{ background: '#f0f4ff', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', color: '#1e3a5f' }}>👤 Candidate Preview</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}><strong>Name:</strong> {selectedCandidateData.full_name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}><strong>Email:</strong> {selectedCandidateData.email}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}><strong>Experience:</strong> {selectedCandidateData.experience_years} years</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}><strong>ATS Score:</strong> {selectedCandidateData.ats_score}%</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666', gridColumn: '1/-1' }}>
                    <strong>Skills:</strong> {selectedCandidateData.skills?.split(',').slice(0, 5).join(', ')}
                  </p>
                </div>
              </div>
            )}

            <button onClick={handleGenerateQuestions}
              disabled={!selectedJob || !selectedCandidate || loading}
              style={{
                padding: '12px 32px',
                background: !selectedJob || !selectedCandidate ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '15px', fontWeight: '600',
                cursor: !selectedJob || !selectedCandidate ? 'not-allowed' : 'pointer',
              }}>
              {loading ? '⏳ Generating...' : '🤖 Generate AI Questions →'}
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#1e3a5f' }}>📋 Candidate Information</h3>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: '14px' }}>
              Fill in the candidate's professional details before starting the interview.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { key: 'current_company', label: 'Current Company', placeholder: 'e.g. TCS, Infosys' },
                { key: 'total_experience', label: 'Total Experience', placeholder: 'e.g. 3 years' },
                { key: 'relevant_experience', label: 'Relevant Experience', placeholder: 'e.g. 2 years in React' },
                { key: 'current_salary', label: 'Current Salary (LPA)', placeholder: 'e.g. 5 LPA' },
                { key: 'expected_salary', label: 'Expected Salary (LPA)', placeholder: 'e.g. 8 LPA' },
                { key: 'notice_period', label: 'Notice Period', placeholder: 'e.g. 30 days' },
                { key: 'preferred_location', label: 'Preferred Location', placeholder: 'e.g. Bangalore, Remote' },
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input style={inputStyle} placeholder={field.placeholder}
                    value={info[field.key]}
                    onChange={(e) => setInfo({ ...info, [field.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(1)} style={{
                padding: '12px 24px', background: '#f1f5f9',
                border: '1px solid #e2e8f0', borderRadius: '10px',
                color: '#666', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>← Back</button>
              <button onClick={() => setStep(3)} style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}>Start Interview →</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e3a5f' }}>🎙️ Interview Questions</h3>
              <span style={{
                padding: '4px 12px', background: '#667eea20', color: '#667eea',
                borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              }}>
                {Object.keys(answers).length}/{questions.length} Answered
              </span>
            </div>

            {/* Global listening indicator */}
            {isListening && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fed7d7',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: '#c53030', fontWeight: '600', fontSize: '14px' }}>
                  🔴 Listening... speak your answer clearly
                </span>
                <button onClick={handleStopListening} style={{
                  padding: '6px 16px', background: '#f56565',
                  border: 'none', borderRadius: '8px', color: '#fff',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                }}>
                  ⏹️ Stop Recording
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              {questions.map((q, i) => (
                <div key={i} style={{
                  background: '#f7f8fc', borderRadius: '12px', padding: '16px',
                  border: listeningIndex === i ? '2px solid #f56565' : answers[q.question] ? '1px solid #86efac' : '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                      background: q.category === 'technical' ? '#e9d8fd' : q.category === 'behavioral' ? '#feebc8' : '#bee3f8',
                      color: q.category === 'technical' ? '#805ad5' : q.category === 'behavioral' ? '#c05621' : '#2b6cb0',
                    }}>
                      {q.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>Q{i + 1}</span>
                    {listeningIndex === i && (
                      <span style={{ fontSize: '12px', color: '#f56565', fontWeight: '600' }}>
                        🔴 Recording...
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 10px', fontWeight: '600', color: '#1e3a5f', fontSize: '14px' }}>
                    {q.question}
                  </p>

                  <textarea
                    style={{
                      ...inputStyle, height: '80px', resize: 'vertical',
                      background: '#fff', marginBottom: '8px',
                      border: listeningIndex === i ? '2px solid #f56565' : '2px solid #e2e8f0',
                    }}
                    placeholder="Type answer or click 🎤 to speak..."
                    value={answers[q.question] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.question]: e.target.value }))}
                  />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {listeningIndex === i ? (
                      <button onClick={handleStopListening} style={{
                        padding: '6px 16px', background: '#f56565',
                        border: 'none', borderRadius: '8px', color: '#fff',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      }}>
                        ⏹️ Stop Recording
                      </button>
                    ) : (
                      <button onClick={() => handleStartListening(i)}
                        disabled={isListening}
                        style={{
                          padding: '6px 16px',
                          background: isListening ? '#ccc' : '#667eea',
                          border: 'none', borderRadius: '8px', color: '#fff',
                          fontSize: '12px', fontWeight: '600',
                          cursor: isListening ? 'not-allowed' : 'pointer',
                        }}>
                        🎤 Voice Answer
                      </button>
                    )}
                    {answers[q.question] && (
                      <span style={{ fontSize: '12px', color: '#48bb78', fontWeight: '600' }}>✅ Answered</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(2)} style={{
                padding: '12px 24px', background: '#f1f5f9',
                border: '1px solid #e2e8f0', borderRadius: '10px',
                color: '#666', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>← Back</button>
              <button onClick={handleEvaluate}
                disabled={loading || Object.keys(answers).length === 0}
                style={{
                  padding: '12px 32px',
                  background: Object.keys(answers).length === 0 ? '#ccc' : 'linear-gradient(135deg, #48bb78, #38a169)',
                  border: 'none', borderRadius: '10px', color: '#fff',
                  fontSize: '15px', fontWeight: '600',
                  cursor: Object.keys(answers).length === 0 ? 'not-allowed' : 'pointer',
                }}>
                {loading ? '⏳ Evaluating...' : '🤖 Get AI Evaluation →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && result && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a5f, #2c5364)',
              borderRadius: '16px', padding: '28px', marginBottom: '24px', color: '#fff',
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>
                🎯 AI Evaluation Complete — {result.candidate_name}
              </h3>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
                {result.job_title} • {new Date(result.screening_date).toLocaleString()}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Communication', score: result.evaluation.communication_score, icon: '💬' },
                { label: 'Confidence', score: result.evaluation.confidence_score, icon: '💪' },
                { label: 'Technical', score: result.evaluation.technical_score, icon: '⚙️' },
                { label: 'Overall', score: result.evaluation.overall_score, icon: '🎯' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: '16px', padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)', textAlign: 'center',
                }}>
                  <p style={{ fontSize: '24px', margin: '0 0 8px' }}>{item.icon}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>{item.label}</p>
                  <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: getScoreColor(item.score) }}>
                    {item.score}
                  </h3>
                  <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px' }}>
                    <div style={{
                      width: `${item.score}%`, height: '100%',
                      background: getScoreColor(item.score), borderRadius: '2px',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: getRecommendationColor(result.evaluation.recommendation).bg,
              border: `1px solid ${getRecommendationColor(result.evaluation.recommendation).border}`,
              borderRadius: '12px', padding: '20px', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <span style={{ fontSize: '32px' }}>
                {result.evaluation.recommendation === 'Proceed' ? '✅' :
                  result.evaluation.recommendation === 'Hold' ? '⏸️' : '❌'}
              </span>
              <div>
                <h4 style={{ margin: '0 0 4px', color: getRecommendationColor(result.evaluation.recommendation).color, fontSize: '18px' }}>
                  Recommendation: {result.evaluation.recommendation}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: getRecommendationColor(result.evaluation.recommendation).color }}>
                  {result.evaluation.feedback}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {result.evaluation.strengths && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#166534' }}>💪 Strengths</h4>
                  {result.evaluation.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#333' }}>
                      <span style={{ color: '#48bb78' }}>✓</span> {s}
                    </div>
                  ))}
                </div>
              )}
              {result.evaluation.improvements && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#c05621' }}>📈 Areas to Improve</h4>
                  {result.evaluation.improvements.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#333' }}>
                      <span style={{ color: '#ed8936' }}>→</span> {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px', color: '#1e3a5f' }}>📋 Collected Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {Object.entries(result.info).map(([key, value]) => value && (
                  <div key={key} style={{ fontSize: '13px' }}>
                    <span style={{ color: '#666', textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</span>
                    <span style={{ fontWeight: '600', color: '#1e3a5f', marginLeft: '4px' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => {
              setStep(1); setResult(null); setAnswers({});
              setInfo({ current_company: '', total_experience: '', relevant_experience: '', current_salary: '', expected_salary: '', notice_period: '', preferred_location: '' });
              setSelectedJob(''); setSelectedCandidate(''); setQuestions([]);
            }} style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}>
              🔄 Screen Another Candidate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceScreening;