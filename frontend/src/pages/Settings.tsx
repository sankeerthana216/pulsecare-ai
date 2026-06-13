import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Cpu, 
  Key, 
  Check, 
  Copy,
  Info
} from 'lucide-react';

const Settings: React.FC = () => {
  const [browserAlerts, setBrowserAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch profile to get phone number (serves as x-device-key)
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiRequest('/profile'),
  });

  const deviceKey = profile?.phone || 'your-registered-phone-number';

  const copyDeviceKey = () => {
    navigator.clipboard.writeText(deviceKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Notification Subscriptions */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
          <Bell className="h-4.5 w-4.5 text-primary" />
          Notification Settings
        </h3>

        <div className="space-y-4">
          {/* Browser Alerts */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex gap-3 items-center">
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-white">Browser Push Alerts</h4>
                <p className="text-xs text-slate-500">Recieve critical emergency overlay alerts on screen</p>
              </div>
            </div>
            <button
              onClick={() => setBrowserAlerts(!browserAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                browserAlerts ? 'bg-primary' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                  browserAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Email Alerts */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex gap-3 items-center">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-white">Email Health Reports</h4>
                <p className="text-xs text-slate-500">Recieve automated reports when telemetry breaches thresholds</p>
              </div>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                emailAlerts ? 'bg-primary' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                  emailAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* SMS Alerts */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex gap-3 items-center">
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-white">Caregiver SMS Dispatch</h4>
                <p className="text-xs text-slate-500">Send automatic emergency SMS to caregiver contact</p>
              </div>
            </div>
            <button
              onClick={() => setSmsAlerts(!smsAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                smsAlerts ? 'bg-primary' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                  smsAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. IoT Wearable Sensor Integration */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
          <Cpu className="h-4.5 w-4.5 text-primary" />
          IoT Wearable Sensor Integration
        </h3>

        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            PulseCare AI is fully compatible with external custom devices (such as smartwatches, bands, Arduino, or ESP32 boards). To connect a device, use your unique telemetry device authorization key below.
          </p>

          {/* Device Key card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-between">
            <div className="flex gap-3 items-center min-w-0">
              <Key className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Device Auth Key (X-Device-Key)</span>
                <span className="font-mono text-xs text-slate-300 font-medium block truncate select-all">{deviceKey}</span>
              </div>
            </div>
            <button
              onClick={copyDeviceKey}
              className="h-10 w-10 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl flex items-center justify-center text-slate-300 transition-all duration-200"
              title="Copy Device Key"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Setup Documentation */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" />
              IoT API Documentation
            </h4>
            
            <div className="space-y-2 text-xs leading-relaxed text-slate-400">
              <p>To record vital signs automatically, program your microcontroller to perform an HTTP POST request:</p>
              <div className="bg-slate-900 p-3 rounded-xl font-mono text-[10px] text-slate-300 overflow-x-auto space-y-1">
                <div>POST http://localhost:5000/api/vitals/iot</div>
                <div>Headers:</div>
                <div className="text-primary">  X-Device-Key: {deviceKey}</div>
                <div>  Content-Type: application/json</div>
                <div>Body:</div>
                <div>  &#123;</div>
                <div>    "heartRate": 80,</div>
                <div>    "temperature": 36.6,</div>
                <div>    "oxygenLevel": 98,</div>
                <div>    "bloodPressure": "120/80"</div>
                <div>  &#125;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
