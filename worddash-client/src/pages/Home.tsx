import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const Home = () => {
  const [roomCode, setRoomCode] = useState('')
  const navigate = useNavigate()

  const handleCreateRoom = () => {
  const newRoomId = Math.random().toString(36).slice(2, 7).toUpperCase()
  navigate(`/room/${newRoomId}`, { state: { isCreator: true } })
}

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim().toUpperCase()}`)
    }
  }

  return (
    
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-retro px-4 text-center">
      <Navbar />
      <h1 className="text-3xl sm:text-4xl md:text-5xl mb-12 tracking-widest drop-shadow-[2px_2px_0px_#ff2e63]">
        <span className="text-[#08d9d6]">WORD</span>
        <span className="text-[#ff2e63]">DASH</span>
      </h1>

      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        <button
          onClick={handleCreateRoom}
          className="w-full px-4 py-4 bg-[#f7d716] text-black border-4 border-black text-xs hover:bg-yellow-400 active:scale-95 transition-transform"
        >
          CREATE ROOM
        </button>

        <div className="w-full flex flex-col space-y-4">
          <input
            type="text"
            placeholder="ENTER ROOM CODE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            maxLength={5}
            className="w-full px-4 py-3 text-center text-black bg-white border-4 border-black placeholder:text-gray-500 uppercase tracking-widest font-retro text-sm"
          />
          <button
            onClick={handleJoinRoom}
            className="w-full px-4 py-4 bg-[#ff5959] text-white border-4 border-black text-xs hover:bg-red-500 active:scale-95 transition-transform"
          >
            JOIN ROOM
          </button>
        </div>
      </div>

      <p className="mt-10 text-xs text-gray-400 tracking-wide">
        Press Start to Begin!
      </p>
    </div>
  )
}

export default Home
