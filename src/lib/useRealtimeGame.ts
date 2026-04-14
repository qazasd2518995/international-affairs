'use client'

import { useEffect, useCallback, useState } from 'react'
import { supabase } from './supabase'
import type {
  DbGameSession,
  DbTeam,
  DbPlayer,
  DbVote,
  DbMatch,
  DbJudgeScore,
  DbAudienceVote,
} from './supabase'
import type { GamePhase, Team, Player, Vote, Match, JudgeScore, AudienceVote } from './types'

export type DebateSubPhase = 'team-a-opening' | 'team-b-opening' | 'host-challenge' | 'team-a-response' | 'team-b-response' | 'done'

// Convert DB types to app types
const toTeam = (db: DbTeam): Team => ({
  id: db.id,
  name: db.name,
  members: [],
  totalScore: Number(db.total_score),
  matchesPlayed: db.matches_played,
})

const toPlayer = (db: DbPlayer): Player => ({
  id: db.id,
  name: db.name,
  teamId: db.team_id,
})

const toVote = (db: DbVote): Vote => ({
  playerId: db.player_id,
  teamId: db.team_id,
  stance: db.stance,
})

const toMatch = (db: DbMatch): Match => ({
  id: db.id,
  round: db.round,
  topicId: db.topic_id,
  teamA: db.team_a,
  teamB: db.team_b,
  teamAStance: db.team_a_stance as 'agree' | 'disagree',
  teamBStance: db.team_b_stance as 'agree' | 'disagree',
  teamAArguments: db.team_a_arguments || [],
  teamBArguments: db.team_b_arguments || [],
  aiAnalysisA: db.ai_analysis_a || undefined,
  aiAnalysisB: db.ai_analysis_b || undefined,
  judgeScores: [],
  audienceVotes: [],
  winner: db.winner || undefined,
  completed: db.completed,
})

interface RealtimeGameState {
  sessionId: string | null
  phase: GamePhase
  phaseStartedAt: number | null
  currentRound: number
  currentTopicId: string | null
  currentMatchId: string | null
  debateSubPhase: DebateSubPhase
  debateSubPhaseStartedAt: number | null
  teams: Record<string, Team>
  players: Record<string, Player>
  votes: Vote[]
  matches: Match[]
  judgeScores: Record<string, JudgeScore[]>
  audienceVotes: Record<string, AudienceVote[]>
  isLoading: boolean
  error: string | null
}

interface RealtimeGameActions {
  createSession: () => Promise<string>
  joinSession: (sessionId: string, playerName: string, teamId: string) => Promise<string>
  updatePhase: (phase: GamePhase) => Promise<void>
  setCurrentTopic: (topicId: string) => Promise<void>
  submitVote: (playerId: string, teamId: string, topicId: string, stance: Vote['stance']) => Promise<void>
  createMatch: (match: Omit<Match, 'judgeScores' | 'audienceVotes'>) => Promise<void>
  setCurrentMatch: (matchId: string) => Promise<void>
  submitArguments: (matchId: string, teamId: string, args: string[]) => Promise<void>
  submitJudgeScore: (matchId: string, score: JudgeScore) => Promise<void>
  submitAudienceVote: (matchId: string, playerId: string, votedFor: string) => Promise<void>
  updateTeamScore: (teamId: string, score: number, matchesPlayed: number) => Promise<void>
  updateMatchResult: (matchId: string, winner: string) => Promise<void>
  updateMatchTopic: (matchId: string, topicId: string) => Promise<void>
  updateDebateSubPhase: (subPhase: DebateSubPhase) => Promise<void>
}

