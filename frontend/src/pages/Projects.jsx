import { useState, useEffect } from 'react';
import { getProjects, createProject, generateTasks } from '../services/api';
import Sidebar from '../components/Sidebar';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(null);
  const [generatedTasks, setGeneratedTasks] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProject(formData);
      setShowForm(false);
      setFormData({ name: '', description: '', start_date: '', end_date: '' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateTasks = async (projectId) => {
    setGeneratingTasks(projectId);
    try {
      const res = await generateTasks(projectId);
      setGeneratedTasks({ ...generatedTasks, [projectId]: res.data.tasks });
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingTasks(null);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
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

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
              📋 Project Management
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Create projects and generate AI tasks automatically
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Create Project Form */}
        {showForm && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>📝 Create New Project</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Project Name</label>
                  <input
                    style={inputStyle}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. E-commerce Platform"
                    required
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the project..."
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                style={{
                  marginTop: '20px',
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                🚀 Create Project
              </button>
            </form>
          </div>
        )}

        {/* Projects List */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📋</p>
            <h3 style={{ color: '#1e3a5f' }}>No projects yet</h3>
            <p style={{ color: '#666' }}>Click "New Project" to create your first project!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {projects.map((project) => (
              <div key={project.id} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
              }}>
                {/* Project Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3a5f' }}>
                        📋 {project.name}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        background: '#c6f6d520',
                        color: '#276749',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #c6f6d5',
                      }}>
                        ✅ {project.status}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px', color: '#666', fontSize: '14px' }}>
                      {project.description}
                    </p>
                    {project.start_date && (
                      <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>
                        📅 {new Date(project.start_date).toLocaleDateString()} —
                        {project.end_date
                          ? ` ${new Date(project.end_date).toLocaleDateString()}`
                          : ' Ongoing'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleGenerateTasks(project.id)}
                    disabled={generatingTasks === project.id}
                    style={{
                      padding: '10px 20px',
                      background: generatingTasks === project.id
                        ? '#ccc'
                        : 'linear-gradient(135deg, #48bb78, #38a169)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: generatingTasks === project.id ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {generatingTasks === project.id ? '⏳ Generating...' : '🤖 Generate AI Tasks'}
                  </button>
                </div>

                {/* Generated Tasks */}
                {generatedTasks[project.id] && (
                  <div style={{
                    background: '#f7f8fc',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '16px',
                  }}>
                    <h4 style={{ margin: '0 0 12px', color: '#1e3a5f', fontSize: '14px' }}>
                      🤖 AI Generated Tasks:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {generatedTasks[project.id].map((task, i) => (
                        <div key={i} style={{
                          padding: '10px 14px',
                          background: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          color: '#333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{ color: '#667eea' }}>✓</span>
                          {task}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;