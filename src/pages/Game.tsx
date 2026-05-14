import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { GameState, NewGamePayload } from '../types/game';
import { useGame } from '../hooks/useGame';
import { useProfile } from '../hooks/useProfile';
import { useHistory } from '../hooks/useHistory';
import { useAuth } from '../contexts/AuthContext';
import { useOnlineSync } from '../hooks/useOnlineSync';
import { useGameResult } from '../hooks/useGameResult';
import { useSfx } from '../hooks/useSfx';
import { saveSession, loadSession, clearSession } from '../utils/session';
import { ScorePanel } from '../components/game/ScorePanel';
import { TurnPanel } from '../components/game/TurnPanel';
import { DiceBoard } from '../components/dice/DiceBoard';
import { GameActions } from '../components/game/GameActions';
import { FarkleAlert } from '../components/game/FarkleAlert';
import { GameOverModal } from '../components/game/GameOverModal';
import { QuitConfirmModal } from '../components/game/QuitConfirmModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { formatScore } from '../utils/format';

interface GameLocationState {
  mode: string;
  roomCode?: string;
  [key: string]: unknown;
}

export function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as GameLocationState | null;
  const { user } = useAuth();
  const { updateStats } = useProfile();
  const { recordMatch } = useHistory();

  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Restore from sessionStorage if locationState is lost (e.g. browser refresh)
  const restoredState = useRef(locationState ? null : loadSession()).current;

  const effectiveLocationState = locationState ?? (restoredState
    ? { mode: restoredState.mode, roomCode: restoredState.roomCode } as GameLocationState
    : null);

  // Guard: /game requires valid navigation state or a saved session
  if (!effectiveLocationState?.mode) {
    navigate('/', { replace: true });
    return null;
  }

  const isOnlineMode = effectiveLocationState.mode === 'online-multiplayer';
  const roomCode = isOnlineMode ? effectiveLocationState.roomCode : undefined;

  const onlineInitialState: GameState | undefined = isOnlineMode
    ? (restoredState ?? locationState as unknown as GameState)
    : undefined;

  const offlinePayload: NewGamePayload = isOnlineMode
    ? { mode: 'vs-computer', players: [], targetScore: 10000 } // unused
    : (locationState as unknown as NewGamePayload ?? {
        mode: 'vs-computer',
        difficulty: 'medium',
        players: [
          { name: 'Player', avatar: '🎲', isHuman: true },
          { name: 'Computer', avatar: '💀', isHuman: false },
        ],
        targetScore: 10000,
      });

  const {
    state,
    dispatch,
    triggerRoll,
    triggerRollMore,
    selectDie,
    bank,
    confirmFarkle,
    confirmHotDice,
    confirmPass,
    startNewGame,
    isCurrentPlayerHuman,
  } = useGame(
    isOnlineMode ? undefined : offlinePayload,
    restoredState ?? onlineInitialState,
  );

  const isMyTurn = isOnlineMode
    ? state.players[state.currentPlayerIndex]?.id === user?.id
    : isCurrentPlayerHuman;

  // Session persistence
  useEffect(() => {
    if (state.phase === 'game-over') clearSession();
    else saveSession(state);
  }, [state]);

  // Online sync
  const {
    isConnected,
    handleRoll: _roll,
    handleRollMore: _rollMore,
    handleBank: _bank,
    handleSelectDie: _selectDie,
    handleConfirmFarkle: _confirmFarkle,
    handleConfirmHotDice: _confirmHotDice,
  } = useOnlineSync(
    { roomCode, isOnlineMode, state, dispatch, onFatalError: () => navigate('/', { replace: true }) },
    { triggerRoll, triggerRollMore, bank, selectDie, confirmFarkle, confirmHotDice },
  );

  // Sound effects
  const sfx = useSfx();

  // Public handlers with SFX layered on top
  function handleRoll() { sfx.playRoll(); _roll(); }
  function handleRollMore() { sfx.playRoll(); _rollMore(); }
  function handleBank() { sfx.playBank(); _bank(); }
  function handleSelectDie(id: number) { if (isMyTurn) sfx.playSelect(); _selectDie(id); }
  function handleConfirmFarkle() { sfx.playFarkle(); _confirmFarkle(); }
  function handleConfirmHotDice() { _confirmHotDice(); }

  // Win fanfare on game-over
  useEffect(() => {
    if (state.phase !== 'game-over' || state.winner === null) return;
    const humanPlayer = isOnlineMode
      ? state.players.find((p) => p.id === user?.id)
      : state.players.find((p) => p.isHuman);
    if (humanPlayer && state.players[state.winner]?.id === humanPlayer.id) sfx.playWin();
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Match recording + stats update on game-over
  useGameResult(state, isOnlineMode, user, { updateStats, recordMatch });

  // Turn timer auto-action: only fires for the active player in online mode
  useEffect(() => {
    if (!isOnlineMode || !isMyTurn) return;
    if (state.phase !== 'selecting' || !state.turnDeadline) return;
    const remaining = state.turnDeadline - Date.now();
    const act = () => {
      const hasSelection = state.dice.some((d) => d.isSelected);
      if (hasSelection) handleBank();
      else handleConfirmFarkle();
    };
    if (remaining <= 0) { act(); return; }
    const timer = setTimeout(act, remaining);
    return () => clearTimeout(timer);
  }, [state.turnDeadline, state.phase, isOnlineMode, isMyTurn]); // eslint-disable-line react-hooks/exhaustive-deps

  const isGameInProgress = state.phase !== 'game-over' && state.phase !== 'idle';

  function handleQuit() {
    if (isOnlineMode && isGameInProgress) {
      setShowQuitConfirm(true);
    } else {
      clearSession();
      navigate('/');
    }
  }

  function confirmQuit() {
    clearSession();
    setShowQuitConfirm(false);
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-wood-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wood-light">
        <button
          onClick={handleQuit}
          className="text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Quit
        </button>
        <h1 className="font-cinzel text-gold font-bold tracking-wider">FARKLE</h1>
        <div className="text-parchment-dim font-cinzel text-xs">
          {state.mode === 'vs-computer'
            ? `vs ${state.difficulty}`
            : state.mode === 'online-multiplayer'
            ? '🌐 Online'
            : 'Local'}
        </div>
      </div>

      {/* Connection lost banner */}
      {isOnlineMode && !isConnected && (
        <div className="bg-danger/90 text-parchment-bright font-cinzel text-xs text-center py-2 px-4">
          Connection lost — attempting to reconnect…
        </div>
      )}

      {/* Opponent's turn banner */}
      {isOnlineMode && !isMyTurn && state.phase !== 'game-over' && (
        <motion.div
          className="bg-wood border-b border-wood-light px-4 py-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="font-cinzel text-parchment-dim text-xs">
            ⏳ {state.players[state.currentPlayerIndex]?.avatar}{' '}
            {state.players[state.currentPlayerIndex]?.name}'s turn — please wait…
          </p>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col gap-4 p-4 max-w-md mx-auto w-full">
        <ScorePanel
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          targetScore={state.targetScore}
        />
        <TurnPanel state={state} />
        <DiceBoard
          dice={state.dice}
          onSelectDie={handleSelectDie}
          canSelect={state.phase === 'selecting' && isMyTurn}
          phase={state.phase}
        />
        <GameActions
          state={state}
          onRoll={handleRoll}
          onRollMore={handleRollMore}
          onBank={handleBank}
          isHumanTurn={isMyTurn}
        />
      </div>

      <FarkleAlert state={state} onConfirm={handleConfirmFarkle} isHumanTurn={isMyTurn} />

      {/* Hot dice modal */}
      <Modal open={state.phase === 'hot-dice' && isMyTurn} title="🔥 Hot Dice!">
        <p className="font-cinzel text-parchment text-center mb-4">
          All dice scored! You must roll all 6 dice again.
        </p>
        <p className="font-cinzel text-gold text-center text-lg font-bold mb-6">
          Turn score: {formatScore(state.turnScore)}
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={handleConfirmHotDice}>
          Roll All 6!
        </Button>
      </Modal>

      {/* Pass-device modal (local multiplayer only) */}
      {!isOnlineMode && (
        <Modal open={state.showPassDevice} title="Pass the Device">
          <p className="font-cinzel text-parchment text-center mb-2">
            {state.players[(state.currentPlayerIndex + state.players.length) % state.players.length]?.name}'s turn is over.
          </p>
          <p className="font-cinzel text-gold text-center text-lg mb-6">
            Pass to{' '}
            <span className="font-bold">{state.players[state.currentPlayerIndex]?.name}</span>
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={confirmPass}>
            I'm Ready ›
          </Button>
        </Modal>
      )}

      <GameOverModal
        state={state}
        isOnlineMode={isOnlineMode}
        onRematch={() => startNewGame(offlinePayload)}
      />

      <QuitConfirmModal
        open={showQuitConfirm}
        onStay={() => setShowQuitConfirm(false)}
        onQuit={confirmQuit}
      />
    </div>
  );
}
