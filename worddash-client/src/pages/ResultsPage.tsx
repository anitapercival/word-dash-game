import React, { useEffect, useState } from 'react'
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

    socket.on('showLeaderboard', () => {
      calculateScores()
      setShowLeaderboard(true)
    })

    socket.emit('requestCategories', { roomId })

    return () => {
      socket.off('submittedAnswers')
      socket.off('advanceCategory')
      socket.off('showLeaderboard')
    }
  }, [socket, roomId])

  const handleVote = (answer: PlayerAnswer, type: 'up' | 'down') => {
    const voteKey = `${currentCategoryIndex}-${answer.playerId}`
    if (voted.has(voteKey)) return

    const updatedCategories = [...categories]
    const answerToUpdate = updatedCategories[currentCategoryIndex].answers.find(
      (a) => a.playerId === answer.playerId
    )
    if (answerToUpdate) {
      answerToUpdate.votes += type === 'up' ? 1 : -1
    }

    setCategories(updatedCategories)
    setVoted(new Set(voted).add(voteKey))
  }

  const handleNextClick = () => {
    if (currentCategoryIndex + 1 < categories.length) {
      socket.emit('nextCategory', { roomId, nextIndex: currentCategoryIndex + 1 })
    } else {
      socket.emit('showLeaderboard', { roomId })
    }
  }

  const calculateScores = () => {
    const playerScores: { [id: string]: number } = {}
    categories.forEach((cat) => {
      cat.answers.forEach((ans) => {
        playerScores[ans.playerId] = (playerScores[ans.playerId] || 0) + ans.votes
      })
    })

    const scoreList: Score[] = Object.entries(playerScores).map(([playerId, score]) => ({
      playerId,
      score,
    }))

    setScores(scoreList.sort((a, b) => b.score - a.score))
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#1f1c2c] to-[#928dab] text-white font-retro p-6">
        <h2 className="text-3xl mb-10 text-yellow-300">Leaderboard</h2>
        <ul className="w-full max-w-md space-y-4 mb-16">
          {scores.map((score, i) => (
            <li
              key={score.playerId}
              className="flex justify-between items-center px-4 py-3 bg-black border-2 border-yellow-400"
            >
              <span className="text-white">Player {score.playerId}</span>
              <span className="text-yellow-300 font-bold">{score.score} pts</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-4 bg-pink-500 text-white border-4 border-white text-xs hover:bg-pink-600 active:scale-95 transition-transform"
        >
          PLAY AGAIN
        </button>
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
      <h2 className="text-2xl text-yellow-300 mb-10 tracking-widest">
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
