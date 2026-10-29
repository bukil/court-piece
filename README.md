# CODEBASE — Multiplayer Court Piece (Single Sir)

CODEBASE is a complete, fast, and responsive real-time multiplayer web application for playing **Court Piece (Single Sir)** with exactly four players in two fixed teams of two.

Built with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **Firebase (Cloud Firestore & Authentication)**, with full offline/local multi-tab simulator support via the browser's `BroadcastChannel` API.

---

## 🎴 Confirmed Game Rules (Single Sir Court Piece)

### 1. Players & Teams
- Exactly **four players** in **two teams of two**:
  - **Team Alpha**: Seats 1 & 3 (South & North — partners sit opposite each other).
  - **Team Beta**: Seats 2 & 4 (West & East — partners sit opposite each other).
- Seat assignments are stable for the entire match.
- The local player's cards always appear at the **bottom** of the table.

### 2. Deck & Staged Dealing (5-4-4)
- **Standard 52-card deck**, no jokers.
- Ranks from high to low: **Ace, King, Queen, Jack, 10, 9, 8, 7, 6, 5, 4, 3, 2**.
- **Stage 1 Deal**: Every player receives their initial **5 cards**. The remaining 32 cards are stored in server reserve.
- **Trump Selection**: The Trump Caller (player clockwise from the dealer) chooses **Hearts, Diamonds, Clubs, or Spades** based on their first 5 cards.
- **Stage 2 Deal**: The remaining 32 cards are dealt (4 cards each, then 4 cards each), giving every player exactly **13 cards**.
- All cards are distributed exactly once with zero duplicates.

### 3. Trick Play (Single Sir)
- **First Trick Lead**: The Trump Caller leads the first card.
- **Mandatory Follow-Suit**: If a player holds one or more cards of the led suit, they **must follow suit**.
- **Ruffing & Discarding**: If void in the led suit, a player may play any card (including trump).
- **Trick Winner Resolution**:
  - If any trump cards are played, the **highest-ranking trump** wins the trick.
  - If no trump cards are played, the **highest card of the led suit** wins.
  - Non-trump off-suit cards cannot win.
- **Immediate Collection**: Under Single Sir rules, the winning player collects the 4 cards immediately and leads the next trick.

### 4. Deal Completion & Match Scoring
- The first team to win **7 tricks** wins the deal immediately.
- The winning team earns **1 match point**; the losing team earns 0 points (no extra points for 7-0).
- **Match Target**: The default match target is **7 match points**. The first team to reach 7 match points wins the championship.
- **Dealer Rotation**:
  - If the dealer's team wins the deal, the dealer retains the deal.
  - If the dealer's team loses the deal, the deal passes clockwise to the next player.

---

## ⚡ Instant Multi-Tab Testing (Zero-Config)

You can play a full 4-player game across 4 browser tabs or windows **right now** without running any external backend:

```bash
# Start Vite development server
npm run dev
```

1. Open `http://localhost:5173` in **Tab 1**: Enter a nickname and click **Create New Game Room**.
2. Copy the 6-character room code (e.g., `CB7842`).
3. Open 3 additional browser tabs at `http://localhost:5173`.
4. Enter nicknames for Players 2, 3, and 4, paste the room code, and click **Join Room**.
5. When all 4 seats are occupied, Tab 1 (Host) clicks **Start Game**.
6. The Trump Caller sees their initial 5 cards and selects Trump (♠, ♥, ♦, ♣).
7. The remaining cards are dealt, and trick-taking gameplay proceeds in real time!

---

## 🏛️ Architecture & Firestore Data Model

### Seating Topology
```
                  Seat 2 (North)
             [Teammate - Team Alpha]
                        ▲
                        │
Seat 1 (West) ◄─── Table Center ───► Seat 3 (East)
[Opponent - Beta]   (Trick Area)    [Opponent - Beta]
                        │
                        ▼
                  Seat 0 (South)
            [Local Player - Team Alpha]
```

