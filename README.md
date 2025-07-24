# WordDash: Real-time Team Building Game

WordDash is a real-time multiplayer web game designed to help remote teams engage in fun, fast-paced team-building exercises. Each player must come up with answers for given categories, starting with a random letter, before time runs out. After submission, team members vote on the creativity and validity of answers, leading to a dynamic leaderboard.

<img width="500" height="900" alt="Screenshot 2025-07-24 at 16 18 14" src="https://github.com/user-attachments/assets/4cfc1943-a4e3-458d-8c01-bd8f1217c675" />

<img width="500" height="900" alt="Screenshot 2025-07-24 at 16 22 47" src="https://github.com/user-attachments/assets/c3c3b3b4-6b0f-47b9-8bb2-5ef5654edeb2" />

<img width="500" height="900" alt="Screenshot 2025-07-24 at 16 23 45" src="https://github.com/user-attachments/assets/4dd60223-7b45-423c-8c15-fa559340a99a" />

---

## Problem Statement

Remote teams often struggle with engagement and team cohesion due to the lack of in-person interaction. WordDash addresses this by providing a quick, browser-based multiplayer game where teams can compete and collaborate in real-time, and no setup required.

---

## Tech Stack

### **Frontend**
- **React** – Component-based UI with stateful logic for gameplay.
- **React Router** – Handles game room navigation and results flow.
- **Tailwind CSS** – Custom retro-inspired UI with responsive design.
- **Socket.io-client** – Real-time communication with the backend.

### **Backend**
- **Node.js + Express** – RESTful endpoints for room management.
- **Socket.io (WebSockets)** – Real-time synchronisation of game state across players.
- **In-memory Room Store** – Lightweight storage of player state, categories, and answers.

---

## Core Features

- **Real-time Multiplayer** – Sockets keep all players synced (game state, answers, votes).
- **Dynamic Game Flow** – Game creator controls round progression and leaderboard display.
- **Validation** – Answers must start with the round’s random letter.
- **Voting System** – Players vote on answers to determine points.

---

## Future Improvements

1. **AWS Deployment**  

2. **Authentication and Accounts for persistent leaderboards and player profiles**  

3. **Database Integration**  

4. **Scalable Game Rooms**

5. **Cover all edge cases and testing**

---

## Running Locally

```
# Clone repo
git clone [https://github.com/anitapercival/word-dash-game.git](https://github.com/anitapercival/word-dash-game.git)

# Backend
cd worddash-backend
npm install
npm run dev

# Frontend
cd worddash-client
npm install
npm run dev
