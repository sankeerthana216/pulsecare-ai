import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Bell, 
  Bot, 
  User, 
  Settings, 
  LogOut, 
  Heart 
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/monitoring', icon: Activity, label: 'Live Monitoring' },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/alerts', icon: Bell, label: 'Alerts Center' },
    { to: '/chat', icon: Bot, label: 'AI Assistant' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950/80 border-r border-white/5 backdrop-blur-md min-h-screen sticky top-0 p-6">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="h-9 w-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
          <Heart className="h-5 w-5 text-white fill-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white">
          PulseCare <span className="text-primary font-medium">AI</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/15" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Session Info footer */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center font-semibold text-primary border border-white/5">
            {user?.name ? user.name[0].toUpperCase() : 'P'}
          </div>
          <div className="truncate">
            <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
            <span className="text-xs text-slate-500 capitalize">{user?.role.toLowerCase()}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
