import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Loader2 } from 'lucide-react';

const MainView: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B14] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-spotify" />
        <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">
          Initializing Harmonix Audio Engine...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <PlayerProvider>
      <Dashboard />
    </PlayerProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainView />
    </AuthProvider>
  );
}
