import { useState, useEffect } from 'react';
import { getRecruitmentAnalytics, getPipeline, getProjectAnalytics } from '../services/api';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea', '#38b2ac', '#ecc94b', '#fc8181', '#68d391', '#76e4f7'];

const API_BASE = 'https://ai-recruitment-platform-backend-uukb.onrender.com';

const Analytics = () => {
  const [recruitment, setRecruitment] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // NEW: HR Dashboard + AI Insights state
  const [hrDashboard, setHrDashboard] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [recRes, pipeRes, projRes, hrRes, insightsRes] = await Promise.all([
        getRecruitmentAnalytics(),
        getPipeline(),
        getProjectAnalytics(),
        axios.get(`${API_BASE}/analytics/hr-dashboard`),
        axios.get(`${API_BASE}/analytics/insights`),
      ]);
      setRecruitment(recRes.data);
      setPipeline(pipeRes.data);
      setProjectStats(projRes.data);
      setHrDashboard(hrRes.data);
      setInsights(insightsRes.data);
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

  const taskBreakdownData = projectStats ? [
    { name: 'Todo', value: projectStats.todo_tasks, color: '#94a3b8' },
    { name: 'In Progress', value: projectStats.in_progress_tasks, color: '#3182ce' },
    { name: 'Done', value: projectStats.completed_tasks, color: '#48bb78' },
  ].filter(d => d.value > 0) : [];

  const sprintData = projectStats ? [
    { name: 'Planned', value: projectStats.total_sprints - projectStats.active_sprints - projectStats.completed_sprints, color: '#94a3b8' },
    { name: 'Active', value: projectStats.active_sprints, color: '#3182ce' },
    { name: 'Completed', value: projectStats.completed_sprints, color: '#48bb78' },
  ].filter(d => d.value > 0) : [];

  const recruitmentCards = recruitment ? [
    { label: 'Total Jobs', value: recruitment.total_jobs, icon: '💼', color: '#667eea' },
    { label: 'Total Candidates', value: recruitment.total_candidates, icon: '👥', color: '#48bb78' },
    { label: 'Shortlisted', value: recruitment.shortlisted, icon: '⭐', color: '#ed8936' },
    { label: 'Selected', value: recruitment.selected, icon: '✅', color: '#38b2ac' },
    { label: 'Rejected', value: recruitment.rejected, icon: '❌', color: '#f56565' },
    { label: 'Interviews', value: recruitment.interviews_scheduled, icon: '📅', color: '#9f7aea' },
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

  // NEW: HR Dashboard cards (Step 13 of spec)
  const hrDashboardCards = hrDashboard ? [
    { label: 'Total Applications', value: hrDashboard.total_applications, icon: '📥', color: '#667eea' },
    { label: 'AI Screened', value: hrDashboard.ai_screened, icon: '🤖', color: '#805ad5' },
    { label: 'ATS Qualified', value: hrDashboard.ats_qualified, icon: '🎯', color: '#38b2ac' },
    { label: 'Shortlisted', value: hrDashboard.shortlisted, icon: '⭐', color: '#ed8936' },
    { label: 'Interview Scheduled', value: hrDashboard.interview_scheduled, icon: '📅', color: '#9f7aea' },
    { label: 'Rejected', value: hrDashboard.rejected, icon: '❌', color: '#f56565' },
    { label: 'Offer Released', value: hrDashboard.offer_released, icon: '📨', color: '#48bb78' },
    { label: 'Offer Accepted', value: hrDashboard.offer_accepted, icon: '🎉', color: '#38a169' },
  ] : [];

  // NEW: experience distribution formatted for chart
  const expDistributionData = insights?.experience_distribution
    ? Object.entries(insights.experience_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const cardStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: '1px solid #f0f0f0',
  };

  const chartBoxStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

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
            {/* ── Recruitment Section ── */}
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>
              🎯 Recruitment Analytics
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {recruitmentCards.map((card, i) => (
                <div key={i} style={cardStyle}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `${card.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
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

            {/* NEW: HR Dashboard Section */}
            {hrDashboard && (
              <>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>
                  🗂️ HR Dashboard
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                  {hrDashboardCards.map((card, i) => (
                    <div key={i} style={cardStyle}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: `${card.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
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
              </>
            )}

            {/* Recruitment Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div style={chartBoxStyle}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  📈 Candidate Pipeline
                </h3>
                {pipelineData.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={pipelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#667eea" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div style={chartBoxStyle}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  🥧 Pipeline Distribution
                </h3>
                {pipelineData.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No data yet</p>
                ) : (
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
                )}
              </div>
            </div>

            {/* NEW: AI Insights Section (Step 14 of spec) */}
            {insights && (
              <>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>
                  🤖 AI Insights
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                  {/* Top Skills */}
                  <div style={chartBoxStyle}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                      🛠️ Most Common Skills
                    </h3>
                    {insights.top_skills?.length === 0 ? (
                      <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={insights.top_skills} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={90} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#48bb78" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Experience Distribution */}
                  <div style={chartBoxStyle}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                      🎓 Experience Distribution
                    </h3>
                    {expDistributionData.every(d => d.value === 0) ? (
                      <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={expDistributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                          >
                            {expDistributionData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Hiring Funnel */}
                <div style={{ ...chartBoxStyle, marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                    🔻 Hiring Funnel Conversion
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {insights.hiring_funnel?.map((stage, i) => {
                      const maxCount = insights.hiring_funnel[0]?.count || 1;
                      const widthPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ width: '100px', fontSize: '12px', color: '#666', fontWeight: '600' }}>
                            {stage.stage}
                          </span>
                          <div style={{ flex: 1, height: '28px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${widthPct}%`, height: '100%',
                              background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}cc)`,
                              borderRadius: '6px',
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                              paddingRight: '10px', boxSizing: 'border-box',
                              transition: 'width 0.4s ease',
                            }}>
                              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>
                                {stage.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Hiring Success Bar */}
            {recruitment && (
              <div style={{ ...chartBoxStyle, marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  🚀 Hiring Success Rate
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${recruitment.hiring_success_rate}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #48bb78, #38a169)',
                      borderRadius: '6px',
                    }} />
                  </div>
                  <span style={{ fontWeight: '700', color: '#48bb78', fontSize: '16px', minWidth: '50px' }}>
                    {recruitment.hiring_success_rate}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>{recruitment.selected} selected</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>{recruitment.total_candidates} total candidates</span>
                </div>
              </div>
            )}

            {/* ── Project Section ── */}
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', marginBottom: '16px' }}>
              📋 Project Analytics
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {projectCards.map((card, i) => (
                <div key={i} style={cardStyle}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `${card.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
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

            {/* Project Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
              <div style={chartBoxStyle}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  📝 Task Breakdown
                </h3>
                {taskBreakdownData.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No tasks yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={taskBreakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskBreakdownData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div style={chartBoxStyle}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  ⚡ Sprint Status
                </h3>
                {sprintData.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No sprints yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sprintData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {sprintData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Task Completion Bar */}
            {projectStats && (
              <div style={chartBoxStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e3a5f' }}>
                  ✅ Task Completion Rate
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${projectStats.task_completion_rate}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      borderRadius: '6px',
                    }} />
                  </div>
                  <span style={{ fontWeight: '700', color: '#667eea', fontSize: '16px', minWidth: '50px' }}>
                    {projectStats.task_completion_rate}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>{projectStats.completed_tasks} completed</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>{projectStats.total_tasks} total tasks</span>
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