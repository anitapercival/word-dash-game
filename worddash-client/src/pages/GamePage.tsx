import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'

const FALLBACK_CATEGORIES = [
  'Animal',
  'Food',
  'Things you do at the gym',
  'Country',
  'Movie',
  'Color',
  'Book',
]

const ROUND_TIME = 90

const GamePage = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const socket = useSocket()

  const [letter, setLetter] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_TIME)
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES)
  const [answers, setAnswers] = useState<{ [category: string]: string }>({})

  useEffect(() => {
    if (!socket || !roomId) return

    const handleGameStarted = ({
      letter,
      categories,
    }: {
      letter: string
      categories: string[]
    }) => {
      setLetter(letter)
      setCategories(categories || FALLBACK_CATEGORIES)
      setTimeLeft(ROUND_TIME)
    }

    const handleGameState = ({
      gameStarted,
      letter,
      categories,
    }: {
      gameStarted: boolean
      letter: string
      categories: string[]
    }) => {
      if (gameStarted && letter) {
        setLetter(letter)
        setCategories(categories || FALLBACK_CATEGORIES)
      }
    }

    socket.on('gameStarted', handleGameStarted)
    socket.on('gameState', handleGameState)

    socket.emit('getGameState', { roomId })

    return () => {
      socket.off('gameStarted', handleGameStarted)
      socket.off('gameState', handleGameState)
    }
  }, [socket, roomId])

  useEffect(() => {
    if (!letter) return 

    if (timeLeft === 0) {
      socket.emit('submitAnswers', { roomId, letter, answers })
      navigate(`/results/${roomId}`, { state: { isCreator: true } })
      return
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, navigate, roomId, letter, answers, socket])

  const handleChange = (category: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [category]: value.toUpperCase(),
    }))
  }

  const startsWithLetter = (answer: string) =>
    letter && answer?.startsWith(letter)

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-retro p-6">
      <h2 className="text-3xl mb-6 tracking-widest text-[#08d9d6] pt-20">
        Game Room{' '}
        <span className="text-[#ff2e63]">#{roomId?.toUpperCase()}</span>
      </h2>

      {!letter ? (
        <div className="mb-6 p-4 border-4 border-white w-full max-w-md bg-black text-yellow-300 text-center text-2xl font-bold">
          Waiting for the host to start the game…
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 border-4 border-white w-full max-w-md bg-black text-yellow-300 text-center text-3xl font-bold">
            LETTER: <span className="uppercase">{letter}</span>
          </div>

          <div className="mb-4 text-white text-2xl font-bold">
            Time Left: <span className="text-[#ff2e63]">{timeLeft}s</span>
          </div>

          <form
            className="w-full max-w-md space-y-4 pb-30"
            onSubmit={(e) => e.preventDefault()}
          >
            {categories.map((category) => (
              <div key={category} className="flex flex-col">
                <label className="mb-1 text-yellow-300 uppercase tracking-widest">
                  {category}
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={answers[category] || ''}
                  onChange={(e) => handleChange(category, e.target.value)}
                  className={`px-4 py-3 bg-[#1a1a1a] border-4 ${
                    answers[category] && !startsWithLetter(answers[category])
                      ? 'border-red-600'
                      : 'border-[#333]'
                  } text-white font-retro uppercase tracking-widest`}
                  autoComplete="off"
                />
                {answers[category] && !startsWithLetter(answers[category]) && (
                  <span className="text-red-600 text-xs mt-1">
                    Must start with "{letter}"
                  </span>
                )}
              </div>
            ))}
          </form>
        </>
      )}
    </div>
  )
}

export default GamePage
