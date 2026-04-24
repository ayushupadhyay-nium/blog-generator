import { create } from 'zustand'
import * as api from '../api/index.js'

const useBlogStore = create((set, get) => ({
  // Blog list
  blogs: [],
  activeBlogId: null,
  activeBlog: null,

  // UI state
  activeTab: 'draft', // 'draft' | 'preview' | 'html'
  isGenerating: false,
  generationStep: null,
  pipelineRunId: null,
  seoOutputs: null,
  showSeoPanel: false,
  sources: [],
  processDoc: null,
  images: [],
  strictMode: false,
  isSaving: false,
  lastSaved: null,
  error: null,

  // Load blog list
  loadBlogs: async () => {
    try {
      const blogs = await api.getBlogs()
      set({ blogs })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Create new blog
  newBlog: async () => {
    try {
      const blog = await api.createBlog({ title: 'Untitled Blog', idea: '' })
      set(s => ({ blogs: [blog, ...s.blogs], activeBlogId: blog.id, activeBlog: blog, sources: [], processDoc: null, images: [], seoOutputs: null, activeTab: 'draft' }))
      return blog
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Select a blog
  selectBlog: async (id) => {
    try {
      const [blog, sources, processDoc, images] = await Promise.all([
        api.getBlog(id),
        api.getSources(id),
        api.getProcessDoc(id),
        api.getImages(id)
      ])
      const seoOutputs = blog.seoOutputs ? JSON.parse(blog.seoOutputs) : null
      set({ activeBlogId: id, activeBlog: blog, sources, processDoc, images, seoOutputs, activeTab: 'draft' })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Update blog field
  updateField: (field, value) => {
    set(s => ({ activeBlog: s.activeBlog ? { ...s.activeBlog, [field]: value } : null }))
  },

  // Save blog to server (debounced from editor)
  saveBlog: async (updates) => {
    const { activeBlogId } = get()
    if (!activeBlogId) return
    try {
      set({ isSaving: true })
      await api.updateBlog(activeBlogId, updates)
      set({ isSaving: false, lastSaved: Date.now() })
    } catch (err) {
      set({ isSaving: false, error: err.message })
    }
  },

  // Delete blog
  deleteBlog: async (id) => {
    try {
      await api.deleteBlog(id)
      set(s => ({
        blogs: s.blogs.filter(b => b.id !== id),
        activeBlogId: s.activeBlogId === id ? null : s.activeBlogId,
        activeBlog: s.activeBlogId === id ? null : s.activeBlog
      }))
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Upload source docs
  uploadSources: async (files, type) => {
    const { activeBlogId } = get()
    if (!activeBlogId) return
    try {
      const docs = await api.uploadSources(activeBlogId, files, type)
      set(s => ({ sources: [...s.sources, ...docs] }))
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Upload process doc
  uploadProcessDoc: async (file) => {
    const { activeBlogId } = get()
    if (!activeBlogId) return
    try {
      const doc = await api.uploadProcessDoc(activeBlogId, file)
      set({ processDoc: doc })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Upload image
  uploadImage: async (file) => {
    const { activeBlogId } = get()
    if (!activeBlogId) return null
    try {
      const image = await api.uploadImage(activeBlogId, file)
      set(s => ({ images: [...s.images, image] }))
      return image
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  // Add URL as source doc
  uploadUrl: async (url, type) => {
    const { activeBlogId } = get()
    if (!activeBlogId) return
    try {
      const doc = await api.uploadUrl(activeBlogId, url, type)
      set(s => ({ sources: [...s.sources, doc] }))
    } catch (err) {
      set({ error: err.response?.data?.error || err.message })
      throw err
    }
  },

  // Remove source doc
  removeSource: async (docId) => {
    const { activeBlogId } = get()
    try {
      await api.deleteSource(activeBlogId, docId)
      set(s => ({ sources: s.sources.filter(d => d.id !== docId) }))
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Trigger generation
  startGeneration: async () => {
    const { activeBlogId, activeBlog, strictMode } = get()
    if (!activeBlogId || !activeBlog?.title) return

    // Save latest title/idea first
    await api.updateBlog(activeBlogId, { title: activeBlog.title, idea: activeBlog.idea || '' })

    try {
      set({ isGenerating: true, generationStep: 'Starting pipeline...', error: null })
      const { runId } = await api.generateBlog(activeBlogId, { strictMode })
      set({ pipelineRunId: runId })

      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const run = await api.getPipelineRun(runId)
          const stepLabels = {
            initializing: 'Initializing...',
            tone_extraction: 'Step 1/5: Extracting tone from past blogs...',
            structure_inference: 'Step 2/5: Inferring content structure...',
            interim_draft: 'Step 3/5: Generating interim draft...',
            final_refinement: 'Step 4/5: Refining with process guidelines...',
            seo_optimization: 'Step 5/5: Running SEO optimization...',
            done: 'Complete!'
          }
          set({ generationStep: stepLabels[run.step] || run.step })

          if (run.status === 'complete') {
            clearInterval(poll)
            const blog = await api.getBlog(activeBlogId)
            const seoOutputs = blog.seoOutputs ? JSON.parse(blog.seoOutputs) : null
            set(s => ({
              isGenerating: false,
              generationStep: null,
              activeBlog: blog,
              seoOutputs,
              showSeoPanel: !!seoOutputs,
              blogs: s.blogs.map(b => b.id === activeBlogId ? { ...b, title: blog.title, status: blog.status, updatedAt: blog.updatedAt } : b)
            }))
          } else if (run.status === 'failed') {
            clearInterval(poll)
            set({ isGenerating: false, generationStep: null, error: `Generation failed: ${run.error}` })
          }
        } catch (err) {
          clearInterval(poll)
          set({ isGenerating: false, generationStep: null, error: err.message })
        }
      }, 3000)
    } catch (err) {
      set({ isGenerating: false, generationStep: null, error: err.message })
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowSeoPanel: (v) => set({ showSeoPanel: v }),
  setStrictMode: (v) => set({ strictMode: v }),
  clearError: () => set({ error: null })
}))

export default useBlogStore
