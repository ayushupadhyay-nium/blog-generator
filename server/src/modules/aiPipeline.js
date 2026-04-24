import { callLLM } from './llmClient.js'
import { truncateToTokenBudget } from './fileParser.js'

// Step 1: Extract tone, style, and structural habits from past blogs
export async function extractTone(pastBlogTexts) {
  const texts = truncateToTokenBudget(pastBlogTexts, 50000)
  const combined = texts.map((t, i) => `--- Blog ${i + 1} ---\n${t}`).join('\n\n')

  const system = `You are an expert content analyst specializing in writing style and tone analysis.`
  const user = `Analyze the following blog posts and extract a detailed writing profile. Return a JSON object with these exact keys:

{
  "formality": "casual|semi-formal|formal",
  "tone": ["list of 3-5 tone descriptors"],
  "sentenceStyle": "description of typical sentence length and complexity",
  "vocabulary": "simple|intermediate|advanced",
  "pointOfView": "first-person|second-person|third-person|mixed",
  "structuralHabits": ["list of 3-5 observed structural patterns"],
  "openingStyle": "description of how posts typically open",
  "closingStyle": "description of how posts typically close",
  "emphasisPatterns": "description of how emphasis or key points are highlighted",
  "uniquePhrases": ["up to 5 characteristic phrases or phrasing patterns"]
}

Only return the JSON. No explanation.

${combined}`

  const raw = await callLLM(system, user)
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    return JSON.parse(match[0])
  } catch {
    return { rawAnalysis: raw }
  }
}

// Step 2: Infer section structure from past blogs
export async function inferStructure(pastBlogTexts, toneReport) {
  const texts = truncateToTokenBudget(pastBlogTexts, 30000)
  const combined = texts.map((t, i) => `--- Blog ${i + 1} ---\n${t}`).join('\n\n')

  const system = `You are an expert content strategist who designs blog post structures.`
  const user = `Based on these blog posts and this tone profile, define a reusable section structure template.

Tone Profile:
${JSON.stringify(toneReport, null, 2)}

Blog Posts:
${combined}

Return a JSON object:
{
  "sections": [
    {
      "name": "section name",
      "purpose": "what this section achieves",
      "typicalLength": "short|medium|long",
      "notes": "any style notes for this section"
    }
  ],
  "overallFlow": "description of how sections connect",
  "avgWordCount": estimated_number
}

Only return the JSON. No explanation.`

  const raw = await callLLM(system, user)
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    return JSON.parse(match[0])
  } catch {
    return { sections: [], rawAnalysis: raw }
  }
}

// Step 3: Generate interim draft blending idea + references
export async function generateInterimDraft(params) {
  const { title, idea, toneReport, structureTemplate, referenceTexts } = params
  const refs = referenceTexts.length > 0
    ? truncateToTokenBudget(referenceTexts, 20000).join('\n\n---\n\n')
    : ''

  const system = `You are an expert blog writer. Write in the style described by the tone profile. Do not apply formatting rules yet — focus on content and flow.`
  const user = `Write an interim blog draft based on the following inputs.

TITLE: ${title}

IDEA/BRIEF:
${idea}

TONE PROFILE:
${JSON.stringify(toneReport, null, 2)}

SECTION STRUCTURE TO FOLLOW:
${JSON.stringify(structureTemplate.sections || [], null, 2)}

${refs ? `REFERENCE MATERIAL (blend insights, don't copy verbatim):\n${refs}` : ''}

Write the full blog in markdown format. Use the tone profile strictly. Follow the section structure. Aim for ${structureTemplate.avgWordCount || 800}–${(structureTemplate.avgWordCount || 800) + 400} words. This is an interim draft — prioritize matching the style and covering the idea comprehensively.`

  return await callLLM(system, user)
}

// Step 4: Refine draft using process document rules
export async function refineDraft(params) {
  const { interimDraft, processDocText, strictMode, title } = params
  const strictInstruction = strictMode
    ? 'Apply ALL rules from the process document as HARD requirements.'
    : 'Use the process document as strong guidance. Apply rules where they improve quality.'

  const system = `You are a senior content editor. ${strictInstruction}`
  const user = `Refine this blog draft using the process document guidelines.

BLOG TITLE: ${title}

PROCESS DOCUMENT / EDITORIAL GUIDELINES:
${processDocText || 'No process document provided. Apply general best practices.'}

INTERIM DRAFT:
${interimDraft}

Produce the final polished draft in markdown format. Apply all relevant process document rules. Improve clarity, flow, and adherence to editorial standards. Return only the final blog content in markdown.`

  return await callLLM(system, user)
}
