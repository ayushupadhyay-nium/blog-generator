import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 30000
})

// Blogs
export const getBlogs = () => api.get('/blogs').then(r => r.data)
export const createBlog = (data) => api.post('/blogs', data).then(r => r.data)
export const getBlog = (id) => api.get(`/blogs/${id}`).then(r => r.data)
export const updateBlog = (id, data) => api.put(`/blogs/${id}`, data).then(r => r.data)
export const deleteBlog = (id) => api.delete(`/blogs/${id}`).then(r => r.data)
export const exportBlog = (id) => api.get(`/blogs/${id}/export`).then(r => r.data)
export const downloadBlog = (id) => `/api/blogs/${id}/export?format=raw`

// Generation
export const generateBlog = (blogId, opts) =>
  api.post(`/generate/${blogId}`, opts, { timeout: 10000 }).then(r => r.data)
export const getPipelineRun = (runId) =>
  api.get(`/generate/run/${runId}`).then(r => r.data)

// Uploads
export const uploadSources = (blogId, files, type = 'past_blog') => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  form.append('type', type)
  return api.post(`/blogs/${blogId}/upload/sources`, form).then(r => r.data)
}
export const uploadProcessDoc = (blogId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/blogs/${blogId}/upload/process`, form).then(r => r.data)
}
export const uploadImage = (blogId, file) => {
  const form = new FormData()
  form.append('image', file)
  return api.post(`/blogs/${blogId}/upload/image`, form).then(r => r.data)
}
export const getSources = (blogId) =>
  api.get(`/blogs/${blogId}/upload/sources`).then(r => r.data)
export const getProcessDoc = (blogId) =>
  api.get(`/blogs/${blogId}/upload/process`).then(r => r.data)
export const getImages = (blogId) =>
  api.get(`/blogs/${blogId}/images`).then(r => r.data)
export const deleteSource = (blogId, docId) =>
  api.delete(`/blogs/${blogId}/upload/source/${docId}`).then(r => r.data)
export const uploadUrl = (blogId, url, type) =>
  api.post(`/blogs/${blogId}/upload/url`, { url, type }).then(r => r.data)

// Settings
export const getSettings = () => api.get('/settings').then(r => r.data)
export const saveSettings = (data) => api.post('/settings', data).then(r => r.data)
