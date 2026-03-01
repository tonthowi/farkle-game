import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewGamePayload } from '../types/game';
import type { MatchRecord } from '../types/history';
import { useGame } from '../hooks/useGame';
import { useProfile } from '../hooks/useProfile';
import { useHistory } from '../hooks/useHistory';
import { ScorePanel } from '../components/game/ScorePanel';
import { TurnPanel } from '../components/game/TurnPanel';
import { DiceBoard } from '../components/dice/DiceBoard';
import { GameActions } from '../components/game/GameActions';
import { FarkleAlert } from '../components/game/FarkleAlert';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { formatScore } from '../utils/format';

export function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as NewGamePayload | null;
  const { updateStats } = useProfile();
  const { recordMatch } = useHistory();

  const payload: NewGamePayload = locationState ?? {
    mode: 'vs-computer',
    difficulty: 'medium',
    players: [
      { name: 'Player', avatar: '🎲', isHuman: true },
      { name: 'Computer', avatar: '💀', isHuman: false },
    ],
    targetScore: 10000,
  };

  const {
    state,
    triggerRoll,
    triggerRollMore,
    selectDie,
    bank,
    confirmFarkle,
    confirmHotDice,
    confirmPass,
    startNewGame,
    isCurrentPlayerHuman,
  } = useGame(payload);

  // Save match result when game ends
  useEffect(() => {
    if (state.phase !== 'game-over' || state.winner === null) return;

    const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const winnerPlayer = state.players[state.winner];
    const humanPlayer = state.players.find((p) => p.isHuman);
    const humanWon = state.players[state.winner]?.isHuman ?? false;

    const record: MatchRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mode: state.mode,
      players: state.players.map((p) => ({
        name: p.name,
        avatar: p.avatar,
        score: p.totalScore,
        isHuman: p.isHuman,
      })),
      winnerName: winnerPlayer?.name ?? 'Unknown',
      durationSeconds,
      targetScore: state.targetScore,
    };
    recordMatch(record);

    // Update profile stats
    if (humanPlayer) {
      updateStats((prev: any) => ({
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + (humanWon ? 1 : 0),
        losses: prev.losses + (humanWon ? 0 : 1),
        bestScore: Math.max(prev.bestScore, humanPlayer.totalScore),
        totalPointsScored: prev.totalPointsScored + humanPlayer.totalScore,
      }));
    }
  }, [state.phase]);

  const winner = state.winner !== null ? state.players[state.winner] : null;

  return (
    <div className="min-h-screen flex flex-col bg-wood-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wood-light">
        <button
          onClick={() => navigate('/')}
          className="text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Quit
        </button>
        <h1 className="font-cinzel text-gold font-bold tracking-wider">FARKLE</h1>
        <div className="text-parchment-dim font-cinzel text-xs">
          {state.mode === 'vs-computer'
            ? `vs ${state.difficulty}`
            : 'Local'}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4 max-w-md mx-auto w-full">
        {/* Score panel */}
        <ScorePanel
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          targetScore={state.targetScore}
        />

        {/* Turn info */}
        <TurnPanel state={state} />

        {/* Dice board */}
        <DiceBoard
          dice={state.dice}
          onSelectDie={selectDie}
          canSelect={state.phase === 'selecting' && isCurrentPlayerHuman}
        />

        {/* Actions */}
        <GameActions
          state={state}
          onRoll={triggerRoll}
          onRollMore={triggerRollMore}
          onBank={bank}
          isHumanTurn={isCurrentPlayerHuman}
        />
      </div>

      {/* Farkle alert */}
      <FarkleAlert
        state={state}
        onConfirm={confirmFarkle}
        isHumanTurn={isCurrentPlayerHuman}
      />

      {/* Hot Dice modal */}
      <Modal
        open={state.phase === 'hot-dice' && isCurrentPlayerHuman}
        title="🔥 Hot Dice!"
      >
        <p className="font-cinzel text-parchment text-center mb-4">
          All dice scored! You must roll all 6 dice again.
        </p>
        <p className="font-cinzel text-gold text-center text-lg font-bold mb-6">
          Turn score: {formatScore(state.turnScore)}
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={confirmHotDice}>
          Roll All 6!
        </Button>
      </Modal>

      {/* Pass device modal (local multiplayer) */}
      <Modal
        open={state.showPassDevice}
        title="Pass the Device"
      >
        <p className="font-cinzel text-parchment text-center mb-2">
          {state.players[(state.currentPlayerIndex + state.players.length) % state.players.length]?.name}'s turn is over.
        </p>
        <p className="font-cinzel text-gold text-center text-lg mb-6">
          Pass to{' '}
          <span className="font-bold">
            {state.players[state.currentPlayerIndex]?.name}
          </span>
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={confirmPass}>
          I'm Ready ›
        </Button>
      </Modal>

      {/* Game over modal */}
      <AnimatePresence>
        {state.phase === 'game-over' && winner && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-wood border-2 border-gold rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 15, -15, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                {winner.avatar}
              </motion.div>
              <h2 className="font-cinzel font-black text-gold text-4xl mb-1">Victory!</h2>
              <p className="font-cinzel text-parchment text-xl mb-1">{winner.name} wins!</p>
              <p className="font-cinzel text-parchment-dim mb-6">
                Final score: {formatScore(winner.totalScore)}
              </p>

              {/* All scores */}
              <div className="space-y-2 mb-6">
                {state.players.map((p) => (
                  <div key={p.id} className="flex justify-between items-center px-2">
                    <span className="font-cinzel text-parchment">
                      {p.avatar} {p.name}
                    </span>
                    <span className={`font-cinzel font-bold tabular-nums ${p === winner ? 'text-gold-bright' : 'text-parchment-dim'}`}>
                      {formatScore(p.totalScore)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
                  Menu
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => startNewGame(payload)}
                >
                  Rematch
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
