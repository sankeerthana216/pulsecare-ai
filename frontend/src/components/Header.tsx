import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  Wifi, 
  WifiOff, 
  User, 
  LogOut, 
  Settings 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();

  // Map route path to human-readable page name
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/monitoring') return 'Live Health Monitor';
    if (path === '/analytics') return 'Analytics & Trends';
    if (path === '/alerts') return 'Alert Center';
    if (path === '/chat') return 'Symptom Checker';
    if (path === '/profile') return 'My Profile';
    if (path === '/settings') return 'Settings';
    return 'PulseCare';
  };

  return (
    <header className="bg-slate-950/40 border-b border-white/5 backdrop-blur-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
          {getPageTitle()}
        </h1>
        <p className="hidden md:block text-xs text-slate-400 mt-0.5">
          Real-time AI Clinical Health Tracker
        </p>
      </div>

      {/* Stats/Badges */}
      <div className="flex items-center gap-4">
        {/* WebSocket Connection Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-xs font-medium">
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary hidden sm:inline">Telemetry Live</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-400 hidden sm:inline">Telemetry Offline</span>
              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </>
          )}
        </div>

        {/* User Quick Menu (Mobile-focused header avatar) */}
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="h-9 w-9 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full flex items-center justify-center font-semibold text-primary transition-all duration-200"
            title="My Profile"
          >
            <User className="h-4 w-4 text-slate-300" />
          </Link>

          <Link
            to="/settings"
            className="h-9 w-9 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full flex items-center justify-center transition-all duration-200"
            title="Settings"
          >
            <Settings className="h-4 w-4 text-slate-300" />
          </Link>

          <button
            onClick={logout}
            className="md:hidden h-9 w-9 bg-slate-800/50 hover:bg-red-500/10 border border-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
