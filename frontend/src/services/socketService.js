import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('🟢 Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔴 Socket disconnected manually');
    }
  }

  /**
   * Emit event to call waiter for payment
   * @param {Object} data - { tableId, tableNumber, orderId, totalAmount, customerName }
   */
  callWaiterForPayment(data) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected. Attempting to connect...');
      this.connect();
      
      // Wait a bit for connection then emit
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit('call_waiter_payment', data);
          console.log('📞 Called waiter for payment:', data);
        } else {
          console.error('❌ Failed to connect socket');
        }
      }, 500);
      return;
    }

    this.socket.emit('call_waiter_payment', data);
    console.log('📞 Called waiter for payment:', data);
  }

  /**
   * Join a table room (for receiving table-specific notifications)
   * @param {number} tableId
   */
  joinTable(tableId) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected');
      return;
    }

    this.socket.emit('join_table', tableId);
    console.log(`🏠 Joined table room: table_${tableId}`);
  }

  /**
   * Leave a table room
   * @param {number} tableId
   */
  leaveTable(tableId) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leave_table', tableId);
    console.log(`🚪 Left table room: table_${tableId}`);
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
