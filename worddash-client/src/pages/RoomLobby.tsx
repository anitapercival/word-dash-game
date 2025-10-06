import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'

type Player = {
  name: string
  ready: boolean
}

const RoomLobby = () => {
  const socket = useSocket()
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isCreator = (location.state as any)?.isCreator ?? false

  const [username, setUsername] = useState('')
  const [tempName, setTempName] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('worddash-username')
    if (savedName) setUsername(savedName)
  }, [])

  useEffect(() => {
    if (!username || !roomId) return

    if (isCreator) {
      socket.emit('createRoom', { roomId, username })
    } else {
      socket.emit('joinRoom', { roomId, username })
    }

    socket.on('roomUpdate', (room: { players: Player[] }) => {
  setPlayers(room.players)
})

    socket.on('gameStarted', ({ letter, categories }) => {
      navigate(`/game/${roomId}`, { state: { letter, categories } })
    })

    socket.on('error', (message: string) => {
      alert(message)
    })

    return () => {
      socket.off('roomUpdate')
      socket.off('gameStarted')
      socket.off('error')
    }
  }, [username, roomId, isCreator, socket, navigate])

  const handleUsernameSubmit = () => {
    if (tempName.trim().length > 1) {
      setUsername(tempName.trim())
      localStorage.setItem('worddash-username', tempName.trim())
    }
  }

  const handleToggleReady = () => {
    socket.emit('toggleReady', { roomId })
    setIsReady((r) => !r)
  }

  const handleStartGame = () => {
    socket.emit('startGame', { roomId })
  }

  if (!username) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-retro p-6">
        <h2 className="text-xl mb-4 text-[#08d9d6]">Enter Your Name</h2>
        <input
          type="text"
          placeholder="USERNAME"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          maxLength={12}
          className="px-4 py-3 w-64 text-center text-black bg-white border-4 border-black placeholder:text-gray-500 uppercase tracking-widest text-sm mb-4"
        />
        <button
          onClick={handleUsernameSubmit}
          className="px-6 py-4 bg-yellow-400 text-black border-4 border-black text-xs hover:brightness-110 active:scale-95 transition-transform"
        >
          JOIN ROOM
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-retro p-6">
      <h2 className="text-2xl md:text-3xl mb-4 tracking-widest text-[#08d9d6]">
        ROOM <span className="text-[#ff2e63]">#{roomId?.toUpperCase()}</span>
      </h2>

      <p className="text-sm text-gray-400 mb-2">Welcome, {username}!</p>
      <p className="text-sm text-gray-400 mb-6">Share this code to invite friends.</p>

      <button
        onClick={() => setShowRules(!showRules)}
        className="mb-6 text-xs px-4 py-2 bg-black border-2 border-yellow-300 text-yellow-300 hover:bg-yellow-300 hover:text-black transition"
      >
        {showRules ? 'Hide Rules' : 'View Rules'}
      </button>

      {showRules && (
        <div className="mb-6 w-full max-w-md p-4 bg-[#1a1a1a] border-4 border-yellow-300 text-sm text-yellow-100 space-y-2 transition-all duration-300 ease-in-out">
          <h3 className="text-yellow-300 text-lg font-bold mb-2">How to Play</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>A random letter will be chosen when the game starts.</li>
            <li>You'll see a list of categories (e.g. Animal, Food, Movie, etc.).</li>
            <li>Your goal is to write a word for each category that begins with the chosen letter.</li>
            <li>You have 90 seconds to fill in as many as you can.</li>
            <li>When time runs out, your answers will be locked in automatically.</li>
            <li>Points are awarded based on uniqueness and correctness of answers.</li>
          </ul>
        </div>
      )}

      <div className="w-full max-w-md bg-black border-4 border-white p-4 mb-6">
        <h3 className="text-md mb-4 text-yellow-300">Players</h3>
        <ul className="space-y-2">
          {players.map((player, idx) => (
            <li
              key={idx}
              className="flex justify-between items-center bg-[#1a1a1a] px-3 py-2 border-2 border-[#333]"
            >
              <span className="text-white">{player.name}</span>
              <span className={player.ready ? 'text-green-400' : 'text-red-400'}>
                {player.ready ? 'READY' : 'NOT READY'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleToggleReady}
        className={`px-6 py-4 w-full max-w-sm text-xs border-4 ${
          isReady
            ? 'bg-green-500 border-white text-black'
            : 'bg-yellow-400 border-black text-black'
        } hover:brightness-110 active:scale-95 transition-transform mb-4`}
      >
        {isReady ? 'CANCEL READY' : 'I\'M READY'}
      </button>

      {isCreator && (
        <button
          onClick={handleStartGame}
          className="px-6 py-4 w-full max-w-sm bg-[#ff2e63] text-white border-4 border-white text-xs hover:bg-red-500 active:scale-95 transition-transform"
        >
          START GAME
        </button>
      )}
    </div>
  )
}

export default RoomLobby
