import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

// Auth APIs
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

// Jobs APIs
export const getJobs = () => API.get('/jobs/');
export const createJob = (data) => API.post('/jobs/', data);
export const updateJob = (id, data) => API.put(`/jobs/${id}`, data);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);

// Resume APIs
export const uploadResume = (jobId, formData) =>
  API.post(`/resumes/upload/${jobId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getCandidatesByJob = (jobId) =>
  API.get(`/resumes/candidates/${jobId}`);

// Candidates APIs
export const getAllCandidates = () => API.get('/candidates/');
export const updateCandidateStatus = (id, status) =>
  API.put(`/candidates/${id}/status?status=${status}`);

// Interview APIs
export const scheduleInterview = (data) => API.post('/interviews/', data);
export const getInterviews = () => API.get('/interviews/');

// Projects APIs
export const getProjects = () => API.get('/projects/');
export const createProject = (data) => API.post('/projects/', data);
export const generateTasks = (projectId) =>
  API.post(`/projects/${projectId}/generate-tasks`);

// Analytics APIs
export const getRecruitmentAnalytics = () => API.get('/analytics/recruitment');
export const getPipeline = () => API.get('/analytics/pipeline');
export const getProjectAnalytics = () => API.get('/analytics/projects');

// Voice APIs
export const getScreeningQuestions = (jobId) =>
  API.get(`/voice/questions/${jobId}`);