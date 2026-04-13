-- Mini Debate Arena Schema

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL DEFAULT 'lobby',
  current_round INTEGER NOT NULL DEFAULT 0,
  total_rounds INTEGER NOT NULL DEFAULT 3,
  current_topic_id TEXT,
  current_match_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table (stance votes on topics)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  stance TEXT NOT NULL CHECK (stance IN ('agree', 'disagree', 'not-sure')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, player_id, topic_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  topic_id TEXT NOT NULL,
  team_a TEXT REFERENCES teams(id),
  team_b TEXT REFERENCES teams(id),
  team_a_stance TEXT NOT NULL DEFAULT 'agree',
  team_b_stance TEXT NOT NULL DEFAULT 'disagree',
  team_a_arguments JSONB DEFAULT '[]'::jsonb,
  team_b_arguments JSONB DEFAULT '[]'::jsonb,
  ai_analysis_a JSONB,
  ai_analysis_b JSONB,
  winner TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge scores table
CREATE TABLE IF NOT EXISTS judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL,
  team_a_score INTEGER NOT NULL CHECK (team_a_score BETWEEN 1 AND 10),
  team_b_score INTEGER NOT NULL CHECK (team_b_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, judge_id)
);

-- Audience votes table
CREATE TABLE IF NOT EXISTS audience_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  voted_for TEXT REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_votes ENABLE ROW LEVEL SECURITY;

-- Policies: Allow anonymous access for this game (no auth required)
CREATE POLICY "Allow all access to game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to votes" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to judge_scores" ON judge_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to audience_votes" ON audience_votes FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE judge_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE audience_votes;
