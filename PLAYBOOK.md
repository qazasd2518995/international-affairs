# Mini Debate Arena — 完整活動企劃書

## 活動簡介

**活動名稱**：Mini Debate Arena
**副標題**：Vote. Prepare. Debate. Score.
**時長**：12-15 分鐘（彈性超時）
**對象**：國際事務課程 ~35 人班級
**形式**：小組辯論競賽 + App 互動 + AI 輔助評審

---

## 四人分工

| 角色 | 姓名 | 職責 |
|-----|------|------|
| **App Guide / Tech** | 你 | 操作 app、引導登入、顯示即時畫面 |
| **Host / MC** | 隊友 A | 開場、帶氣氛、提問、控時 |
| **Judge 1** | 隊友 B | 亮牌、給短評 |
| **Judge 2** | 隊友 C | 亮牌、補充短評、宣布勝者 |

---

## App 使用說明

### 網址結構
- **學生端**：`<your-url>/?session=XXXX`（掃 QR code）
- **主持端**：`<your-url>/admin`
- **評審端**：`<your-url>/judge?session=XXXX`
- **投影畫面**：`<your-url>/display?session=XXXX`

### 賽前準備
1. 你打開 `/admin`，點 **CREATE NEW GAME**
2. 系統生成 session ID，URL 更新
3. 你打開 `/display?session=XXXX` 投影到大螢幕（顯示 QR code）
4. 兩位評審打開 `/judge?session=XXXX`，選擇 Judge 1 或 Judge 2

---

## 詳細流程（15 分鐘版本）

### 🎬 階段 1 — 開場 + 登入（2 分鐘）

**Host（MC）**：
> "Hello everyone! Welcome to **Mini Debate Arena** — where we test who can think fast and speak smart under pressure!
>
> Tonight, we have three rounds, twelve possible topics, and only the sharpest team will be crowned champion.
>
> Before we start — please take out your phones, scan the QR code on the screen, enter your name, and pick your group. You have 60 seconds. GO!"

**App Guide（你）**：
- 切到 `/display` 大螢幕顯示 QR code
- 走到最後一排確認大家都看得到
- 喊："If anyone's stuck, raise your hand!"
- 看到 29 人全部進來後，跟 Host 點頭

**Host**：
> "Alright, looks like all 29 players are in! Let's get this started."

**你（App Guide）** 按 **START GAME** → phase 進入 `topic-reveal`

---

### 🎲 階段 2 — 第一題：抽題 + 全班投票（2 分鐘）

**Host**：
> "Round One! Let's see what the universe has for us tonight... App Guide, draw a topic!"

**你（App Guide）**：
- 在 admin 頁面點題目卡片 → 觸發抽題動畫
- 大螢幕會看到難度 ⭐ 和分類浮現

**Host**（看到題目後）：
> "Oh! A [CATEGORY] topic with [DIFFICULTY] star difficulty!
>
> The question is: *[READ THE QUESTION OUT LOUD]*
>
> Everyone — use your phone to vote: Agree, Disagree, or Not Sure. You have 30 seconds!"

**你（App Guide）** 點 **START VOTING** → 學生端出現投票按鈕

大螢幕即時顯示：Agree / Disagree / Not Sure 比例條

**Host**（倒數）：
> "5... 4... 3... 2... 1... Voting closed!"

---

### ⚔️ 階段 3 — 配對揭曉（30 秒）

**你（App Guide）** 點 **REVEAL MATCHUPS** → 大螢幕跑揭曉動畫

**Host**（戲劇化）：
> "Based on how polarized you all are, the system has picked the juiciest matchup for Round One...
>
> In this corner — *[TEAM A NAME]* — arguing AGREE!
>
> And in this corner — *[TEAM B NAME]* — arguing DISAGREE!
>
> Let's see if your assigned stance matches your heart... or if you can defend what you don't believe!"

---

### 📝 階段 4 — 準備時間（90 秒）

**你（App Guide）** 點 **START PREPARATION** → 計時器開始

**Host**：
> "90 seconds on the clock! Teams A and B, open your phones — you'll see an argument input box.
>
> Type your top 1-2 reasons. You can read from your screen when you present, so write something you can actually say!
>
> The rest of you — whisper-support your friends or think of a killer question."

**背景**：
- AI 在背景讀取學生輸入的論點
- 2 秒內生成分數和評語
- 只傳給 Judge 1 和 Judge 2 的螢幕（大螢幕看不到）

---

### 🎤 階段 5 — 辯論（2 分鐘）

**你（App Guide）** 點 **START DEBATE**

**Host**：
> "Time's up! Teams, come up to the front! [TEAM A], you're on the left. [TEAM B], you're on the right.
>
> Here's how it goes:
> - [TEAM A] opens with 20 seconds
> - [TEAM B] opens with 20 seconds
> - I'll throw one challenging question — each team has 15 seconds to respond
> - Then judges decide.
>
> Ready? [TEAM A], your 20 seconds starts... NOW!"

**計時流程**：
1. Team A 開場（20s）
2. Team B 開場（20s）
3. Host challenge（15s 提問 + 準備）
4. Team A 回應（15s）
5. Team B 回應（15s）

