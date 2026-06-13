import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface ActiveEmergency {
  alertId: string;
  type: string;
  message: string;
  severity: 'WARNING' | 'CRITICAL';
  vitals: {
    heartRate: number;
    temperature: number;
    oxygenLevel: number;
    bloodPressure: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
  } | null;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeEmergency: ActiveEmergency | null;
  dismissEmergency: () => void;
  latestVitalsUpdate: any | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<ActiveEmergency | null>(null);
  const [latestVitalsUpdate, setLatestVitalsUpdate] = useState<any | null>(null);

  const dismissEmergency = () => {
    setActiveEmergency(null);
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    const socketClient = io(wsUrl);

    socketClient.on('connect', () => {
      console.log('Connected to PulseCare WS Server');
      setIsConnected(true);
      // Join patient's private telemetry channel
      socketClient.emit('join', user.id);
    });

    socketClient.on('disconnect', () => {
      console.log('Disconnected from PulseCare WS Server');
      setIsConnected(false);
    });

    // Handle real-time vital telemetry pushes
    socketClient.on('vitals-update', (data: any) => {
      setLatestVitalsUpdate(data);
    });

    // Handle critical emergency alert triggers
    socketClient.on('emergency-triggered', (data: ActiveEmergency) => {
      if (data.severity === 'CRITICAL') {
        setActiveEmergency(data);
        
        // Trigger push notifications if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('PulseCare Emergency Alert!', {
            body: data.message,
            icon: '/icon-192.png',
          });
        }
      }
    });

    // Reset emergency overlay if resolved
    socketClient.on('alert-resolved', (data: any) => {
      setActiveEmergency((prev) => (prev?.alertId === data.id ? null : prev));
    });

    setSocket(socketClient);

    // Ask browser notification permission on login
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      socketClient.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeEmergency,
        dismissEmergency,
        latestVitalsUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
