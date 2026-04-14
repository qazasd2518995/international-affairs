import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

type Perspective = 'logic' | 'delivery'

const PERSPECTIVE_BRIEFS: Record<Perspective, { role: string; focus: string }> = {
  logic: {
    role: 'A logic-focused debate judge. You care about reasoning, evidence, and how well the argument structure holds up.',
    focus: `Grade through the LOGIC lens:
  - Are the reasons solid?
  - Do examples back up claims?
  - Does the argument structure make sense?
  - Any logical gaps, contradictions, or unsupported leaps?`,
  },
  delivery: {
    role: 'A persuasion-focused debate judge. You care about clarity, word choice, emotional pull, and how convincing the pitch feels to an audience.',
    focus: `Grade through the PERSUASION lens:
  - Is the position stated clearly?
  - Do the words feel confident and natural?
  - Does it grab attention, stay on topic, feel genuine?
  - Any vague phrasing or missed opportunities to connect?`,
  },
}

export async function POST(request: NextRequest) {
  try {
    const { topic, stance, arguments: args, teamName, perspective } = await request.json()

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      )
    }

    const p: Perspective = perspective === 'delivery' ? 'delivery' : 'logic'
    const brief = PERSPECTIVE_BRIEFS[p]

    const prompt = `${brief.role}

Topic: "${topic}"
Team: ${teamName}
Stance: ${stance.toUpperCase()}

Their arguments:
${args.map((arg: string, i: number) => `${i + 1}. ${arg}`).join('\n')}

${brief.focus}

CRITICAL RULES for the commentary:
1. Write in FIRST PERSON (use "I think", "I like", "I feel", "In my view")
2. Use SIMPLE EASY ENGLISH — short sentences, everyday words, no fancy vocabulary
3. Students are ESL learners. Avoid words like: "nuanced", "compelling", "precedent", "robust"
4. Write 6-8 short sentences
5. Be encouraging but honest
6. Do NOT refer to the team as "they" or "the team" — talk directly like a judge giving feedback
7. Stay in YOUR lens (${p === 'logic' ? 'logic/reasoning' : 'delivery/persuasion'}) — don't drift into the other one.

Respond ONLY with valid JSON (no markdown, no explanation):
{"score": <number 1-10>, "commentary": "<6-8 simple first-person sentences>"}`

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `${brief.role} You speak in simple first-person English for ESL students. Short sentences, common words. Always respond with valid JSON only, no markdown code blocks.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: p === 'logic' ? 0.6 : 0.8,  // delivery perspective is a bit more creative
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content from Groq response')
    }

    const result = JSON.parse(content)

    return NextResponse.json({
      score: Math.max(1, Math.min(10, Number(result.score) || 7)),
      commentary: result.commentary || 'I think the position was clear. I feel the arguments need more examples.',
      perspective: p,
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        score: 7,
        commentary: 'I think the position was clear enough. I could follow the main points. I feel the arguments needed more examples. I like the energy and confidence. In my view, adding a real story would make it stronger. I think the delivery was good overall.',
      },
      { status: 200 }
    )
  }
}
