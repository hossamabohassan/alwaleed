import React, { useState, useEffect } from 'react';
import { GameState, Operation, Difficulty, LEVELS, Question } from './types';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import ResultModal from './components/ResultModal';
import { generateQuestion, getQuestionAudioText } from './services/mathEngine';
import { audioService } from './services/audioService';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'start',
    score: 0,
    currentLevel: 0,
    lifelines: { fiftyFifty: true, askAudience: true, callFriend: true },
    selectedOperation: null,
    selectedDifficulty: null
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startGame = async (op: Operation, diff: Difficulty) => {
    setIsLoading(true);
    
    // Initial State Reset
    const newState: GameState = {
      status: 'playing',
      score: 0,
      currentLevel: 0,
      lifelines: { fiftyFifty: true, askAudience: true, callFriend: true },
      selectedOperation: op,
      selectedDifficulty: diff
    };
    
    // Generate First Question & Preload Audio
    const firstQ = generateQuestion(op, diff);
    try {
        await audioService.preload(getQuestionAudioText(firstQ));
        await audioService.preload("أهلاً بك يا الوليد في مسابقة العباقرة. لنبدأ بالسؤال الأول");
    } catch (e) {
        console.warn("Preload failed", e);
    }
    
    setGameState(newState);
    setCurrentQuestion(firstQ);
    setIsLoading(false);
    
    // Play intro sound after loading
    audioService.speak(`أهلاً بك يا الوليد في مسابقة العباقرة. لنبدأ بالسؤال الأول`);
  };

  // Called immediately when user answers correctly to start fetching next Q in background
  const handleCorrectAnswerBackgroundLoad = async () => {
      if (!gameState.selectedOperation || !gameState.selectedDifficulty) return;
      
      const nextLevel = gameState.currentLevel + 1;
      if (nextLevel < LEVELS.length) {
          const nextQ = generateQuestion(gameState.selectedOperation, gameState.selectedDifficulty);
          setNextQuestion(nextQ);
          // Preload audio for next question while user is celebrating
          audioService.preload(getQuestionAudioText(nextQ));
      }
  };

  const handleAnswer = (ans: number) => {
    if (!currentQuestion) return;

    if (ans === currentQuestion.correctAnswer) {
      const nextLevel = gameState.currentLevel + 1;
      
      if (nextLevel >= LEVELS.length) {
        setGameState(prev => ({ ...prev, status: 'won', score: LEVELS[LEVELS.length - 1] }));
      } else {
        setGameState(prev => ({ 
          ...prev, 
          currentLevel: nextLevel,
          score: LEVELS[prev.currentLevel]
        }));
        
        // Use the preloaded question if available, otherwise generate new
        if (nextQuestion) {
            setCurrentQuestion(nextQuestion);
            setNextQuestion(null);
        } else if (gameState.selectedOperation && gameState.selectedDifficulty) {
             // Fallback if background load didn't finish or didn't trigger
             const nextQ = generateQuestion(gameState.selectedOperation, gameState.selectedDifficulty);
             setCurrentQuestion(nextQ);
        }
      }
    } else {
      setGameState(prev => ({ ...prev, status: 'lost' }));
    }
  };

  const useLifeline = (type: 'fiftyFifty' | 'askAudience' | 'callFriend') => {
    setGameState(prev => ({
      ...prev,
      lifelines: { ...prev.lifelines, [type]: false }
    }));
  };

  const restartGame = () => {
    setGameState({
      status: 'start',
      score: 0,
      currentLevel: 0,
      lifelines: { fiftyFifty: true, askAudience: true, callFriend: true },
      selectedOperation: null,
      selectedDifficulty: null
    });
    setNextQuestion(null);
  };

  return (
    <div className="min-h-screen millionaire-gradient text-white overflow-hidden font-sans relative">
      
      {isLoading && (
          <div className="fixed inset-0 z-[200] bg-indigo-950 flex flex-col items-center justify-center animate-fadeIn">
              <Loader2 className="w-16 h-16 text-yellow-400 animate-spin mb-4" />
              <p className="text-2xl font-bold text-white">جاري تجهيز الأسئلة يا بطل...</p>
          </div>
      )}

      {gameState.status === 'start' && !isLoading && (
        <StartScreen onStart={startGame} />
      )}

      {gameState.status === 'playing' && currentQuestion && !isLoading && (
        <GameScreen 
          gameState={gameState} 
          question={currentQuestion} 
          onAnswer={handleAnswer}
          onUseLifeline={useLifeline}
          onCorrectAnswer={handleCorrectAnswerBackgroundLoad}
        />
      )}

      {(gameState.status === 'won' || gameState.status === 'lost') && (
        <ResultModal 
            gameState={gameState} 
            onRestart={restartGame} 
            lastQuestion={currentQuestion} 
        />
      )}
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-20">
         <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-600 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}