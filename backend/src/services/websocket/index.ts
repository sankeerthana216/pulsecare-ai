import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export class WebSocketService {
  private static io: Server | null = null;

  public static initialize(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Allow connections from all origins for flexible deployment
        methods: ['GET', 'POST'],
      },
    });

    console.log('WebSocket Server (Socket.IO) initialized.');

    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket client connected: ${socket.id}`);

      // Allow users to join a user-specific room
      socket.on('join', (userId: string) => {
        socket.join(userId);
        console.log(`Socket client ${socket.id} joined room: ${userId}`);
      });

      socket.on('leave', (userId: string) => {
        socket.leave(userId);
        console.log(`Socket client ${socket.id} left room: ${userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Socket client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  public static getIO(): Server {
    if (!this.io) {
      throw new Error('WebSocket Server has not been initialized yet.');
    }
    return this.io;
  }

  /**
   * Send a real-time event to a specific user
   */
  public static emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(userId).emit(event, data);
      console.log(`Emitted WebSocket event '${event}' to user room: ${userId}`);
    } else {
      console.warn('Socket.IO not initialized. Skipping broadcast.');
    }
  }

  /**
   * Broadcast an event to all connected sockets
   */
  public static broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
