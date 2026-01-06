# Live Match Scoring Engine - Page 4

## Overview
This is the **Live Match Scoring Engine** (Page 4) of a cricket match hosting platform. It's the **ONLY** place where match data is mutated - all other pages are read-only and consume the data generated here.

## 🎯 Core Features

### ✅ Button-Only Interaction
- No dropdowns or select inputs anywhere
- Every action is a button click
- Clean, intuitive interface

### ⚡ Instant Ball Commit
- No submit/save button required
- Clicking an event button commits a ball instantly
- Every ball update is atomic
- Real-time score updates

### 🔄 Undo Functionality
- Single undo button reverses exactly one committed ball
- Uses full-state snapshot restore
- Disabled when no undo history or match completed

### 📊 Automatic Calculations
- Strike rate, economy, overs calculated automatically
- Never input manually
- All stats derived ball-by-ball

### 💬 Commentary System
- Auto-generated for every ball
- Multiple variants per event type
- Randomly selected and stored once
- Never regenerated

## 🏗️ Architecture

### Data Flow
```
User Click → Commit Ball → Update State → Generate Commentary → Save to JSON
```

### File Structure
```
/app/frontend/
├── public/
│   ├── ongoingMatch.json      # Current match state
│   ├── playedMatches.json     # Completed matches
│   └── sampleTeams.json       # Team and player data
├── src/
│   ├── pages/
│   │   └── LiveScoring.jsx    # Main scoring interface
│   └── utils/
│       ├── commentary.js       # Commentary generation
│       └── matchUtils.js       # Helper functions
```

## 🎮 How to Use

### 1. Match Header (Read-Only)
Displays:
- Team names
- Current innings
- Current score & overs
- Match status (Live/Completed)
- Venue, date, time

### 2. Active Player Controls
Admin selects via buttons:
- **Striker** - Currently facing batsman
- **Non-striker** - Batsman at other end
- **Current bowler** - Bowling this over

Players change on:
- Wicket (new batsman selection)
- Over completion (bowler rotation)
- Innings change

### 3. Ball Event Panel

#### A. Context Buttons (DO NOT COMMIT)
**Shot Types:**
- Drive, Pull, Cut, Sweep, Straight, Lofted, Defensive, Other

**Areas:**
- Cover, Square Leg, Point, Fine Leg, Long On, Long Off, Mid Off, Mid Wicket

These buttons only set temporary state and reset after each committed ball.

#### B. Commit Buttons (INSTANT COMMIT)

**Runs:**
- 0 (Dot ball)
- 1, 2, 3 (Singles/Doubles/Triples)
- 4, 6 (Boundaries)

**Extras:**
- Wide (adds 1 run, not a legal delivery)
- No Ball (adds 1 run, not a legal delivery)
- Bye (runs off keeper, legal delivery)
- Leg Bye (runs off pads, legal delivery)

**Wickets:**
- Bowled
- Caught
- LBW
- Run Out
- Stumped
- Hit Wicket

## ⚙️ Ball Processing Logic

On every commit click:

1. **Push to undo stack** - Save current state
2. **Build ball object** - Create immutable ball data
3. **Determine legal delivery** - Wide/No-ball are not legal
4. **Update scores:**
   - Total score
   - Extras breakdown
   - Batsman stats (runs, balls, 4s, 6s, SR)
   - Bowler stats (overs, runs, wickets, economy)
5. **Rotate strike** - If odd runs scored
6. **Handle over completion** - After 6 legal balls
7. **Handle wicket** - If dismissal occurred
8. **Generate commentary** - Auto-create ball description
9. **Append to innings** - Add ball to ball-by-ball array
10. **Check innings end** - 10 wickets or max overs
11. **Persist to JSON** - Save updated state
12. **Reset temp state** - Clear shot/area selection

## 📋 Match Rules

### Legal Deliveries
- Regular runs (0-6)
- Byes and Leg Byes
- Wickets

### Illegal Deliveries (Don't increment ball count)
- Wides
- No Balls

### Strike Rotation
- Automatic after odd runs (1, 3, 5)
- Manual swap at end of each over
- Reset to striker after wicket

### Over Completion
- After 6 legal deliveries
- Requires new bowler selection
- Strike rotates to other end

### Innings End Conditions
- 10 wickets fall
- Maximum overs completed (20 in T20)
- Manual "End Match" button

### Match Completion
- After both innings complete
- Result calculated automatically:
  - Team 1 won by X runs
  - Team 2 won by Y wickets
  - Match Tied

## 🎨 UI Theme
- **Primary Color:** Neon Blue/Cyan (#06B6D4)
- **Background:** Dark gradient (slate-900 to blue-950)
- **Design:** Clean, minimal, mobile-first
- **Style:** Modern cards with backdrop blur effects

## 🔧 Technical Details

### State Management
- React useState for local state
- localStorage for persistence (client-side)
- Full state snapshots in undo stack

### Data Persistence
All match data stored in browser localStorage:
- `ongoingMatch` - Current match state
- `playedMatches` - Array of completed matches

### Key Technologies
- React 19
- Tailwind CSS
- Shadcn/UI Components
- React Router DOM

## 📱 Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg
- Touch-friendly button sizes
- Optimized for all screen sizes

## 🚀 Getting Started

1. Navigate to `/live-scoring` route
2. Match loads with pre-configured teams
3. Select initial players (striker, non-striker, bowler)
4. Start scoring ball-by-ball
5. Use undo if needed
6. Complete match when done

## ✨ Key Benefits

1. **No Forms** - Pure button interactions
2. **Instant Feedback** - Real-time updates
3. **Error Prevention** - Atomic operations
4. **Easy Undo** - One-click reversal
5. **Complete Stats** - Auto-calculated metrics
6. **Rich Commentary** - Engaging ball descriptions
7. **Mobile Ready** - Works on all devices

## 🎯 Data Guarantees

- Strike rate, economy, overs are NEVER input manually
- All stats are derived ball-by-ball
- JSON structure is simple, flat, and readable
- Ball is the smallest immutable unit
- No partial updates possible
- Full state consistency maintained

## 🔮 Future Enhancements

Consider adding:
- Real-time sync with backend API
- Multiple match support
- Player statistics tracking
- Match highlights generation
- Share scorecard feature
- Export to PDF/CSV
- Live streaming integration
- Multi-device admin access

---

Built with ❤️ using React + Tailwind CSS
