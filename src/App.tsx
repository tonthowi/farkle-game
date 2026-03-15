import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Home } from './pages/Home';
import { Setup } from './pages/Setup';
import { Game } from './pages/Game';
import { Lobby } from './pages/Lobby';
import { Profile } from './pages/Profile';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { ProfileSetup } from './pages/ProfileSetup';
import { useBgm } from './hooks/useBgm';
import { BgmButton } from './components/ui/BgmButton';

// Inner component so that useLocation (and useBgm) runs inside BrowserRouter
function AppRoutes() {
  const location = useLocation();
  const { isMuted, toggleMute } = useBgm(location.pathname === '/game');

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BgmButton isMuted={isMuted} onToggle={toggleMute} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