export function useRealtimeGame(initialSessionId?: string): RealtimeGameState & RealtimeGameActions {
  const [state, setState] = useState<RealtimeGameState>({
    sessionId: initialSessionId || null,
    phase: 'lobby',
    phaseStartedAt: null,
    currentRound: 0,
    currentTopicId: null,
    currentMatchId: null,
    debateSubPhase: 'team-a-opening',
    debateSubPhaseStartedAt: null,
    teams: {},
    players: {},
    votes: [],
    matches: [],
    judgeScores: {},
    audienceVotes: {},
    isLoading: true,
    error: null,
  })

  // Sync sessionId prop changes into hook state. The display/judge pages
  // resolve the session asynchronously (findLatestSessionId), so the prop
  // may start as undefined and get a real id on the next render. Without
  // this, the hook would stay locked on the initial undefined value.
  useEffect(() => {
    if (!initialSessionId) return
    setState((prev) => (prev.sessionId === initialSessionId ? prev : { ...prev, sessionId: initialSessionId }))
  }, [initialSessionId])

  // Load initial data. Accepts an abort signal so stale in-flight loads from
  // a previous session don't overwrite fresh state after the user switches.
  const loadSession = useCallback(async (sessionId: string, isCancelled?: () => boolean) => {
    try {
      // Load session
      const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!session) return

      // Load teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('session_id', sessionId)

      // Load players
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId)

      // Load votes
      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('session_id', sessionId)

      // Load matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('session_id', sessionId)

      // Load judge scores
      const { data: judgeScoresData } = await supabase
        .from('judge_scores')
        .select('*')

      // Load audience votes
      const { data: audienceVotesData } = await supabase
        .from('audience_votes')
        .select('*')

      const teams: Record<string, Team> = {}
      const players: Record<string, Player> = {}

      teamsData?.forEach((t) => {
        teams[t.id] = toTeam(t)
      })

      playersData?.forEach((p) => {
        const player = toPlayer(p)
        players[p.id] = player
        if (teams[p.team_id]) {
          teams[p.team_id].members.push(player)
        }
      })

      const judgeScores: Record<string, JudgeScore[]> = {}
      judgeScoresData?.forEach((s) => {
        if (!judgeScores[s.match_id]) judgeScores[s.match_id] = []
        judgeScores[s.match_id].push({
          judgeId: s.judge_id as 'judge1' | 'judge2',
          teamAScore: s.team_a_score,
          teamBScore: s.team_b_score,
        })
      })

      const audienceVotes: Record<string, AudienceVote[]> = {}
      audienceVotesData?.forEach((v) => {
        if (!audienceVotes[v.match_id]) audienceVotes[v.match_id] = []
        audienceVotes[v.match_id].push({
          playerId: v.player_id,
          votedFor: v.voted_for,
        })
      })

      const matches = (matchesData || []).map((m) => {
        const match = toMatch(m)
        match.judgeScores = judgeScores[m.id] || []
        match.audienceVotes = audienceVotes[m.id] || []
        return match
      })

      if (isCancelled && isCancelled()) return

      setState((prev) => ({
        ...prev,
        sessionId,
        phase: session.phase as GamePhase,
        phaseStartedAt: session.phase_started_at
          ? new Date(session.phase_started_at).getTime()
          : null,
        currentRound: session.current_round,
        currentTopicId: session.current_topic_id,
        currentMatchId: session.current_match_id,
        debateSubPhase: (session.debate_sub_phase as DebateSubPhase) || 'team-a-opening',
        debateSubPhaseStartedAt: session.debate_sub_phase_started_at
          ? new Date(session.debate_sub_phase_started_at).getTime()
          : null,
        teams,
        players,
        votes: (votesData || []).map(toVote),
        matches,
        judgeScores,
        audienceVotes,
        isLoading: false,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load session',
        isLoading: false,
      }))
    }
  }, [])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!state.sessionId) return

    let cancelled = false
    loadSession(state.sessionId, () => cancelled)

    // Subscribe to game_sessions changes
    const sessionChannel = supabase
      .channel(`session-${state.sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${state.sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const session = payload.new as DbGameSession
            setState((prev) => ({
              ...prev,
              phase: session.phase as GamePhase,
              phaseStartedAt: session.phase_started_at
                ? new Date(session.phase_started_at).getTime()
                : null,
              currentRound: session.current_round,
              currentTopicId: session.current_topic_id,
              currentMatchId: session.current_match_id,
              debateSubPhase: (session.debate_sub_phase as DebateSubPhase) || 'team-a-opening',
              debateSubPhaseStartedAt: session.debate_sub_phase_started_at
                ? new Date(session.debate_sub_phase_started_at).getTime()
                : null,
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${state.sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const player = toPlayer(payload.new as DbPlayer)
            setState((prev) => ({
              ...prev,
              players: { ...prev.players, [player.id]: player },
              teams: {
                ...prev.teams,
                [player.teamId]: {
                  ...prev.teams[player.teamId],
                  members: [...(prev.teams[player.teamId]?.members || []), player],
                },
              },
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `session_id=eq.${state.sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const vote = toVote(payload.new as DbVote)
            setState((prev) => ({
              ...prev,
              votes: [...prev.votes.filter((v) => v.playerId !== vote.playerId), vote],
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `session_id=eq.${state.sessionId}`,
        },
        (payload) => {
          const match = toMatch(payload.new as DbMatch)
          setState((prev) => {
            match.judgeScores = prev.judgeScores[match.id] || []
            match.audienceVotes = prev.audienceVotes[match.id] || []
            return {
              ...prev,
              matches:
                payload.eventType === 'INSERT'
                  ? [...prev.matches, match]
                  : prev.matches.map((m) => (m.id === match.id ? match : m)),
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `session_id=eq.${state.sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const team = payload.new as DbTeam
            setState((prev) => ({
              ...prev,
              teams: {
                ...prev.teams,
                [team.id]: {
                  ...prev.teams[team.id],
                  totalScore: Number(team.total_score),
                  matchesPlayed: team.matches_played,
                },
              },
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'judge_scores',
        },
        (payload) => {
          const score = payload.new as DbJudgeScore
          setState((prev) => {
            // judge_scores has no session_id column, so filter client-side:
            // if the match isn't in our session, ignore the event entirely.
            if (!prev.matches.some((m) => m.id === score.match_id)) return prev
            const newJudgeScores = { ...prev.judgeScores }
            if (!newJudgeScores[score.match_id]) newJudgeScores[score.match_id] = []
            newJudgeScores[score.match_id] = [
              ...newJudgeScores[score.match_id].filter((s) => s.judgeId !== score.judge_id),
              {
                judgeId: score.judge_id as 'judge1' | 'judge2',
                teamAScore: score.team_a_score,
                teamBScore: score.team_b_score,
              },
            ]
            return {
              ...prev,
              judgeScores: newJudgeScores,
              matches: prev.matches.map((m) =>
                m.id === score.match_id ? { ...m, judgeScores: newJudgeScores[score.match_id] } : m
              ),
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audience_votes',
        },
        (payload) => {
          const vote = payload.new as DbAudienceVote
          setState((prev) => {
            // Same as judge_scores — scope by known match IDs in our session.
            if (!prev.matches.some((m) => m.id === vote.match_id)) return prev
            const newAudienceVotes = { ...prev.audienceVotes }
            if (!newAudienceVotes[vote.match_id]) newAudienceVotes[vote.match_id] = []
            newAudienceVotes[vote.match_id] = [
              ...newAudienceVotes[vote.match_id].filter((v) => v.playerId !== vote.player_id),
              { playerId: vote.player_id, votedFor: vote.voted_for },
            ]
            return {
              ...prev,
              audienceVotes: newAudienceVotes,
              matches: prev.matches.map((m) =>
                m.id === vote.match_id ? { ...m, audienceVotes: newAudienceVotes[vote.match_id] } : m
              ),
            }
          })
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(sessionChannel)
    }
  }, [state.sessionId, loadSession])

  // Actions
  const createSession = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({})
      .select()
      .single()

    if (error) throw error

    // Create 6 teams — team ID is prefixed with session ID to avoid PK collisions
    // across sessions (teams.id is a global PK in Postgres).
    const teams = Array.from({ length: 6 }, (_, i) => ({
      id: `${data.id}:team-${i + 1}`,
      session_id: data.id,
      name: `Group ${i + 1}`,
    }))

    const { error: teamsError } = await supabase.from('teams').insert(teams)
    if (teamsError) throw teamsError

    setState((prev) => ({ ...prev, sessionId: data.id }))
    return data.id
  }, [])

  const joinSession = useCallback(
    async (sessionId: string, playerName: string, teamId: string): Promise<string> => {
      const playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      const { error } = await supabase.from('players').insert({
        id: playerId,
        session_id: sessionId,
        team_id: teamId,
        name: playerName,
      })

      if (error) throw error
      return playerId
    },
    []
  )

  const updatePhase = useCallback(
    async (phase: GamePhase) => {
      if (!state.sessionId) return

      const now = new Date().toISOString()
      await supabase
        .from('game_sessions')
        .update({
          phase,
          phase_started_at: now,
          updated_at: now,
        })
        .eq('id', state.sessionId)
    },
    [state.sessionId]
  )

  const setCurrentTopic = useCallback(
    async (topicId: string) => {
      if (!state.sessionId) return

      await supabase
        .from('game_sessions')
        .update({ current_topic_id: topicId, updated_at: new Date().toISOString() })
        .eq('id', state.sessionId)
    },
    [state.sessionId]
  )

  const submitVote = useCallback(
    async (playerId: string, teamId: string, topicId: string, stance: Vote['stance']) => {
      if (!state.sessionId) return

      await supabase.from('votes').upsert(
        {
          session_id: state.sessionId,
          player_id: playerId,
          team_id: teamId,
          topic_id: topicId,
          stance,
        },
        { onConflict: 'session_id,player_id,topic_id' }
      )
    },
    [state.sessionId]
  )

  const createMatch = useCallback(
    async (match: Omit<Match, 'judgeScores' | 'audienceVotes'>) => {
      if (!state.sessionId) return

      await supabase.from('matches').insert({
        id: match.id,
        session_id: state.sessionId,
        round: match.round,
        topic_id: match.topicId,
        team_a: match.teamA,
        team_b: match.teamB,
        team_a_stance: match.teamAStance,
        team_b_stance: match.teamBStance,
        team_a_arguments: match.teamAArguments,
        team_b_arguments: match.teamBArguments,
      })

      // Update current round
      await supabase
        .from('game_sessions')
        .update({ current_round: match.round, updated_at: new Date().toISOString() })
        .eq('id', state.sessionId)
    },
    [state.sessionId]
  )

  const setCurrentMatch = useCallback(
    async (matchId: string) => {
      if (!state.sessionId) return

      await supabase
        .from('game_sessions')
        .update({ current_match_id: matchId, updated_at: new Date().toISOString() })
        .eq('id', state.sessionId)
    },
    [state.sessionId]
  )

  const submitArguments = useCallback(async (matchId: string, teamId: string, args: string[]) => {
    const match = state.matches.find((m) => m.id === matchId)
    if (!match) return

    const updateField = match.teamA === teamId ? 'team_a_arguments' : 'team_b_arguments'

    await supabase
      .from('matches')
      .update({ [updateField]: args })
      .eq('id', matchId)

    // Trigger AI analysis in background
    try {
      const team = state.teams[teamId]
      const topic = match.topicId
      const stance = match.teamA === teamId ? match.teamAStance : match.teamBStance

      // Find topic question from local topics
      const { TOPICS } = await import('./types')
      const topicObj = TOPICS.find((t) => t.id === topic)
      if (!topicObj) return

      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicObj.question,
          stance,
          arguments: args,
          teamName: team?.name || 'Team',
        }),
      })

      if (response.ok) {
        const analysis = await response.json()
        const aiField = match.teamA === teamId ? 'ai_analysis_a' : 'ai_analysis_b'

        await supabase
          .from('matches')
          .update({
            [aiField]: {
              teamId,
              score: analysis.score,
              commentary: analysis.commentary,
            },
          })
          .eq('id', matchId)
      }
    } catch (err) {
      console.error('AI analysis failed:', err)
    }
  }, [state.matches, state.teams])

  const submitJudgeScore = useCallback(async (matchId: string, score: JudgeScore) => {
    await supabase.from('judge_scores').upsert(
      {
        match_id: matchId,
        judge_id: score.judgeId,
        team_a_score: score.teamAScore,
        team_b_score: score.teamBScore,
      },
      { onConflict: 'match_id,judge_id' }
    )
  }, [])

  const submitAudienceVote = useCallback(async (matchId: string, playerId: string, votedFor: string) => {
    await supabase.from('audience_votes').upsert(
      {
        match_id: matchId,
        player_id: playerId,
        voted_for: votedFor,
      },
      { onConflict: 'match_id,player_id' }
    )
  }, [])

  const updateTeamScore = useCallback(async (teamId: string, score: number, matchesPlayed: number) => {
    await supabase
      .from('teams')
      .update({ total_score: score, matches_played: matchesPlayed })
      .eq('id', teamId)
  }, [])

  const updateMatchTopic = useCallback(async (matchId: string, topicId: string) => {
    await supabase
      .from('matches')
      .update({ topic_id: topicId })
      .eq('id', matchId)
  }, [])

  const updateMatchResult = useCallback(async (matchId: string, winner: string) => {
    await supabase
      .from('matches')
      .update({ winner, completed: true })
      .eq('id', matchId)
  }, [])

  const updateDebateSubPhase = useCallback(async (subPhase: DebateSubPhase) => {
    if (!state.sessionId) return

    await supabase
      .from('game_sessions')
      .update({
        debate_sub_phase: subPhase,
        debate_sub_phase_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.sessionId)
  }, [state.sessionId])

  return {
    ...state,
    createSession,
    joinSession,
    updatePhase,
    setCurrentTopic,
    submitVote,
    createMatch,
    setCurrentMatch,
    submitArguments,
    submitJudgeScore,
    submitAudienceVote,
    updateTeamScore,
    updateMatchResult,
    updateMatchTopic,
    updateDebateSubPhase,
  }
}
