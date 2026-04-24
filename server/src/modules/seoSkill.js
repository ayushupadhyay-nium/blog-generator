import { callLLM } from './llmClient.js'

// Adapter for post-draft-optimizer skill
// Runs all 7 SEO outputs in a single LLM call
export async function runSeoOptimizer(draft, title) {
  const systemPrompt = `You are an expert on-page SEO specialist and content optimizer using the Eikhart framework. You run a comprehensive SEO audit and optimization pass on blog drafts.`

  const userPrompt = `Run a complete SEO optimization pass on this blog draft. Return a structured JSON response with all 7 outputs.

BLOG TITLE: ${title}

DRAFT:
${draft}

Return ONLY a JSON object with this exact structure:
{
  "draftBrief": {
    "primaryKeyword": "inferred primary keyword",
    "pageType": "blog post|guide|listicle|landing page",
    "readerStage": "Just browsing|Problem recognized|Comparing options|Ready to act",
    "openingStyle": "Relate → Payoff|Payoff first|Payoff only",
    "brand": "inferred brand or Other"
  },
  "bodyCopyRewrites": [
    {
      "before": "original sentence",
      "after": "rewritten sentence",
      "checkFailed": "which check it failed",
      "whatWasAdded": "what was improved"
    }
  ],
  "h2Rewrites": [
    {
      "original": "original H2",
      "rewritten": "rewritten H2",
      "rationale": "change rationale"
    }
  ],
  "h1Options": [
    { "text": "H1 option A", "charCount": 0, "why": "reason" },
    { "text": "H1 option B", "charCount": 0, "why": "reason" },
    { "text": "H1 option C", "charCount": 0, "why": "reason" }
  ],
  "titleTag": { "text": "recommended title tag", "charCount": 0 },
  "metaDescriptions": [
    { "text": "primary meta description", "charCount": 0, "type": "primary" },
    { "text": "alt meta description", "charCount": 0, "type": "alt" }
  ],
  "urlSlug": {
    "recommended": "/slug-here",
    "reasoning": "one sentence",
    "alt": "/alt-slug"
  },
  "internalLinks": [
    {
      "nearCopy": "quote from draft near where link goes",
      "anchorText": "anchor text",
      "targetPage": "target page description or [INSERT: page about X]",
      "linkType": "Cluster-to-Pillar|Pillar-to-Cluster|Cross-Cluster|Contextual"
    }
  ],
  "imageRecommendations": [
    {
      "section": "section heading",
      "imageType": "original illustration|UI screenshot|lifestyle photo|infographic|step-by-step graphic|comparison table graphic",
      "brief": "one-sentence image brief",
      "altTag": "descriptive alt text under 125 chars",
      "fileName": "descriptive-file-name.jpg",
      "dimensions": "1200x630",
      "format": "WebP primary, JPEG fallback",
      "loading": "fetchpriority=high|loading=lazy"
    }
  ]
}`

  const raw = await callLLM(systemPrompt, userPrompt, 4096)
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch[0])
  } catch {
    return { rawOutput: raw, error: 'Failed to parse SEO outputs as JSON' }
  }
}
