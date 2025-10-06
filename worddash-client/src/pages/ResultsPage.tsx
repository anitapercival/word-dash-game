import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'

type PlayerAnswer = {
  playerId: string
  answer: string
  votes: number
}

type CategoryResults = {
  category: string
  answers: PlayerAnswer[]
}

type Score = {
  playerId: string
  playerName: string
  score: number
}

const ResultsPage = () => {
  const { roomId } = useParams()
  const location = useLocation()
  const socket = useSocket()

  const isCreator = (location.state as any)?.isCreator ?? false

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [categories, setCategories] = useState<CategoryResults[]>([])
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [scores, setScores] = useState<Score[]>([])

  const currentCategory = categories[currentCategoryIndex]

  useEffect(() => {
    socket.on('submittedAnswers', (allCategories: CategoryResults[]) => {
      setCategories(allCategories)
    })

    socket.on('advanceCategory', (index: number) => {
      setCurrentCategoryIndex(index)
      setVoted(new Set())
    })

    socket.on('showLeaderboard', (serverScores: Score[]) => {
      setScores(serverScores.sort((a, b) => b.score - a.score))
      setShowLeaderboard(true)
    })

    socket.on('voteUpdate', ({ categoryIndex, playerId, votes }) => {
      setCategories((prev) => {
        const updated = [...prev]
        const answer = updated[categoryIndex]?.answers.find(
          (a) => a.playerId === playerId
        )
        if (answer) {
          answer.votes = votes
        }
        return updated
      })
    })

    socket.emit('requestCategories', { roomId })

    return () => {
      socket.off('submittedAnswers')
      socket.off('advanceCategory')
      socket.off('showLeaderboard')
      socket.off('voteUpdate')
    }
  }, [socket, roomId])

  const handleVote = (answer: PlayerAnswer, type: 'up' | 'down') => {
    const voteKey = `${currentCategoryIndex}-${answer.playerId}`
    if (voted.has(voteKey)) return

    socket.emit('vote', { roomId, categoryIndex: currentCategoryIndex, playerId: answer.playerId, type })

    setVoted(new Set(voted).add(voteKey))
  }

  const handleNextClick = () => {
    if (currentCategoryIndex + 1 < categories.length) {
      socket.emit('nextCategory', { roomId, nextIndex: currentCategoryIndex + 1 })
    } else {
      socket.emit('showLeaderboard', { roomId })
    }
  }

  if (showLeaderboard) {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#1f1c2c] to-[#928dab] text-white font-retro p-6">
      <h2 className="text-3xl mb-10 text-yellow-300 pt-20">Leaderboard</h2>
      <ul className="w-full max-w-md space-y-4 mb-16">
        {scores.map((score) => (
          <li
            key={score.playerId}
            className="flex justify-between items-center px-4 py-3 bg-black border-2 border-yellow-400"
          >
            <span className="text-white">{score.playerName}</span>
            <span className="text-yellow-300 font-bold">{score.score} pts</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-4 bg-pink-500 text-white border-4 border-white text-xs hover:bg-pink-600 active:scale-95 transition-transform mb-6"
      >
        PLAY AGAIN
      </button>
      <div className="px-4 py-2 border-4 border-black bg-[#f7d716] text-black text-xs uppercase tracking-widest font-retro hover:bg-yellow-400 active:scale-95 transition-transform cursor-not-allowed mt-4">
        Log in to save your score
      </div>
    </div>
  )
}



  if (categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-retro text-xl">
        Waiting for answers...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-retro p-6">
      <h2 className="text-2xl text-yellow-300 mb-10 tracking-widest pt-20">
        Results: {currentCategory.category}
      </h2>

      <ul className="w-full max-w-md space-y-4 mb-8">
        {currentCategory.answers.map((ans, i) => (
          <li
            key={i}
            className="flex justify-between items-center bg-[#1a1a1a] border-2 border-[#333] px-4 py-3"
          >
            <span className="text-white italic">"{ans.answer}"</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote(ans, 'up')}
                className="text-green-400 hover:scale-110 transition"
                disabled={!isCreator}
              >
                ▲
              </button>
              <span className="text-white">{ans.votes}</span>
              <button
                onClick={() => handleVote(ans, 'down')}
                className="text-red-400 hover:scale-110 transition"
                disabled={!isCreator}
              >
                ▼
              </button>
            </div>
          </li>
        ))}
      </ul>

      {isCreator && (
        <button
          onClick={handleNextClick}
          className="px-6 py-4 bg-yellow-400 text-black border-4 border-black text-xs hover:brightness-110 active:scale-95 transition-transform"
        >
          {currentCategoryIndex + 1 < categories.length ? 'Next Category' : 'Show Leaderboard'}
        </button>
      )}
    </div>
  )
}

export default ResultsPage
