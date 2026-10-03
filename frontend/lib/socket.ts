import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000');

/**
 * Mendapatkan atau menginisialisasi singleton instance Socket.IO client
 */
export function getSocket(): Socket {
  if (!socket) {
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }

    socket = io(SOCKET_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      auth: {
        token: token || '',
      },
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO Client] Terhubung ke realtime server SI-TARUNA:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket.IO Client] Terputus dari realtime server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [Socket.IO Client] Koneksi error:', error.message);
    });
  }

  return socket;
}

/**
 * Hubungkan socket dengan token terbaru dari localStorage
 */
export function connectSocket(): Socket {
  const s = getSocket();
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  if (s && token) {
    s.auth = { token };
  }

  if (!s.connected) {
    s.connect();
  }

  return s;
}

/**
 * Putuskan koneksi socket (misalnya saat logout)
 */
export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
