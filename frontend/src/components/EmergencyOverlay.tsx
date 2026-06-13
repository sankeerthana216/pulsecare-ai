import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import { 
  AlertOctagon, 
  Phone, 
  X, 
  Activity, 
  Thermometer, 
  Flame 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmergencyOverlay: React.FC = () => {
  const { activeEmergency, dismissEmergency } = useSocket();

  if (!activeEmergency) return null;

  const { type, message, vitals, emergencyContact } = activeEmergency;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-full max-w-xl bg-slate-900 border border-emergency/40 rounded-3xl p-6 md:p-8 shadow-2xl shadow-emergency/15 text-center relative overflow-hidden"
        >
          {/* Animated Pulse background */}
          <div className="absolute inset-0 bg-radial-gradient from-emergency/5 to-transparent pointer-events-none"></div>

          {/* Close Dismiss Button */}
          <button
            onClick={dismissEmergency}
            className="absolute top-4 right-4 h-10 w-10 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
            title="Dismiss Alert"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Alert Icon */}
          <div className="emergency-pulse mx-auto h-20 w-20 bg-emergency flex items-center justify-center rounded-full mb-6">
            <AlertOctagon className="h-10 w-10 text-white animate-bounce" />
          </div>

          {/* Emergency Title */}
          <h2 className="font-display font-bold text-2xl md:text-3xl text-emergency mb-2 uppercase tracking-wide">
            {type.replace(/_/g, ' ')} DETECTED
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-md mx-auto mb-6 leading-relaxed">
            {message}
          </p>

          {/* Critical Vital Readings Display */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {/* Heart Rate */}
            <div className="bg-slate-950/60 border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <Activity className="h-3.5 w-3.5 text-emergency" />
                <span>Heart Rate</span>
              </div>
              <span className="font-display font-bold text-xl md:text-2xl text-emergency vital-num-pulse">
                {vitals.heartRate}
              </span>
              <span className="text-[10px] text-slate-500 block">BPM</span>
            </div>

            {/* Temperature */}
            <div className="bg-slate-950/60 border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <Thermometer className="h-3.5 w-3.5 text-primary" />
                <span>Temp</span>
              </div>
              <span className="font-display font-bold text-xl md:text-2xl text-white">
                {vitals.temperature}
              </span>
              <span className="text-[10px] text-slate-500 block">°C</span>
            </div>

            {/* Oxygen level */}
            <div className="bg-slate-950/60 border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <Flame className="h-3.5 w-3.5 text-warning" />
                <span>Oxygen</span>
              </div>
              <span className="font-display font-bold text-xl md:text-2xl text-emergency vital-num-pulse">
                {vitals.oxygenLevel}
              </span>
              <span className="text-[10px] text-slate-500 block">SpO2 %</span>
            </div>
          </div>

          {/* Emergency Contact & Call Action */}
          {emergencyContact ? (
            <div className="bg-slate-950/80 border border-white/5 p-5 rounded-2xl mb-6 text-left">
              <span className="text-xs text-slate-500 block mb-1">DESIGNATED EMERGENCY CONTACT</span>
              <h4 className="font-semibold text-white text-base">{emergencyContact.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">{emergencyContact.phone}</p>
              
              <a
                href={`tel:${emergencyContact.phone}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emergency text-white font-semibold hover:bg-red-600 shadow-lg shadow-emergency/25 transition-all duration-200 text-sm"
              >
                <Phone className="h-4 w-4 fill-white" />
                Call Emergency Contact
              </a>
            </div>
          ) : (
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl mb-6 text-xs text-slate-400 leading-relaxed">
              No emergency contact is configured in your profile. Update your profile settings to enable one-tap contact calling.
            </div>
          )}

          {/* Triage Disclaimer */}
          <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            Emergency telemetry warnings are verified rules. If you feel severe discomfort, tightness, or disorientation, contact your local emergency services (e.g. 911) immediately.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmergencyOverlay;
