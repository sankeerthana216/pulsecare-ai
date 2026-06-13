import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Shield, 
  Zap, 
  ArrowRight, 
  BellRing, 
  UserCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
            <Heart className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            PulseCare <span className="text-primary font-medium">AI</span>
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-400 hover:text-white transition-all duration-200"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-semibold bg-primary hover:bg-primary-hover px-4 py-2 rounded-full text-white shadow-lg shadow-primary/15 transition-all duration-200"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col justify-center pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-16">
          {/* Left Hero Text */}
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight text-white tracking-tight"
            >
              Calm in the data.<br />
              <span className="text-primary">Action in the moment.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-slate-400 text-lg max-w-lg leading-relaxed"
            >
              PulseCare AI monitors your vital signs around the clock, explains trends in plain language, and alerts your emergency contacts the instant something looks wrong.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Link
                to="/signup"
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3.5 rounded-full text-white font-semibold shadow-lg shadow-primary/20 transition-all duration-200"
              >
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 border border-white/10 hover:bg-white/5 px-6 py-3.5 rounded-full text-white font-semibold transition-all duration-200"
              >
                Sign in
              </Link>
            </motion.div>
          </div>

          {/* Right Hero Visual Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Visual Glassmorphic Preview Card */}
            <div className="glass-panel rounded-3xl p-8 max-w-md mx-auto relative overflow-hidden">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Live Vital</span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                  Stable
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-display font-bold text-7xl text-primary vital-num-pulse">72</span>
                <span className="text-slate-400 font-medium">BPM</span>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Temperature</span>
                  <span className="font-semibold text-white">36.7 °C</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Oxygen (SpO2)</span>
                  <span className="font-semibold text-primary">98%</span>
                </div>
              </div>
            </div>

            {/* Glowing Accent Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 bg-primary/10 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <section className="grid md:grid-cols-3 gap-6 pt-16 border-t border-white/5">
          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Live Ingestion</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect wearable sensors or toggle the simulator to stream vital stats in real-time.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Health Advisor</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Analyze symptoms and get triage suggestions using Google Gemini AI or fallback systems.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
              <BellRing className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Immediate Dispatch</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instantly trigger full-screen overlays and email/SMS alerts to contacts on boundaries check.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-slate-950/20">
        <p className="max-w-md mx-auto">
          PulseCare AI is designed for personal wellness tracking and informational triage. It is not a substitute for professional clinical medical advice or diagnosis.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
