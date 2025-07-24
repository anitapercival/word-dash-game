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

      io.to(roomId).emit('submittedAnswers', categoryResults)
    }
  })

  socket.on('nextCategory', ({ roomId, nextIndex }) => {
    const room = rooms[roomId]
    if (!room || socket.id !== room.creatorId) return
    io.to(roomId).emit('advanceCategory', nextIndex)
  })

  socket.on('showLeaderboard', ({ roomId }) => {
    const room = rooms[roomId]
    if (!room || socket.id !== room.creatorId) return
    io.to(roomId).emit('showLeaderboard')
  })

  socket.on('requestCategories', ({ roomId }) => {
    const room = rooms[roomId]
    if (!room) return
    if (Object.keys(room.answers).length > 0) {
      const categoryResults = room.categories.map((category) => {
        const answersForCategory = room.players.map((player) => ({
          playerId: player.id,
          answer: room.answers[player.id]?.[category] || '',
          votes: 0,
        }))
        return { category, answers: answersForCategory }
      })
      socket.emit('submittedAnswers', categoryResults)
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

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
