import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Find the most recently updated game session.
// Used by /display, /judge, and /?session=... fallback so spectators/judges
// don't have to paste a session ID — they just open the URL and auto-join
// whatever game the host most recently created.
export async function findLatestSessionId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data.id
}

// Database types
export interface DbGameSession {
  id: string
  phase: string
  phase_started_at: string | null
  current_round: number
  total_rounds: number
  current_topic_id: string | null
  current_match_id: string | null
  debate_sub_phase: string | null
  debate_sub_phase_started_at: string | null
  created_at: string
  updated_at: string
}

export interface DbTeam {
  id: string
  session_id: string
  name: string
  total_score: number
  matches_played: number
  created_at: string
}

export interface DbPlayer {
  id: string
  session_id: string
  team_id: string
  name: string
  created_at: string
}

export interface DbVote {
  id: string
  session_id: string
  player_id: string
  team_id: string
  topic_id: string
  stance: 'agree' | 'disagree' | 'not-sure'
  created_at: string
}

export interface DbMatch {
  id: string
  session_id: string
  round: number
  topic_id: string
  team_a: string
  team_b: string
  team_a_stance: string
  team_b_stance: string
  team_a_arguments: string[]
  team_b_arguments: string[]
  ai_analysis_a: { teamId: string; score: number; commentary: string; perspective?: 'logic' | 'delivery' } | null
  ai_analysis_b: { teamId: string; score: number; commentary: string; perspective?: 'logic' | 'delivery' } | null
  ai_analysis_a_judge2: { teamId: string; score: number; commentary: string; perspective?: 'logic' | 'delivery' } | null
  ai_analysis_b_judge2: { teamId: string; score: number; commentary: string; perspective?: 'logic' | 'delivery' } | null
  winner: string | null
  completed: boolean
  created_at: string
}

export interface DbJudgeScore {
  id: string
  match_id: string
  judge_id: string
  team_a_score: number
  team_b_score: number
  created_at: string
}

export interface DbAudienceVote {
  id: string
  match_id: string
  player_id: string
  voted_for: string
  created_at: string
}

export interface DbLiveArgument {
  id: string
  match_id: string
  player_id: string
  team_id: string
  content: string
  created_at: string
}
