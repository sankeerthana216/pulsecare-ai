import React from 'react';
import { Link } from 'react-router-dom';
import { HeartOff, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center items-center px-4 text-center">
      <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-6">
        <HeartOff className="h-8 w-8" />
      </div>

      <h1 className="font-display font-bold text-4xl text-white mb-2">404</h1>
      <h3 className="font-semibold text-lg text-slate-300 mb-4">Page Not Found</h3>
      
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
        The link you requested is invalid or the clinical segment does not exist. Check the URL or return to dashboard.
      </p>

      <Link
        to="/dashboard"
        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-full text-white font-semibold text-xs shadow-lg shadow-primary/15 transition-all duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
