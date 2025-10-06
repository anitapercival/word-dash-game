const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const PORT = process.env.PORT || 3000
const ROUND_TIME = 90

const rooms = {}

app.get('/', (req, res) => {
  res.send('Backend is running')
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('createRoom', ({ roomId, username }) => {
    if (rooms[roomId]) {
      socket.emit('error', 'Room already exists')
      return
    }
    rooms[roomId] = {
      players: [{ id: socket.id, name: username, ready: false }],
      gameStarted: false,
      creatorId: socket.id,
      currentLetter: '',
      categories: [],
      answers: {},
      categoryResults: [],
    }
    socket.join(roomId)
    socket.emit('roomCreated', roomId)
    io.to(roomId).emit('roomUpdate', rooms[roomId])
  })

  socket.on('joinRoom', ({ roomId, username }) => {
    if (!rooms[roomId]) {
      socket.emit('error', 'Room does not exist')
      return
    }

    const room = rooms[roomId]

    room.players.push({ id: socket.id, name: username, ready: false })
    socket.join(roomId)

    if (!room.answers) room.answers = {}
    if (!room.answers[socket.id]) room.answers[socket.id] = {}

    io.to(roomId).emit('roomUpdate', room)
  })

  socket.on('toggleReady', ({ roomId }) => {
    const room = rooms[roomId]
    if (!room) return
    const player = room.players.find((p) => p.id === socket.id)
    if (player) {
      player.ready = !player.ready
      io.to(roomId).emit('roomUpdate', room)
    }
  })

  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId]
    if (!room) return
    if (room.players.some((p) => !p.ready)) {
      socket.emit('error', 'Not all players are ready')
      return
    }

    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const categories = [
      'Animal',
      'Food',
      'Things you do at the gym',
      'Country',
      'Movie',
      'Color',
      'Book',
    ]

    room.gameStarted = true
    room.currentLetter = letter
    room.categories = categories
    room.answers = {}
    room.categoryResults = []

    io.to(roomId).emit('gameStarted', { letter, categories, roundTime: ROUND_TIME })
  })

  socket.on('getGameState', ({ roomId }) => {
    const room = rooms[roomId]
    if (!room) {
      socket.emit('error', 'Room does not exist')
      return
    }

    socket.emit('gameState', {
      gameStarted: room.gameStarted,
      letter: room.currentLetter,
      categories: room.categories,
      roundTime: ROUND_TIME,
    })
  })

  socket.on('submitAnswers', ({ roomId, letter, answers }) => {
    const room = rooms[roomId]
    if (!room) return

    if (!room.answers[socket.id]) {
      room.answers[socket.id] = {}
    }

    room.answers[socket.id] = {
      ...room.answers[socket.id],
      ...answers,
    }

    const allSubmitted = room.players.every((p) => room.answers[p.id])
    if (allSubmitted) {
      const categoryResults = room.categories.map((category) => {
        const answersForCategory = room.players.map((player) => ({
          playerId: player.id,
          answer: room.answers[player.id]?.[category] || '',
          votes: 0,
        }))
        return { category, answers: answersForCategory }
      })

      room.categoryResults = categoryResults

      io.to(roomId).emit('submittedAnswers', categoryResults)
    }
  })

  socket.on('vote', ({ roomId, categoryIndex, playerId, type }) => {
    const room = rooms[roomId]
    if (!room) return

    const category = room.categoryResults[categoryIndex]
    if (!category) return

    const answer = category.answers.find((a) => a.playerId === playerId)
    if (!answer) return

    answer.votes += type === 'up' ? 1 : -1

    io.to(roomId).emit('voteUpdate', {
      categoryIndex,
      playerId,
      votes: answer.votes,
    })
  })

  socket.on('nextCategory', ({ roomId, nextIndex }) => {
    const room = rooms[roomId]
    if (!room || socket.id !== room.creatorId) return
    io.to(roomId).emit('advanceCategory', nextIndex)
  })

  socket.on('showLeaderboard', ({ roomId }) => {
    const room = rooms[roomId]
    if (!room || socket.id !== room.creatorId) return

    // Compute scores
    const playerScores = {}
    room.categoryResults.forEach((cat) => {
      cat.answers.forEach((ans) => {
        playerScores[ans.playerId] =
          (playerScores[ans.playerId] || 0) + ans.votes
      })
    })

    const scores = Object.entries(playerScores).map(([playerId, score]) => {
      const player = room.players.find((p) => p.id === playerId)
      return {
        playerId,
        playerName: player ? player.name : 'Unknown',
        score,
      }
    })

    io.to(roomId).emit('showLeaderboard', scores)
  })

  socket.on('requestCategories', ({ roomId }) => {
    const room = rooms[roomId]
    if (!room) return
    if (room.categoryResults.length > 0) {
      socket.emit('submittedAnswers', room.categoryResults)
    }
  })

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      const room = rooms[roomId]
      if (!room) continue

      room.players = room.players.filter((p) => p.id !== socket.id)
      delete room.answers?.[socket.id]

      io.to(roomId).emit('roomUpdate', room)

      if (room.players.length === 0) {
        delete rooms[roomId]
      }
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`)
})
