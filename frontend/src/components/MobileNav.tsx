import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Bell, 
  Bot 
} from 'lucide-react';
import clsx from 'clsx';

const MobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/monitoring', icon: Activity, label: 'Live' },
    { to: '/analytics', icon: TrendingUp, label: 'Trends' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/chat', icon: Bot, label: 'AI Chat' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 border-t border-white/5 backdrop-blur-lg px-2 py-2 flex justify-around">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={clsx(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-xl min-w-16 text-center transition-all duration-200",
              isActive 
                ? "text-primary bg-primary/5 font-semibold" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNav;
