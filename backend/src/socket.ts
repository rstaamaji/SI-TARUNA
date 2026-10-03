import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { JwtUtil } from './utils/jwt';
import { config } from './utils/config';

let io: SocketIOServer | null = null;

export interface RealtimeNotificationPayload {
  id?: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  createdAt?: string;
  senderName?: string;
}

/**
 * Inisialisasi Socket.IO Server dan integrasikan dengan HTTP Server Express
 */
export function initSocketServer(server: http.Server): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          config.isDevelopment &&
          (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))
        ) {
          return callback(null, true);
        }
        if (origin === config.clientUrl) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware Autentikasi Socket.IO menggunakan JWT Token
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : null);

      if (token && typeof token === 'string') {
        const decoded = JwtUtil.verify(token);
        socket.data.user = decoded;
      }
      next();
    } catch (err) {
      // Izinkan koneksi tetap berlanjut sebagai guest/unauthenticated atau tunggu event 'authenticate'
      console.warn('⚠️ [Socket.IO] Token invalid or unverified during handshake:', err);
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    if (user) {
      // Gabungkan socket ke room personal pengguna dan room role
      socket.join(`user:${user.id}`);
      socket.join('authenticated');
      if (user.role === 'MEMBER') {
        socket.join('members');
      } else if (user.role === 'ADMIN') {
        socket.join('admins');
      }
      console.log(`🔌 [Socket.IO] User terhubung: ${user.username} (${user.role}) - Socket ID: ${socket.id}`);
    } else {
      console.log(`🔌 [Socket.IO] Client terhubung (unauthenticated) - Socket ID: ${socket.id}`);
    }

    // Mendengarkan event 'authenticate' jika client login setelah socket terkoneksi
    socket.on('authenticate', (token: string) => {
      try {
        if (token) {
          const decoded = JwtUtil.verify(token);
          socket.data.user = decoded;
          socket.join(`user:${decoded.id}`);
          socket.join('authenticated');
          if (decoded.role === 'MEMBER') {
            socket.join('members');
          } else if (decoded.role === 'ADMIN') {
            socket.join('admins');
          }
          socket.emit('authenticated', { success: true, user: decoded });
          console.log(`🔑 [Socket.IO] Socket ${socket.id} berhasil login sebagai: ${decoded.username}`);
        }
      } catch (err) {
        socket.emit('authenticated', { success: false, error: 'Token tidak valid' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] Client terputus (${socket.id}): ${reason}`);
    });
  });

  console.log('⚡ [Socket.IO] Realtime server initialized successfully');
  return io;
}

/**
 * Mengambil instance aktif Socket.IO Server
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Mengirimkan notifikasi realtime langsung ke satu pengguna spesifik
 */
export function emitToUser(userId: string, event: string, data: any): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Mengirimkan notifikasi broadcast realtime ke seluruh pengguna (termasuk MEMBER yang sedang login)
 * Digunakan saat ADMIN membuat pengumuman penting, rapat, kerja bakti, dll.
 */
export function broadcastRealtimeNotification(
  payload: RealtimeNotificationPayload,
  excludeUserId?: string
): void {
  if (!io) return;

  const data = {
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  if (excludeUserId) {
    // Kirim ke seluruh client selain pembuat (ADMIN)
    io.sockets.sockets.forEach((s) => {
      if (s.data.user?.id !== excludeUserId) {
        s.emit('notification:new', data);
      }
    });
  } else {
    // Broadcast ke seluruh client
    io.emit('notification:new', data);
  }

  console.log(`📢 [Socket.IO] Realtime notification broadcasted: "${payload.title}"`);
}
