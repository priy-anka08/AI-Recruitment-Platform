import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecruitmentAnalytics, getPipeline } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, pipelineRes] = await Promise.all([
          getRecruitmentAnalytics(),
          getPipeline(),
        ]);
        setAnalytics(analyticsRes.data);
        setPipeline(pipelineRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = analytics ? [
    { label: 'Total Jobs', value: analytics.total_jobs, icon: '💼', color: '#667eea' },
    { label: 'Total Candidates', value: analytics.total_candidates, icon: '👥', color: '#48bb78' },
    { label: 'Selected', value: analytics.selected, icon: '✅', color: '#38b2ac' },
    { label: 'Avg ATS Score', value: `${analytics.average_ats_score}%`, icon: '🎯', color: '#ed8936' },
    { label: 'Interviews', value: analytics.interviews_scheduled, icon: '📅', color: '#9f7aea' },
    { label: 'Success Rate', value: `${analytics.hiring_success_rate}%`, icon: '🚀', color: '#f56565' },
  ] : [];

  const pipelineData = pipeline ? Object.entries(pipeline).map(([key, value]) => ({
    name: key.replace('_', ' '),
    count: value,
  })) : [];

  const quickLinks = [
    { label: 'Post a Job', icon: '💼', path: '/jobs', color: '#667eea' },
    { label: 'Screen Resume', icon: '📄', path: '/resume-upload', color: '#48bb78' },
    { label: 'View Candidates', icon: '👥', path: '/candidates', color: '#ed8936' },
    { label: 'Schedule Interview', icon: '📅', path: '/interviews', color: '#9f7aea' },
    { label: 'Manage Projects', icon: '📋', path: '/projects', color: '#38b2ac' },
    { label: 'View Analytics', icon: '📊', path: '/analytics', color: '#f56565' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            margin: '0 0 8px',
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e3a5f',
          }}>
            👋 Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p style={{ color: '#666', margin: 0, fontSize: '15px' }}>
            Here's what's happening with your recruitment today.
          </p>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading analytics...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginBottom: '32px',
          }}>
            {statCards.map((card, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid #f0f0f0',
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: `${card.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}>
                  {card.icon}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>
                    {card.label}
                  </p>
                  <h3 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '700',
                    color: card.color,
                  }}>
                    {card.value}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart + Quick Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* Pipeline Chart */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{
              margin: '0 0 20px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e3a5f',
            }}>
              📊 Candidate Pipeline
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

          {/* Quick Links */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{
              margin: '0 0 20px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e3a5f',
            }}>
              ⚡ Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              {quickLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => navigate(link.path)}
                  style={{
                    padding: '14px',
                    background: `${link.color}10`,
                    border: `1px solid ${link.color}30`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: link.color,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;