**Host 範例 challenge（可根據題目臨場發揮）**：
> "Okay, quick question to both teams: If you had to convince a 10-year-old of your position using ONE example, what would it be?"

---

### 🗳️ 階段 6 — 觀眾投票（30 秒）

**你（App Guide）** 點 **END DEBATE → AUDIENCE VOTE**

**Host**：
> "Audience! It's your turn — whose argument actually convinced you?
>
> Open your phone, pick Team A or Team B. You have 20 seconds.
>
> Note: If you're on Team A or Team B, you can't vote — sorry, no rigging tonight."

大螢幕：即時顯示投票比例條

---

### ⚖️ 階段 7 — 評審評分（30 秒）

**你（App Guide）** 點 **SHOW JUDGE SCORES**

**Host**：
> "Judges — what did you think?"

**Judge 1 和 Judge 2**：
- 看自己螢幕上的 AI 評語（6-8 句）+ 建議分數
- 在 slider 上調整自己的分數（1-10）
- 點 **SUBMIT**
- 然後各講一句短評：

**Judge 1（範例）**：
> "Team A had a really clear position — I loved that example about airport security. But the second point felt a bit rushed. 7 points from me."

**Judge 2（範例）**：
> "Team B's rebuttal was sharper. They actually listened and responded. Strong 8 from me."

---

### 🏆 階段 8 — 結果揭曉（30 秒）

**你（App Guide）** 點 **REVEAL RESULT**

大螢幕：
- 彩帶動畫
- 金色「🏆 [WINNER] 🏆」標題
- 分數細節（評審 70% + 觀眾 30%）

**Host**：
> "And the winner of Round 1 is... *[WINNER]*! Let's give them a round of applause!"

---

### 🔁 階段 9 — 下一輪（重複階段 2-8）

**Round 2** 和 **Round 3** 重複相同流程：
- 抽新題 → 投票 → 配對 → 準備 → 辯論 → 投票 → 評分 → 結果

**時間控制**：如果超過 12 分鐘，精簡準備時間到 60 秒

---

### 🎉 階段 10 — 最終頒獎（1 分鐘）

**你（App Guide）** 在最後一輪結束後，點 **FINAL AWARDS**

**Host**：
> "Alright, the moment we've all been waiting for — the FINAL LEADERBOARD!"

大螢幕：排行榜揭曉 + 頒獎動畫

**Judge 2**（正式宣布）：
> "Tonight's CHAMPION of Mini Debate Arena is... drumroll... *[WINNER]*! Congratulations!
>
> Runner-up: *[2ND]*
>
> Most Improved: *[LAST PLACE TEAM]* — great effort everyone!"

**Host（結尾）**：
> "Thanks for being such amazing debaters tonight. Remember — good debate isn't about winning, it's about thinking sharper and listening harder. Give yourselves a round of applause!"

---

## 評審評分標準

每項 1-3 分（總分 1-10）：

### 1. Clarity（清晰度）
- 有沒有清楚講出立場？
- 論點結構清楚嗎？

### 2. Support（支撐力）
- 有沒有理由支撐立場？
- 例子或證據有說服力嗎？

### 3. Response（回應力）
- 有沒有回應對方的論點？
- 有沒有正面回答 Host 的挑戰？

**AI 會預先幫評審分析好，評審只要參考 AI 意見，快速調整自己的分數。**

---

## 緊急備案

### 如果 AI 沒回應
- 評審可以完全忽略 AI，用自己判斷
- App 仍可正常運作

### 如果 Supabase 連線失敗
- 改用現場口頭投票（舉手）
- 配對用現場抽籤

### 如果時間不夠
- 跳過觀眾投票（改用評審決定）
- 精簡 Host 開場白

### 如果某組人不夠
- 允許跨組協助（鬆散規則）

---

## 技術 Stack

- **前端**：Next.js 16 + TypeScript + Tailwind CSS
- **動畫**：Framer Motion
- **資料庫**：Supabase (PostgreSQL) + Realtime
- **AI**：Claude Haiku 4.5 (Anthropic API)
- **部署**：Vercel

---

## 設定清單（賽前）

- [ ] 確認 Supabase 連線正常
- [ ] 將 `ANTHROPIC_API_KEY` 加到 `.env.local`（給 AI 評審輔助）
- [ ] 部署到 Vercel（或確保 tunnel 穩定）
- [ ] 大螢幕測試 `/display` 頁面
- [ ] 四人裝置都能連上（一部 admin、兩部 judge、一部投影）
- [ ] 測試完整流程一次
- [ ] 準備麥克風（Host 用）
- [ ] 準備兩張紙質亮牌（備用）

---

## 亮點 / 賣點（給老師打分看）

1. **自研互動式 Web App** — 不是用 Slido/Mentimeter，全部自己寫
2. **即時同步** — 29 人同步投票，資料即時更新
3. **AI 輔助評審** — Claude Haiku 預先生成評語，評審壓力小
4. **電視節目級設計** — 動畫、音效、戲劇感揭曉
5. **公平機制** — 每組至少參賽一次，立場由全班投票決定
6. **結合課程概念** — 用到 polite probing、story arc、cross-cultural communication 等 Weeks 1-7 技巧
