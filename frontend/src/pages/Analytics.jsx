import { useState, useEffect } from 'react';
import { getRecruitmentAnalytics, getPipeline, getProjectAnalytics } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea', '#38b2ac', '#ecc94b', '#fc8181', '#68d391', '#76e4f7'];

const Analytics = () => {
  const [recruitment, setRecruitment] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [recRes, pipeRes, projRes] = await Promise.all([
        getRecruitmentAnalytics(),
        getPipeline(),
        getProjectAnalytics(),
      ]);
      setRecruitment(recRes.data);
      setPipeline(pipeRes.data);
      setProjectStats(projRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pipelineData = pipeline
    ? Object.entries(pipeline)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: key.replace(/_/g, ' '),
          count: value,
        }))
    : [];

  const recruitmentCards = recruitment ? [
    { label: 'Total Jobs', value: recruitment.total_jobs, icon: '💼', color: '#667eea' },
    { label: 'Total Candidates', value: recruitment.total_candidates, icon: '👥', color: '#48bb78' },
    { label: 'Selected', value: recruitment.selected, icon: '✅', color: '#38b2ac' },
    { label: 'Rejected', value: recruitment.rejected, icon: '❌', color: '#f56565' },
    { label: 'Avg ATS Score', value: `${recruitment.average_ats_score}%`, icon: '🎯', color: '#ed8936' },
    { label: 'Success Rate', value: `${recruitment.hiring_success_rate}%`, icon: '🚀', color: '#9f7aea' },
  ] : [];

  const projectCards = projectStats ? [
    { label: 'Total Projects', value: projectStats.total_projects, icon: '📋', color: '#667eea' },
    { label: 'Active Projects', value: projectStats.active_projects, icon: '🔥', color: '#ed8936' },
    { label: 'Total Tasks', value: projectStats.total_tasks, icon: '📝', color: '#48bb78' },
    { label: 'Completed Tasks', value: projectStats.completed_tasks, icon: '✅', color: '#38b2ac' },
    { label: 'Completion Rate', value: `${projectStats.task_completion_rate}%`, icon: '📊', color: '#9f7aea' },
    { label: 'Total Sprints', value: projectStats.total_sprints, icon: '⚡', color: '#f56565' },
  ] : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
            📊 Analytics & Reports
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Complete overview of recruitment and project performance
          </p>
        </div>

        {loading ? (
          <p style={{ color: '#666' }}>Loading analytics...</p>
        ) : (
          <>
            {/* Recruitment Section */}
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>
              🎯 Recruitment Analytics
            </h2>

            {/* Recruitment Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '28px',
            }}>
              {recruitmentCards.map((card, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  border: '1px solid #f0f0f0',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${card.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', color: '#666', fontSize: '12px' }}>{card.label}</p>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: card.color }}>
                      {card.value}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px',
            }}>
              {/* Pipeline Bar Chart */}
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
              }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  📈 Candidate Pipeline
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#667eea" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
              }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  🥧 Pipeline Distribution
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pipelineData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pipelineData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Section */}
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>
              📋 Project Analytics
            </h2>

            {/* Project Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '28px',
            }}>
              {projectCards.map((card, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  border: '1px solid #f0f0f0',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${card.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', color: '#666', fontSize: '12px' }}>{card.label}</p>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: card.color }}>
                      {card.value}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Task Completion Bar */}
            {projectStats && (
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  ✅ Task Completion Rate
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    flex: 1,
                    height: '12px',
                    background: '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${projectStats.task_completion_rate}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      borderRadius: '6px',
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <span style={{ fontWeight: '700', color: '#667eea', fontSize: '16px', minWidth: '50px' }}>
                    {projectStats.task_completion_rate}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {projectStats.completed_tasks} completed
                  </span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {projectStats.total_tasks} total tasks
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;