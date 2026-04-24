import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getBlogById, updateBlog, getSourceDocs, logPipelineRun, updatePipelineRun, getPipelineRun } from '../db/index.js'
import { extractTextFromDoc } from '../modules/fileParser.js'
import { extractTone, inferStructure, generateInterimDraft, refineDraft } from '../modules/aiPipeline.js'
import { runSeoOptimizer } from '../modules/seoSkill.js'

const router = Router()

// POST /api/generate/:blogId
router.post('/:blogId', async (req, res) => {
  const { blogId } = req.params
  const { strictMode = false } = req.body

  try {
    const blog = await getBlogById(blogId)
    if (!blog) return res.status(404).json({ error: 'Blog not found' })

    const runId = uuidv4()
    await logPipelineRun({
      id: runId,
      blogId,
      step: 'initializing',
      status: 'running',
      createdAt: Date.now()
    })

    await updateBlog(blogId, { status: 'generating' })

    // Return run ID immediately — client can poll for status
    res.json({ runId, status: 'running' })

    // Run pipeline async
    runPipeline({ blog, blogId, runId, strictMode }).catch(async (err) => {
      console.error('Pipeline error:', err)
      await updatePipelineRun(runId, { status: 'failed', error: err.message })
      await updateBlog(blogId, { status: 'draft' })
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

async function runPipeline({ blog, blogId, runId, strictMode }) {
  const start = Date.now()

  // Fetch uploaded documents
  const docs = await getSourceDocs(blogId)
  const pastBlogDocs = docs.filter(d => d.type === 'past_blog')
  const referenceDocs = docs.filter(d => d.type === 'reference')
  const processDoc = docs.find(d => d.type === 'process_doc')

  // Extract text from files or pre-extracted URL docs
  async function extractAll(docList) {
    return Promise.all(docList.map(d => extractTextFromDoc(d)))
  }

  const pastBlogTexts = await extractAll(pastBlogDocs)
  const referenceTexts = await extractAll(referenceDocs)
  const processDocText = processDoc ? await extractTextFromDoc(processDoc) : ''

  // Step 1: Tone Extraction
  await updatePipelineRun(runId, { step: 'tone_extraction' })
  const toneReport = pastBlogTexts.length > 0
    ? await extractTone(pastBlogTexts)
    : { tone: ['informative', 'clear'], formality: 'semi-formal', vocabulary: 'intermediate' }

  // Step 2: Structure Inference
  await updatePipelineRun(runId, { step: 'structure_inference' })
  const structureTemplate = pastBlogTexts.length > 0
    ? await inferStructure(pastBlogTexts, toneReport)
    : { sections: [{ name: 'Introduction', purpose: 'Hook', typicalLength: 'short' }, { name: 'Body', purpose: 'Main content', typicalLength: 'long' }, { name: 'Conclusion', purpose: 'Wrap up', typicalLength: 'short' }], avgWordCount: 800 }

  // Step 3: Interim Draft
  await updatePipelineRun(runId, { step: 'interim_draft' })
  const interimDraft = await generateInterimDraft({
    title: blog.title,
    idea: blog.idea,
    toneReport,
    structureTemplate,
    referenceTexts
  })

  // Step 4: Final Refinement
  await updatePipelineRun(runId, { step: 'final_refinement' })
  const finalDraft = await refineDraft({
    interimDraft,
    processDocText,
    strictMode,
    title: blog.title
  })

  // Step 5: SEO Optimization
  await updatePipelineRun(runId, { step: 'seo_optimization' })
  const seoOutputs = await runSeoOptimizer(finalDraft, blog.title)

  // Save results
  await updateBlog(blogId, {
    status: 'complete',
    toneReport: JSON.stringify(toneReport),
    seoOutputs: JSON.stringify(seoOutputs),
    // Store markdown as content — frontend will load into editor
    contentHtml: finalDraft,
    strictMode
  })

  await updatePipelineRun(runId, {
    status: 'complete',
    step: 'done',
    output: JSON.stringify({ toneReport, seoOutputs }),
    duration_ms: Date.now() - start
  })
}

// GET /api/generate/run/:runId
router.get('/run/:runId', async (req, res) => {
  try {
    const run = await getPipelineRun(req.params.runId)
    if (!run) return res.status(404).json({ error: 'Run not found' })
    res.json(run)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
