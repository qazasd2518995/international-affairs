// Mini Debate Arena - Type Definitions

export type GamePhase =
  | 'lobby'           // 等待登入
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
  judgeScores: JudgeScore[]
  audienceVotes: AudienceVote[]
  winner?: string     // team id
  completed: boolean
}

export interface AIAnalysis {
  teamId: string
  score: number       // 1-10
  commentary: string  // 6-8 sentences, conversational
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
export const TOPICS: Topic[] = [
  // Difficulty 1 (Warm-up)
  {
    id: 'topic-1',
    question: 'Should you always finish everything on your plate when eating at a foreign host\'s home?',
    category: 'everyday-life',
    difficulty: 1,
  },
  {
    id: 'topic-2',
    question: 'Is tipping culture in the US unfair to tourists who don\'t know the rules?',
    category: 'travel-etiquette',
    difficulty: 1,
  },
  {
    id: 'topic-3',
    question: 'Should K-pop idols be forced to learn the language of every country they tour in?',
    category: 'everyday-life',
    difficulty: 1,
  },
  {
    id: 'topic-4',
    question: 'Is it rude to wear shorts when visiting temples or churches abroad?',
    category: 'history-heritage',
    difficulty: 1,
  },

  // Difficulty 2 (Medium)
  {
    id: 'topic-5',
    question: 'Should TikTok be banned in your country, or is it just political theatre?',
    category: 'global-politics',
    difficulty: 2,
  },
  {
    id: 'topic-6',
    question: 'If Google Translate is "good enough," are foreign language classes a waste of time?',
    category: 'tech-future',
    difficulty: 2,
  },
  {
    id: 'topic-7',
    question: 'Should tourists be charged double for visiting over-crowded places like Kyoto or Venice?',
    category: 'travel-etiquette',
    difficulty: 2,
  },
  {
    id: 'topic-8',
    question: 'Is it cultural appreciation or appropriation when foreign chefs "fix" Asian food for Western taste?',
    category: 'everyday-life',
    difficulty: 2,
  },

  // Difficulty 3 (Challenge)
  {
    id: 'topic-9',
    question: 'Should Western museums return looted artifacts even if they preserve them better?',
    category: 'global-politics',
    difficulty: 3,
  },
  {
    id: 'topic-10',
    question: 'If AI deepfakes can start wars, should the UN regulate AI like nuclear weapons?',
    category: 'tech-future',
    difficulty: 3,
  },
  {
    id: 'topic-11',
    question: 'Is Taiwan\'s international status a "One China" issue, or a democracy issue the world avoids?',
    category: 'history-heritage',
    difficulty: 3,
  },
  {
    id: 'topic-12',
    question: 'Is "authentic food" a meaningful concept, or just marketing for tourists?',
    category: 'everyday-life',
    difficulty: 3,
  },
]
