import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: NextRequest) {
  try {
    const { topic, stance, arguments: args, teamName } = await request.json()

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      )
    }

    const prompt = `You are a debate judge at a university class debate. Analyze this team's arguments and give a score + evaluation.

Topic: "${topic}"
Team: ${teamName}
Stance: ${stance.toUpperCase()}

Their arguments:
${args.map((arg: string, i: number) => `${i + 1}. ${arg}`).join('\n')}

Evaluate on:
- Clarity of their position
- Strength of reasons
- Quality of examples/evidence
- Logical structure

CRITICAL RULES for the commentary:
1. Write in FIRST PERSON (use "I think", "I like", "I feel", "In my view")
2. Use SIMPLE EASY ENGLISH — short sentences, everyday words, no fancy vocabulary
3. Students are ESL learners. Avoid words like: "nuanced", "compelling", "precedent", "robust"
4. Write 6-8 short sentences
5. Be encouraging but honest
6. Do NOT refer to the team as "they" or "the team" — talk directly like a judge giving feedback

Example of GOOD tone:
"I really like how clear their first point was. I could follow them easily. I think the second argument needs more examples. I feel they spoke with confidence, which was great. In my view, they could add a real story to make it stronger. I liked their energy though!"

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
            content: 'You are a debate judge who speaks in simple, easy first-person English. Students are ESL learners. Use short sentences and common words. Always respond with valid JSON only, no markdown code blocks.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
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

    // Parse JSON response
    const result = JSON.parse(content)

    return NextResponse.json({
      score: Math.max(1, Math.min(10, Number(result.score) || 7)),
      commentary: result.commentary || 'I think the position was clear. I feel the arguments need more examples.',
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        // Fallback response so app doesn't break
        score: 7,
        commentary: 'I think the position was clear enough. I could follow the main points. I feel the arguments needed more examples. I like the energy and confidence. In my view, adding a real story would make it stronger. I think the delivery was good overall.',
      },
      { status: 200 }
    )
  }
}
