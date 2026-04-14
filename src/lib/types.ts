// Mini Debate Arena - Type Definitions

export type GamePhase =
  | 'lobby'           // 等待登入
  | 'bracket-reveal'  // 抽配對 + 顯示 3 場排程
  | 'topic-reveal'    // 抽題揭曉
  | 'voting'          // 全班投票立場
  | 'matchup-reveal'  // 配對揭曉
  | 'preparation'     // 準備時間
  | 'debate'          // 辯論中
  | 'audience-vote'   // 觀眾投票
  | 'scoring'         // 評審評分
  | 'result'          // 本輪結果
  | 'leaderboard'     // 排行榜
  | 'final-awards'    // 頒獎

export type TopicCategory =
  | 'global-politics'     // Global politics
  | 'everyday-life'       // Everyday life
  | 'history-heritage'    // History & heritage
  | 'tech-future'         // Tech & future
  | 'travel-etiquette'    // Travel & etiquette

export type TopicDifficulty = 1 | 2 | 3

export interface Topic {
  id: string
  question: string
  category: TopicCategory
  difficulty: TopicDifficulty
}

export interface Team {
  id: string
  name: string       // e.g., "Group 1", "Group 2"
  members: Player[]
  totalScore: number
  matchesPlayed: number
}

export interface Player {
  id: string
  name: string
  teamId: string
}

export interface Vote {
  playerId: string
  teamId: string
  stance: 'agree' | 'disagree' | 'not-sure'
}

export interface Match {
  id: string
  round: number
  topicId: string
  teamA: string       // team id
  teamB: string       // team id
  teamAStance: 'agree' | 'disagree'
  teamBStance: 'agree' | 'disagree'
  teamAArguments: string[]
  teamBArguments: string[]
  aiAnalysisA?: AIAnalysis
  aiAnalysisB?: AIAnalysis
  aiAnalysisAJudge2?: AIAnalysis
  aiAnalysisBJudge2?: AIAnalysis
  judgeScores: JudgeScore[]
  audienceVotes: AudienceVote[]
  winner?: string     // team id
  completed: boolean
}

export interface AIAnalysis {
  teamId: string
  score: number       // 1-10
  commentary: string  // 6-8 sentences, conversational
  perspective?: 'logic' | 'delivery'  // which lens this analysis used
}

export interface JudgeScore {
  judgeId: 'judge1' | 'judge2'
  teamAScore: number  // 1-10
  teamBScore: number  // 1-10
}

export interface AudienceVote {
  playerId: string
  votedFor: string    // team id
}

export interface LiveArgument {
  id: string
  matchId: string
  playerId: string
  teamId: string
  playerName?: string
  content: string
  createdAt: number
}

export interface MatchResult {
  matchId: string
  teamAFinalScore: number
  teamBFinalScore: number
  winner: string
  breakdown: {
    judgeScoreA: number
    judgeScoreB: number
    audiencePercentA: number
    audiencePercentB: number
  }
}

export interface GameState {
  phase: GamePhase
  currentRound: number
  totalRounds: number
  topics: Topic[]
  currentTopicId: string | null
  teams: Record<string, Team>
  players: Record<string, Player>
  votes: Vote[]
  matches: Match[]
  currentMatchId: string | null
  timer: {
    isRunning: boolean
    seconds: number
    totalSeconds: number
  }
}

// Category display info
export const CATEGORY_INFO: Record<TopicCategory, { label: string; labelZh: string }> = {
  'global-politics': { label: 'Global Politics', labelZh: '國際政治' },
  'everyday-life': { label: 'Everyday Life', labelZh: '日常生活' },
  'history-heritage': { label: 'History & Heritage', labelZh: '歷史文化' },
  'tech-future': { label: 'Tech & Future', labelZh: '科技未來' },
  'travel-etiquette': { label: 'Travel & Etiquette', labelZh: '旅遊禮儀' },
}

// Pre-defined topics
// Each question is phrased so that both AGREE and DISAGREE have strong,
// balanced arguments — no loaded words ("forced", "banned", "disrespectful")
// that push either side into a weaker position.
export const TOPICS: Topic[] = [
  // Difficulty 1 (Warm-up) — everyday situations with room for both sides
  {
    id: 'topic-1',
    question: 'When dining with a foreign host, guests should finish everything on their plate.',
    category: 'everyday-life',
    difficulty: 1,
  },
  {
    id: 'topic-2',
    question: 'Tipping should be included in the price, not left to customers to decide.',
    category: 'travel-etiquette',
    difficulty: 1,
  },
  {
    id: 'topic-3',
    question: 'Celebrities touring abroad should learn basic greetings in the host country\'s language.',
    category: 'everyday-life',
    difficulty: 1,
  },
  {
    id: 'topic-4',
    question: 'Tourists should follow strict dress codes when visiting religious sites abroad.',
    category: 'history-heritage',
    difficulty: 1,
  },

  // Difficulty 2 (Medium) — genuinely two-sided policy questions
  {
    id: 'topic-5',
    question: 'Governments should be allowed to restrict foreign social media apps on national security grounds.',
    category: 'global-politics',
    difficulty: 2,
  },
  {
    id: 'topic-6',
    question: 'Schools should still require foreign language classes in the age of AI translation.',
    category: 'tech-future',
    difficulty: 2,
  },
  {
    id: 'topic-7',
    question: 'Cities like Kyoto and Venice should charge higher fees to tourists to limit overcrowding.',
    category: 'travel-etiquette',
    difficulty: 2,
  },
  {
    id: 'topic-8',
    question: 'Adapting traditional cuisines for foreign markets is cultural exchange, not disrespect.',
    category: 'everyday-life',
    difficulty: 2,
  },

  // Difficulty 3 (Challenge) — harder ethical tradeoffs, still balanced
  {
    id: 'topic-9',
    question: 'Museums should return culturally significant artifacts to their countries of origin.',
    category: 'global-politics',
    difficulty: 3,
  },
  {
    id: 'topic-10',
    question: 'Artificial intelligence should be regulated by an international treaty, like nuclear weapons.',
    category: 'tech-future',
    difficulty: 3,
  },
  {
    id: 'topic-11',
    question: 'Economic power matters more than cultural influence in shaping global affairs today.',
    category: 'history-heritage',
    difficulty: 3,
  },
  {
    id: 'topic-12',
    question: 'Wealthy countries have a duty to accept refugees from climate-affected nations.',
    category: 'global-politics',
    difficulty: 3,
  },
]
