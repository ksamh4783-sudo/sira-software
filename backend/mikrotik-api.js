// MikroTik API Integration Module
import { RouterOSAPI } from 'node-routeros';

// MikroTik Connection Manager
class MikroTikManager {
  constructor() {
    this.connections = new Map();
    this.connectionTimeouts = new Map();
  }

  // Connect to MikroTik device
  async connect(ipAddress, username = 'admin', password = '', port = 8728) {
    const connectionKey = `${ipAddress}:${port}`;
    
    try {
      // Check if connection already exists
      if (this.connections.has(connectionKey)) {
        const existingConn = this.connections.get(connectionKey);
        if (existingConn.connected) {
          return existingConn;
        }
      }

      // Create new connection
      const conn = new RouterOSAPI({
        host: ipAddress,
        user: username,
        password: password,
        port: port,
        timeout: 10000
      });

      // Connect to the router
      await conn.connect();
      
      // Store connection
      this.connections.set(connectionKey, conn);
      
      // Set connection timeout
      this.setConnectionTimeout(connectionKey);
      
      console.log(`✅ Connected to MikroTik: ${connectionKey}`);
      return conn;
    } catch (error) {
      console.error(`❌ Failed to connect to MikroTik ${connectionKey}:`, error.message);
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  // Set timeout for connection
  setConnectionTimeout(connectionKey) {
    // Clear existing timeout
    if (this.connectionTimeouts.has(connectionKey)) {
      clearTimeout(this.connectionTimeouts.get(connectionKey));
    }
    
    // Set new timeout (5 minutes)
    const timeout = setTimeout(() => {
      this.closeConnection(connectionKey);
    }, 5 * 60 * 1000);
    
    this.connectionTimeouts.set(connectionKey, timeout);
  }

  // Close connection
  async closeConnection(connectionKey) {
    try {
      if (this.connections.has(connectionKey)) {
        const conn = this.connections.get(connectionKey);
        if (conn && conn.connected) {
          await conn.close();
        }
        this.connections.delete(connectionKey);
      }
      
      if (this.connectionTimeouts.has(connectionKey)) {
        clearTimeout(this.connectionTimeouts.get(connectionKey));
        this.connectionTimeouts.delete(connectionKey);
      }
      
      console.log(`🔌 Closed connection: ${connectionKey}`);
    } catch (error) {
      console.error(`Error closing connection ${connectionKey}:`, error.message);
    }
  }

  // Get live statistics from MikroTik
  async getLiveStats(ipAddress, username, password, port = 8728) {
    const connectionKey = `${ipAddress}:${port}`;
    let conn;
    
    try {
      conn = await this.connect(ipAddress, username, password, port);
      
      // Get Hotspot active users
      const hotspotUsers = await conn.write('/ip/hotspot/active/print');
      const hotspotActiveCount = Array.isArray(hotspotUsers) ? hotspotUsers.length : 0;
      
      // Get PPPoE active users
      const pppoeUsers = await conn.write('/interface/pppoe-server/server/print');
      const pppoeActiveCount = Array.isArray(pppoeUsers) ? pppoeUsers.length : 0;
      
      // Get CPU load
      const systemResource = await conn.write('/system/resource/print');
      const cpuLoad = systemResource[0]?.['cpu-load'] || '0%';
      
      // Get memory usage
      const totalMemory = parseInt(systemResource[0]?.['total-memory'] || '0');
      const freeMemory = parseInt(systemResource[0]?.['free-memory'] || '0');
      const memoryUsage = totalMemory > 0 ? Math.round(((totalMemory - freeMemory) / totalMemory) * 100) : 0;
      
      // Get system uptime
      const uptime = systemResource[0]?.['uptime'] || 'Unknown';
      
      // Get interface statistics
      const interfaces = await conn.write('/interface/print');
      const totalInterfaces = Array.isArray(interfaces) ? interfaces.length : 0;
      
      // Get DHCP leases
      const dhcpLeases = await conn.write('/ip/dhcp-server/lease/print');
      const dhcpCount = Array.isArray(dhcpLeases) ? dhcpLeases.length : 0;

      // Get wireless registrations (if wireless exists)
      let wirelessCount = 0;
      try {
        const wirelessRegs = await conn.write('/interface/wireless/registration-table/print');
        wirelessCount = Array.isArray(wirelessRegs) ? wirelessRegs.length : 0;
      } catch (e) {
        // Wireless might not be available on all routers
      }

      // Set connection timeout extension
      this.setConnectionTimeout(connectionKey);
      
      return {
        success: true,
        data: {
          hotspotActiveCount,
          pppoeActiveCount,
          cpuLoad: `${cpuLoad}%`,
          memoryUsage: `${memoryUsage}%`,
          uptime,
          totalInterfaces,
          dhcpCount,
          wirelessCount,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error getting live stats from ${connectionKey}:`, error.message);
      
      // Close connection on error
      if (conn && conn.connected) {
        await this.closeConnection(connectionKey);
      }
      
      return {
        success: false,
        error: `Failed to get router statistics: ${error.message}`
      };
    }
  }

  // Get router system info
  async getSystemInfo(ipAddress, username, password, port = 8728) {
    const connectionKey = `${ipAddress}:${port}`;
    let conn;
    
    try {
      conn = await this.connect(ipAddress, username, password, port);
      
      // Get system identity
      const identity = await conn.write('/system/identity/print');
      const routerName = identity[0]?.name || 'Unknown';
      
      // Get system resource
      const systemResource = await conn.write('/system/resource/print');
      const platform = systemResource[0]?.platform || 'Unknown';
      const version = systemResource[0]?.version || 'Unknown';
      const architecture = systemResource[0]?.architecture || 'Unknown';
      
      // Get router model from board name
      const board = await conn.write('/system/routerboard/print');
      const model = board[0]?.model || 'Unknown';
      const serialNumber = board[0]?.serial || 'Unknown';
      
      // Set connection timeout extension
      this.setConnectionTimeout(connectionKey);
      
      return {
        success: true,
        data: {
          name: routerName,
          platform,
          version,
          architecture,
          model,
          serialNumber,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error getting system info from ${connectionKey}:`, error.message);
      return {
        success: false,
        error: `Failed to get system information: ${error.message}`
      };
    }
  }

  // Execute command on MikroTik
  async executeCommand(ipAddress, username, password, command, port = 8728) {
    const connectionKey = `${ipAddress}:${port}`;
    let conn;
    
    try {
      conn = await this.connect(ipAddress, username, password, port);
      
      // Execute the command
      const result = await conn.write(command);
      
      // Set connection timeout extension
      this.setConnectionTimeout(connectionKey);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error executing command on ${connectionKey}:`, error.message);
      return {
        success: false,
        error: `Command execution failed: ${error.message}`
      };
    }
  }

  // Test connection to MikroTik
  async testConnection(ipAddress, username, password, port = 8728) {
    try {
      const conn = new RouterOSAPI({
        host: ipAddress,
        user: username,
        password: password,
        port: port,
        timeout: 5000
      });

      await conn.connect();
      await conn.close();
      
      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error.message}`
      };
    }
  }

  // Get all active connections
  getActiveConnections() {
    const activeConnections = [];
    for (const [key, conn] of this.connections) {
      if (conn && conn.connected) {
        activeConnections.push(key);
      }
    }
    return activeConnections;
  }

  // Close all connections
  async closeAllConnections() {
    const promises = [];
    for (const [key] of this.connections) {
      promises.push(this.closeConnection(key));
    }
    await Promise.all(promises);
  }
}

// Create singleton instance
const mikrotikManager = new MikroTikManager();

// Handle process termination
process.on('SIGINT', async () => {
  console.log('🔄 Closing all MikroTik connections...');
  await mikrotikManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing all MikroTik connections...');
  await mikrotikManager.closeAllConnections();
  process.exit(0);
});

export default mikrotikManager;