### Firestore Schema
```
rooms/{roomId}                          [Public Room Document]
  ├── id: string
  ├── code: string                      (6-character join code)
  ├── status: 'waiting' | 'starting' | 'trump_selection' | 'playing' | 'deal_complete' | 'match_complete'
  ├── hostPlayerId: string
  ├── seats: [
  │     { id, nickname, seatIndex: 0, teamId: 0, isHost: true, isConnected: true },
  │     { id, nickname, seatIndex: 1, teamId: 1, isHost: false, isConnected: true },
  │     { id, nickname, seatIndex: 2, teamId: 0, isHost: false, isConnected: true },
  │     { id, nickname, seatIndex: 3, teamId: 1, isHost: false, isConnected: true }
  │   ]
  ├── gameState: {
  │     currentDeal: number,
  │     dealerSeatIndex: 0..3,
  │     trumpCallerSeatIndex: 0..3,
  │     trumpSuit: 'spades' | 'hearts' | 'diamonds' | 'clubs' | null,
  │     currentTurnSeatIndex: 0..3,
  │     currentTrick: { leadSuit, cards: [{ playerId, seatIndex, card, playedAt }] },
  │     completedTricks: Trick[],
  │     teamDealScores: [{ tricksWon: number }, { tricksWon: number }],
  │     matchScores: [number, number],
  │     matchTarget: 7,
  │     remainingCardCounts: [13, 13, 13, 13],
  │     status: RoomStatus,
  │     dealWinnerTeamId?: 0 | 1,
  │     matchWinnerTeamId?: 0 | 1,
  │     version: number
  │   }
  │
  ├── serverData/reserve                [Server Reserve (Stage 2 Deck - 32 cards)]
  │     └── cards: Card[]
  │
  └── privateHands/{playerId}           [Private Hand Subcollection - STRICTLY PROTECTED]
        ├── playerId: string
        └── cards: Card[]               (Accessible ONLY to request.auth.uid == playerId)
```

---

## 🔒 Security Rules & Threat Model

Located in [`firestore.rules`](file:///Users/mukil/my-card-game/firestore.rules):
- **Private Hand Isolation**: `allow read: if request.auth != null && request.auth.uid == playerId;`. Opponents and teammates cannot view other players' cards.
- **Seat Contention Prevention**: Firestore transactions (`runTransaction`) prevent race conditions when two players attempt to claim the final seat.
- **Capacity Limits**: Full rooms (4/4 players) automatically reject further join requests.
- **Host Privileges**: Only the room host can start or restart games.

---

## 🧪 Automated Testing

A 29-test automated suite using **Vitest**:

```bash
# Run tests
npm test
```

### Coverage Highlights:
- **`tests/unit/deck.test.ts`**: Standard 52-card deck generation, suits, ranks, hand sorting.
- **`tests/unit/courtPieceEngine.test.ts`**: Staged 5-4-4 dealing, trump card priority over led suit, higher trump over lower trump, follow-suit validation, void-in-suit ruffing, immediate deal win at 7 tricks, 1 match point awarded, match completion at target.
- **`tests/integration/roomLifecycle.test.ts`**: Room creation, 4-seat allocation, 5th-player rejection, seat preservation on reconnect, host-only start validation, trump caller authorization.
- **`tests/integration/cardPlay.test.ts`**: Clockwise turn enforcement, out-of-turn rejection, 4-card Single Sir trick resolution, immediate trick collection, and client convergence.

---

## 🚀 Live Firebase Deployment (`courtpiece-ab2f3`)

The application is pre-configured with the project credentials for `courtpiece-ab2f3`:

```bash
# 1. Build the production client
npm run build

# 2. Deploy to Firebase Hosting and Firestore
firebase deploy
```

---

## 📦 Tech Stack

- **Framework**: React 19, TypeScript, Vite 8, Tailwind CSS v4
- **Real-Time Data**: Cloud Firestore, Firebase Authentication, BroadcastChannel Multi-Tab Simulator
- **Audio Feedback**: Procedural Web Audio API sound synthesizer
- **Testing**: Vitest 5
- **Linter**: Oxlint
