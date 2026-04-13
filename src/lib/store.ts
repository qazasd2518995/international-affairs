'use client'

import { create } from 'zustand'
import type { GameState, GamePhase, Topic, Team, Player, Vote, Match, JudgeScore, AudienceVote, AIAnalysis } from './types'
import { TOPICS } from './types'

interface GameStore extends GameState {
  // Actions
  setPhase: (phase: GamePhase) => void
  initializeGame: (teamCount: number) => void
  addPlayer: (name: string, teamId: string) => string
  setCurrentTopic: (topicId: string) => void
  submitVote: (playerId: string, teamId: string, stance: Vote['stance']) => void
  createMatches: () => void
  setCurrentMatch: (matchId: string) => void
  submitArguments: (matchId: string, teamId: string, args: string[]) => void
  submitAIAnalysis: (matchId: string, analysis: AIAnalysis) => void
  submitJudgeScore: (matchId: string, score: JudgeScore) => void
  submitAudienceVote: (matchId: string, playerId: string, votedFor: string) => void
  calculateMatchResult: (matchId: string) => void
  startTimer: (seconds: number) => void
  tickTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  nextRound: () => void
  reset: () => void
}

const initialState: GameState = {
  phase: 'lobby',
  currentRound: 0,
  totalRounds: 3,
  topics: TOPICS,
  currentTopicId: null,
  teams: {},
  players: {},
  votes: [],
  matches: [],
  currentMatchId: null,
  timer: {
    isRunning: false,
    seconds: 0,
    totalSeconds: 0,
  },
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  initializeGame: (teamCount) => {
    const teams: Record<string, Team> = {}
    for (let i = 1; i <= teamCount; i++) {
      const id = `team-${i}`
      teams[id] = {
        id,
        name: `Group ${i}`,
        members: [],
        totalScore: 0,
        matchesPlayed: 0,
      }
    }
    set({ teams, players: {}, votes: [], matches: [], currentRound: 0 })
  },

  addPlayer: (name, teamId) => {
    const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const player: Player = { id, name, teamId }

    set((state) => ({
      players: { ...state.players, [id]: player },
      teams: {
        ...state.teams,
        [teamId]: {
          ...state.teams[teamId],
          members: [...state.teams[teamId].members, player],
        },
      },
    }))

    return id
  },

  setCurrentTopic: (topicId) => set({ currentTopicId: topicId }),

  submitVote: (playerId, teamId, stance) => {
    set((state) => {
      // Remove existing vote from this player if any
      const filteredVotes = state.votes.filter((v) => v.playerId !== playerId)
      return {
        votes: [...filteredVotes, { playerId, teamId, stance }],
      }
    })
  },

  createMatches: () => {
    const { teams, votes, currentTopicId, currentRound } = get()
    if (!currentTopicId) return

    // Calculate team stances based on votes
    const teamStances: { teamId: string; agreePercent: number; disagreePercent: number }[] = []

    Object.values(teams).forEach((team) => {
      const teamVotes = votes.filter((v) => v.teamId === team.id)
      const total = teamVotes.length || 1
      const agreeCount = teamVotes.filter((v) => v.stance === 'agree').length
      const disagreeCount = teamVotes.filter((v) => v.stance === 'disagree').length

      teamStances.push({
        teamId: team.id,
        agreePercent: (agreeCount / total) * 100,
        disagreePercent: (disagreeCount / total) * 100,
      })
    })

    // Sort by stance difference (most polarized first)
    teamStances.sort((a, b) => {
      const diffA = Math.abs(a.agreePercent - a.disagreePercent)
      const diffB = Math.abs(b.agreePercent - b.disagreePercent)
      return diffB - diffA
    })

    // Pair teams: most agree vs most disagree
    const sortedByAgree = [...teamStances].sort((a, b) => b.agreePercent - a.agreePercent)
    const paired: Set<string> = new Set()
    const newMatches: Match[] = []

    for (let i = 0; i < Math.floor(teamStances.length / 2); i++) {
      // Get most agree team that hasn't been paired
      const teamA = sortedByAgree.find((t) => !paired.has(t.teamId))
      if (!teamA) break
      paired.add(teamA.teamId)

      // Get most disagree team that hasn't been paired
      const sortedByDisagree = [...teamStances].sort((a, b) => b.disagreePercent - a.disagreePercent)
      const teamB = sortedByDisagree.find((t) => !paired.has(t.teamId))
      if (!teamB) break
      paired.add(teamB.teamId)

      const match: Match = {
        id: `match-${currentRound + 1}-${i + 1}`,
        round: currentRound + 1,
        topicId: currentTopicId,
        teamA: teamA.teamId,
        teamB: teamB.teamId,
        teamAStance: 'agree',
        teamBStance: 'disagree',
        teamAArguments: [],
        teamBArguments: [],
        judgeScores: [],
        audienceVotes: [],
        completed: false,
      }

      newMatches.push(match)
    }

    set((state) => ({
      matches: [...state.matches, ...newMatches],
      currentRound: currentRound + 1,
    }))
  },

  setCurrentMatch: (matchId) => set({ currentMatchId: matchId }),

  submitArguments: (matchId, teamId, args) => {
    set((state) => ({
      matches: state.matches.map((m) => {
        if (m.id !== matchId) return m
        if (m.teamA === teamId) {
          return { ...m, teamAArguments: args }
        }
        if (m.teamB === teamId) {
          return { ...m, teamBArguments: args }
        }
        return m
      }),
    }))
  },

  submitAIAnalysis: (matchId, analysis) => {
    set((state) => ({
      matches: state.matches.map((m) => {
        if (m.id !== matchId) return m
        if (m.teamA === analysis.teamId) {
          return { ...m, aiAnalysisA: analysis }
        }
        if (m.teamB === analysis.teamId) {
          return { ...m, aiAnalysisB: analysis }
        }
        return m
      }),
    }))
  },

  submitJudgeScore: (matchId, score) => {
    set((state) => ({
      matches: state.matches.map((m) => {
        if (m.id !== matchId) return m
        const existingScores = m.judgeScores.filter((s) => s.judgeId !== score.judgeId)
        return { ...m, judgeScores: [...existingScores, score] }
      }),
    }))
  },

  submitAudienceVote: (matchId, playerId, votedFor) => {
    set((state) => ({
      matches: state.matches.map((m) => {
        if (m.id !== matchId) return m
        const existingVotes = m.audienceVotes.filter((v) => v.playerId !== playerId)
        return { ...m, audienceVotes: [...existingVotes, { playerId, votedFor }] }
      }),
    }))
  },

  calculateMatchResult: (matchId) => {
    const { matches, teams } = get()
    const match = matches.find((m) => m.id === matchId)
    if (!match) return

    // Calculate judge average (70%)
    const judgeScoreA = match.judgeScores.reduce((sum, s) => sum + s.teamAScore, 0) / (match.judgeScores.length || 1)
    const judgeScoreB = match.judgeScores.reduce((sum, s) => sum + s.teamBScore, 0) / (match.judgeScores.length || 1)

    // Calculate audience percentage (30%)
    const totalAudienceVotes = match.audienceVotes.length || 1
    const votesForA = match.audienceVotes.filter((v) => v.votedFor === match.teamA).length
    const votesForB = match.audienceVotes.filter((v) => v.votedFor === match.teamB).length
    const audiencePercentA = (votesForA / totalAudienceVotes) * 100
    const audiencePercentB = (votesForB / totalAudienceVotes) * 100

    // Final score: 70% judge + 30% audience (normalized to 10)
    const finalScoreA = judgeScoreA * 0.7 + (audiencePercentA / 10) * 0.3
    const finalScoreB = judgeScoreB * 0.7 + (audiencePercentB / 10) * 0.3

    const winner = finalScoreA > finalScoreB ? match.teamA : match.teamB

    set((state) => ({
      matches: state.matches.map((m) => {
        if (m.id !== matchId) return m
        return { ...m, winner, completed: true }
      }),
      teams: {
        ...state.teams,
        [match.teamA]: {
          ...state.teams[match.teamA],
          totalScore: state.teams[match.teamA].totalScore + finalScoreA,
          matchesPlayed: state.teams[match.teamA].matchesPlayed + 1,
        },
        [match.teamB]: {
          ...state.teams[match.teamB],
          totalScore: state.teams[match.teamB].totalScore + finalScoreB,
          matchesPlayed: state.teams[match.teamB].matchesPlayed + 1,
        },
      },
    }))
  },

  startTimer: (seconds) => {
    set({
      timer: {
        isRunning: true,
        seconds,
        totalSeconds: seconds,
      },
    })
  },

  tickTimer: () => {
    set((state) => {
      if (!state.timer.isRunning || state.timer.seconds <= 0) {
        return { timer: { ...state.timer, isRunning: false } }
      }
      return {
        timer: { ...state.timer, seconds: state.timer.seconds - 1 },
      }
    })
  },

  stopTimer: () => {
    set((state) => ({
      timer: { ...state.timer, isRunning: false },
    }))
  },

  resetTimer: () => {
    set({
      timer: { isRunning: false, seconds: 0, totalSeconds: 0 },
    })
  },

  nextRound: () => {
    set((state) => ({
      currentTopicId: null,
      currentMatchId: null,
      votes: [],
    }))
  },

  reset: () => set(initialState),
}))
