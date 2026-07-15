import { useState, useEffect } from 'react';
import { getProjects, createProject, generateTasks } from '../services/api';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(null);
  const [generatingSprints, setGeneratingSprints] = useState(null);
  const [projectTasks, setProjectTasks] = useState({});
  const [projectSprints, setProjectSprints] = useState({});
  const [projectTeam, setProjectTeam] = useState({});
  const [expandedProject, setExpandedProject] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [formData, setFormData] = useState({
    name: '', description: '', start_date: '', end_date: '',
  });

  useEffect(() => { fetchProjects(); }, []);

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

  const fetchTasks = async (projectId) => {
    try {
      const res = await axios.get(`https://ai-recruitment-platform-backend-uukb.onrender.com/projects/${projectId}/tasks`);
      setProjectTasks(prev => ({ ...prev, [projectId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSprints = async (projectId) => {
    try {
      const res = await axios.get(`https://ai-recruitment-platform-backend-uukb.onrender.com/projects/${projectId}/sprints`);
      setProjectSprints(prev => ({ ...prev, [projectId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeam = async (projectId) => {
    try {
      const res = await axios.get(`https://ai-recruitment-platform-backend-uukb.onrender.com/projects/${projectId}/team`);
      setProjectTeam(prev => ({ ...prev, [projectId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpand = (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      setActiveTab(prev => ({ ...prev, [projectId]: 'tasks' }));
      fetchTasks(projectId);
      fetchSprints(projectId);
      fetchTeam(projectId);
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
      await generateTasks(projectId);
      await fetchTasks(projectId);
      setExpandedProject(projectId);
      setActiveTab(prev => ({ ...prev, [projectId]: 'tasks' }));
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingTasks(null);
    }
  };

  const handleGenerateSprints = async (projectId) => {
    setGeneratingSprints(projectId);
    try {
      await axios.post(`https://ai-recruitment-platform-backend-uukb.onrender.com/projects/${projectId}/generate-sprints`);
      await fetchSprints(projectId);
      await fetchTasks(projectId);
      setExpandedProject(projectId);
      setActiveTab(prev => ({ ...prev, [projectId]: 'sprints' }));
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSprints(null);
    }
  };

  const handleTaskStatus = async (taskId, status, projectId) => {
    try {
      await axios.put(`https://ai-recruitment-platform-backend-uukb.onrender.com/projects/task/${taskId}/status?status=${status}`);
      fetchTasks(projectId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskAssign = async (taskId, assignedTo, projectId) => {
    try {
      await axios.put(`https://ai-recruitment-platform-backend-uukb.onrender.com/projects/task/${taskId}/assign?assigned_to=${assignedTo}`);
      fetchTasks(projectId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSprintStatus = async (sprintId, status, projectId) => {
    try {
      await axios.put(`https://ai-recruitment-platform-backend-uukb.onrender.com/projects/sprint/${sprintId}/status?status=${status}`);
      fetchSprints(projectId);
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    todo: { bg: '#f7f8fc', color: '#666', border: '#e2e8f0' },
    in_progress: { bg: '#ebf8ff', color: '#3182ce', border: '#bee3f8' },
    done: { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
  };

  const priorityColors = {
    high: { bg: '#fff5f5', color: '#c53030' },
    medium: { bg: '#fffbeb', color: '#d69e2e' },
    low: { bg: '#f0fdf4', color: '#166534' },
  };

  const sprintStatusColors = {
    planned: { bg: '#f7f8fc', color: '#666' },
    active: { bg: '#ebf8ff', color: '#3182ce' },
    completed: { bg: '#f0fdf4', color: '#166534' },
  };

  const roleColors = {
    developer: '#06b6d4',
    team_lead: '#8b5cf6',
    project_manager: '#ec4899',
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fc' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1, padding: '32px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#1e3a5f' }}>
              📋 Project Management
            </h1>
            <p style={{ color: '#666', margin: 0 }}>Create projects and generate AI tasks & sprints</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px', marginBottom: '28px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1e3a5f' }}>📝 Create New Project</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Project Name</label>
                  <input style={inputStyle} value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. E-commerce Platform" required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the project..." required />
                </div>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input style={inputStyle} type="date" value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input style={inputStyle} type="date" value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>
              <button type="submit" style={{
                marginTop: '20px', padding: '12px 32px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}>
                🚀 Create Project
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#666' }}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '60px',
            textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📋</p>
            <h3 style={{ color: '#1e3a5f' }}>No projects yet</h3>
            <p style={{ color: '#666' }}>Click "New Project" to create your first project!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {projects.map((project) => {
              const tasks = projectTasks[project.id] || [];
              const sprints = projectSprints[project.id] || [];
              const team = projectTeam[project.id] || [];
              const isExpanded = expandedProject === project.id;
              const currentTab = activeTab[project.id] || 'tasks';
              const todoCount = tasks.filter(t => t.status === 'todo').length;
              const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
              const doneCount = tasks.filter(t => t.status === 'done').length;

              return (
                <div key={project.id} style={{
                  background: '#fff', borderRadius: '16px',
                  padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f0f0',
                }}>
                  {/* Project Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3a5f' }}>
                          📋 {project.name}
                        </h3>
                        <span style={{
                          padding: '4px 12px', background: '#c6f6d520',
                          color: '#276749', borderRadius: '20px',
                          fontSize: '12px', fontWeight: '600', border: '1px solid #c6f6d5',
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
                          {project.end_date ? ` ${new Date(project.end_date).toLocaleDateString()}` : ' Ongoing'}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleGenerateTasks(project.id)}
                          disabled={generatingTasks === project.id}
                          style={{
                            padding: '8px 16px',
                            background: generatingTasks === project.id ? '#ccc' : 'linear-gradient(135deg, #48bb78, #38a169)',
                            border: 'none', borderRadius: '8px', color: '#fff',
                            fontSize: '12px', fontWeight: '600',
                            cursor: generatingTasks === project.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {generatingTasks === project.id ? '⏳ Generating...' : '🤖 AI Tasks'}
                        </button>
                        <button
                          onClick={() => handleGenerateSprints(project.id)}
                          disabled={generatingSprints === project.id}
                          style={{
                            padding: '8px 16px',
                            background: generatingSprints === project.id ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                            border: 'none', borderRadius: '8px', color: '#fff',
                            fontSize: '12px', fontWeight: '600',
                            cursor: generatingSprints === project.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {generatingSprints === project.id ? '⏳ Generating...' : '🏃 AI Sprints'}
                        </button>
                        <button
                          onClick={() => handleExpand(project.id)}
                          style={{
                            padding: '8px 16px',
                            background: isExpanded ? '#667eea' : '#f7f8fc',
                            border: '1px solid #e2e8f0', borderRadius: '8px',
                            color: isExpanded ? '#fff' : '#666',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? '▲ Hide' : '▼ View'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Task Stats */}
                  {tasks.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 10px', background: '#f7f8fc', borderRadius: '20px', fontSize: '12px', color: '#666', border: '1px solid #e2e8f0' }}>
                        📝 Todo: {todoCount}
                      </span>
                      <span style={{ padding: '3px 10px', background: '#ebf8ff', borderRadius: '20px', fontSize: '12px', color: '#3182ce', border: '1px solid #bee3f8' }}>
                        🔄 In Progress: {inProgressCount}
                      </span>
                      <span style={{ padding: '3px 10px', background: '#f0fdf4', borderRadius: '20px', fontSize: '12px', color: '#166534', border: '1px solid #86efac' }}>
                        ✅ Done: {doneCount}
                      </span>
                      <span style={{ padding: '3px 10px', background: '#f7f8fc', borderRadius: '20px', fontSize: '12px', color: '#666', border: '1px solid #e2e8f0' }}>
                        🏃 Sprints: {sprints.length}
                      </span>
                      <span style={{ padding: '3px 10px', background: '#faf5ff', borderRadius: '20px', fontSize: '12px', color: '#805ad5', border: '1px solid #e9d8fd' }}>
                        👥 Team: {team.length}
                      </span>
                    </div>
                  )}

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div>
                      {/* Tabs */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {['tasks', 'sprints', 'team'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(prev => ({ ...prev, [project.id]: tab }))}
                            style={{
                              padding: '8px 20px', borderRadius: '8px',
                              border: 'none', cursor: 'pointer',
                              background: currentTab === tab ? '#667eea' : '#f7f8fc',
                              color: currentTab === tab ? '#fff' : '#666',
                              fontWeight: '600', fontSize: '13px',
                            }}
                          >
                            {tab === 'tasks' ? `📝 Tasks (${tasks.length})`
                              : tab === 'sprints' ? `🏃 Sprints (${sprints.length})`
                              : `👥 Team (${team.length})`}
                          </button>
                        ))}
                      </div>

                      {/* Tasks Tab */}
                      {currentTab === 'tasks' && (
                        <div style={{ background: '#f7f8fc', borderRadius: '12px', padding: '16px' }}>
                          {tasks.length === 0 ? (
                            <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', margin: 0 }}>
                              No tasks yet — click "🤖 AI Tasks" to generate!
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gap: '10px' }}>
                              {tasks.map((task) => (
                                <div key={task.id} style={{
                                  background: '#fff', borderRadius: '10px',
                                  padding: '14px 16px', border: '1px solid #e2e8f0',
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e3a5f' }}>
                                          {task.title}
                                        </span>
                                        <span style={{
                                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                                          background: priorityColors[task.priority]?.bg || '#f7f8fc',
                                          color: priorityColors[task.priority]?.color || '#666',
                                        }}>
                                          {task.priority}
                                        </span>
                                        {task.assigned_to && (
                                          <span style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                                            background: '#faf5ff', color: '#805ad5', fontWeight: '600',
                                          }}>
                                            👤 {task.assigned_to}
                                          </span>
                                        )}
                                      </div>
                                      {task.description && (
                                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                      {/* Assign dropdown */}
                                      <select
                                        value={task.assigned_to || ''}
                                        onChange={(e) => handleTaskAssign(task.id, e.target.value, project.id)}
                                        style={{
                                          padding: '6px 10px', border: '1px solid #e9d8fd',
                                          borderRadius: '8px', fontSize: '12px',
                                          background: '#faf5ff', color: '#805ad5',
                                          cursor: 'pointer', outline: 'none',
                                        }}
                                      >
                                        <option value="">👤 Assign</option>
                                        {team.map(member => (
                                          <option key={member.id} value={member.full_name}>
                                            {member.full_name} ({member.role})
                                          </option>
                                        ))}
                                      </select>
                                      {/* Status dropdown */}
                                      <select
                                        value={task.status}
                                        onChange={(e) => handleTaskStatus(task.id, e.target.value, project.id)}
                                        style={{
                                          padding: '6px 10px',
                                          border: `1px solid ${statusColors[task.status]?.border || '#e2e8f0'}`,
                                          borderRadius: '8px', fontSize: '12px',
                                          background: statusColors[task.status]?.bg || '#fff',
                                          color: statusColors[task.status]?.color || '#666',
                                          cursor: 'pointer', outline: 'none',
                                        }}
                                      >
                                        <option value="todo">📝 Todo</option>
                                        <option value="in_progress">🔄 In Progress</option>
                                        <option value="done">✅ Done</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sprints Tab */}
                      {currentTab === 'sprints' && (
                        <div style={{ background: '#f7f8fc', borderRadius: '12px', padding: '16px' }}>
                          {sprints.length === 0 ? (
                            <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', margin: 0 }}>
                              No sprints yet — click "🏃 AI Sprints" to generate!
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                              {sprints.map((sprint) => (
                                <div key={sprint.id} style={{
                                  background: '#fff', borderRadius: '12px',
                                  padding: '16px', border: '1px solid #e2e8f0',
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#1e3a5f' }}>
                                          🏃 {sprint.name}
                                        </span>
                                        <span style={{
                                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                                          background: sprintStatusColors[sprint.status]?.bg || '#f7f8fc',
                                          color: sprintStatusColors[sprint.status]?.color || '#666',
                                        }}>
                                          {sprint.status}
                                        </span>
                                      </div>
                                      {sprint.goal && (
                                        <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666' }}>
                                          🎯 {sprint.goal}
                                        </p>
                                      )}
                                      <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                                        📅 {sprint.start_date} → {sprint.end_date}
                                      </p>
                                    </div>
                                    <select
                                      value={sprint.status}
                                      onChange={(e) => handleSprintStatus(sprint.id, e.target.value, project.id)}
                                      style={{
                                        padding: '6px 10px', border: '1px solid #e2e8f0',
                                        borderRadius: '8px', fontSize: '12px',
                                        cursor: 'pointer', outline: 'none',
                                      }}
                                    >
                                      <option value="planned">📋 Planned</option>
                                      <option value="active">🔄 Active</option>
                                      <option value="completed">✅ Completed</option>
                                    </select>
                                  </div>
                                  {sprint.tasks && sprint.tasks.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {sprint.tasks.map((task, j) => (
                                        <span key={j} style={{
                                          padding: '4px 10px', borderRadius: '8px',
                                          background: statusColors[task.status]?.bg || '#f7f8fc',
                                          color: statusColors[task.status]?.color || '#666',
                                          border: `1px solid ${statusColors[task.status]?.border || '#e2e8f0'}`,
                                          fontSize: '12px', fontWeight: '500',
                                        }}>
                                          {task.title}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Team Tab */}
                      {currentTab === 'team' && (
                        <div style={{ background: '#f7f8fc', borderRadius: '12px', padding: '16px' }}>
                          {team.length === 0 ? (
                            <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', margin: 0 }}>
                              No team members found. Add users with developer/team_lead/project_manager roles.
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              {team.map((member) => (
                                <div key={member.id} style={{
                                  background: '#fff', borderRadius: '10px',
                                  padding: '14px 16px', border: '1px solid #e2e8f0',
                                  display: 'flex', alignItems: 'center', gap: '12px',
                                }}>
                                  <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${roleColors[member.role] || '#667eea'}, #764ba2)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0,
                                  }}>
                                    {member.full_name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#1e3a5f' }}>
                                      {member.full_name}
                                    </p>
                                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>
                                      {member.email}
                                    </p>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                                      color: '#fff',
                                      background: roleColors[member.role] || '#667eea',
                                    }}>
                                      {member.role}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;