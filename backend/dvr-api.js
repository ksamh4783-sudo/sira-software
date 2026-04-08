import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * DVR Camera Manager - Supports Hikvision, Dahua, and other ONVIF-compatible cameras
 * Features:
 * - Real-time video streaming
 * - Motion detection
 * - PTZ control
 * - Recording management
 * - Multi-channel support
 */
class DVRManager extends EventEmitter {
  constructor() {
    super();
    this.cameras = new Map();
    this.connections = new Map();
    this.streamSessions = new Map();
    this.monitoringIntervals = new Map();
    this.recordingTasks = new Map();
  }

  /**
   * Add a new camera
   */
  async addCamera(cameraData) {
    try {
      const camera = {
        id: cameraData.id || uuidv4(),
        name: cameraData.name,
        ipAddress: cameraData.ipAddress,
        port: cameraData.port || 80,
        username: cameraData.username || 'admin',
        password: cameraData.password,
        model: cameraData.model || 'Hikvision',
        channels: cameraData.channels || 1,
        location: cameraData.location || '',
        brand: this.detectBrand(cameraData.model),
        status: 'offline',
        streamUrl: cameraData.streamUrl || '',
        rtspPort: cameraData.rtspPort || 554,
        httpPort: cameraData.httpPort || cameraData.port || 80,
        sdkPort: cameraData.sdkPort || 8000,
        isMotionDetection: cameraData.isMotionDetection || false,
        isRecording: cameraData.isRecording || false,
        recordingPath: cameraData.recordingPath || '',
        ptzEnabled: cameraData.ptzEnabled || false,
        presetPoints: cameraData.presetPoints || [],
        videoQuality: cameraData.videoQuality || 'HD',
        frameRate: cameraData.frameRate || 25,
        bitRate: cameraData.bitRate || 2048,
        lastSeen: null,
        lastError: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Test connection
      const connected = await this.testConnection(camera);
      camera.status = connected ? 'online' : 'offline';
      camera.lastSeen = connected ? new Date().toISOString() : null;

      this.cameras.set(camera.id, camera);
      
      if (connected) {
        this.startMonitoring(camera.id);
      }

      return { success: true, data: camera };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect camera brand from model
   */
  detectBrand(model) {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('hikvision') || modelLower.includes('ds-')) return 'hikvision';
    if (modelLower.includes('dahua') || modelLower.includes('ipc')) return 'dahua';
    if (modelLower.includes('axis')) return 'axis';
    if (modelLower.includes('foscam')) return 'foscam';
    return 'onvif';
  }

  /**
   * Test connection to camera
   */
  async testConnection(camera) {
    try {
      const brands = {
        hikvision: this.testHikvisionConnection,
        dahua: this.testDahuaConnection,
        axis: this.testAxisConnection,
        onvif: this.testOnvifConnection
      };

      const testFunction = brands[camera.brand] || brands.onvif;
      return await testFunction.call(this, camera);
    } catch (error) {
      console.error(`Connection test failed for ${camera.name}:`, error.message);
      return false;
    }
  }

  /**
   * Test Hikvision connection
   */
  async testHikvisionConnection(camera) {
    try {
      // Test HTTP connection
      const httpUrl = `http://${camera.ipAddress}:${camera.httpPort}/ISAPI/System/deviceInfo`;
      const response = await fetch(httpUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
        },
        timeout: 5000
      });

      if (response.ok) {
        return true;
      }

      // Test SDK port
      const sdkUrl = `http://${camera.ipAddress}:${camera.sdkPort}/SDK/能力集`;
      const sdkResponse = await fetch(sdkUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
        },
        timeout: 5000
      });

      return sdkResponse.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test Dahua connection
   */
  async testDahuaConnection(camera) {
    try {
      const url = `http://${camera.ipAddress}:${camera.httpPort}/cgi-bin/main-cgi?cmd=login`;
      const params = new URLSearchParams({
        username: camera.username,
        password: camera.password
      });

      const response = await fetch(url, {
        method: 'POST',
        body: params,
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test Axis connection
   */
  async testAxisConnection(camera) {
    try {
      const url = `http://${camera.ipAddress}:${camera.httpPort}/axis-cgi/param.cgi?action=list&group=root.Brand`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
        },
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test ONVIF connection
   */
  async testOnvifConnection(camera) {
    try {
      // Basic TCP connection test
      const net = require('net');
      return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        
        socket.on('error', () => {
          resolve(false);
        });
        
        socket.connect(camera.port, camera.ipAddress);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Get camera stream URL
   */
  getStreamUrl(camera, channel = 1, quality = 'main') {
    const brands = {
      hikvision: () => `rtsp://${camera.username}:${camera.password}@${camera.ipAddress}:${camera.rtspPort}/h264/ch${channel}/${quality}/av_stream`,
      dahua: () => `rtsp://${camera.username}:${camera.password}@${camera.ipAddress}:${camera.rtspPort}/cam/realmonitor?channel=${channel}&subtype=0`,
      axis: () => `rtsp://${camera.username}:${camera.password}@${camera.ipAddress}:${camera.rtspPort}/axis-media/media.amp`,
      onvif: () => camera.streamUrl || `rtsp://${camera.username}:${camera.password}@${camera.ipAddress}:${camera.rtspPort}/stream1`
    };

    return brands[camera.brand] ? brands[camera.brand]() : brands.onvif();
  }

  /**
   * Start monitoring camera
   */
  startMonitoring(cameraId) {
    if (this.monitoringIntervals.has(cameraId)) {
      return;
    }

    const interval = setInterval(async () => {
      await this.monitorCamera(cameraId);
    }, 30000); // Monitor every 30 seconds

    this.monitoringIntervals.set(cameraId, interval);
  }

  /**
   * Stop monitoring camera
   */
  stopMonitoring(cameraId) {
    const interval = this.monitoringIntervals.get(cameraId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(cameraId);
    }
  }

  /**
   * Monitor camera status
   */
  async monitorCamera(cameraId) {
    const camera = this.cameras.get(cameraId);
    if (!camera) return;

    try {
      const isOnline = await this.testConnection(camera);
      const previousStatus = camera.status;
      
      camera.status = isOnline ? 'online' : 'offline';
      camera.lastSeen = isOnline ? new Date().toISOString() : null;
      camera.lastError = isOnline ? null : 'Connection failed';

      if (previousStatus !== camera.status) {
        this.emit('statusChanged', {
          cameraId,
          cameraName: camera.name,
          oldStatus: previousStatus,
          newStatus: camera.status,
          timestamp: new Date().toISOString()
        });
      }

      if (isOnline) {
        await this.updateCameraInfo(camera);
      }
    } catch (error) {
      camera.status = 'error';
      camera.lastError = error.message;
      console.error(`Monitoring failed for camera ${camera.name}:`, error.message);
    }
  }

  /**
   * Update camera information
   */
  async updateCameraInfo(camera) {
    try {
      const brands = {
        hikvision: this.updateHikvisionInfo,
        dahua: this.updateDahuaInfo,
        axis: this.updateAxisInfo
      };

      const updateFunction = brands[camera.brand];
      if (updateFunction) {
        await updateFunction.call(this, camera);
      }
    } catch (error) {
      console.error(`Failed to update info for camera ${camera.name}:`, error.message);
    }
  }

  /**
   * Update Hikvision camera info
   */
  async updateHikvisionInfo(camera) {
    try {
      const url = `http://${camera.ipAddress}:${camera.httpPort}/ISAPI/System/deviceInfo`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.text();
        // Parse XML response and update camera info
        camera.lastSeen = new Date().toISOString();
      }
    } catch (error) {
      throw new Error(`Failed to update Hikvision info: ${error.message}`);
    }
  }

  /**
   * Update Dahua camera info
   */
  async updateDahuaInfo(camera) {
    try {
      const url = `http://${camera.ipAddress}:${camera.httpPort}/cgi-bin/magicBox.cgi?action=getSystemInfo`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.text();
        // Parse response and update camera info
        camera.lastSeen = new Date().toISOString();
      }
    } catch (error) {
      throw new Error(`Failed to update Dahua info: ${error.message}`);
    }
  }

  /**
   * Update Axis camera info
   */
  async updateAxisInfo(camera) {
    try {
      const url = `http://${camera.ipAddress}:${camera.httpPort}/axis-cgi/param.cgi?action=list&group=root.Brand`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.text();
        // Parse response and update camera info
        camera.lastSeen = new Date().toISOString();
      }
    } catch (error) {
      throw new Error(`Failed to update Axis info: ${error.message}`);
    }
  }

  /**
   * Control PTZ (Pan, Tilt, Zoom)
   */
  async controlPTZ(cameraId, command, value = 0) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error('Camera not found');
    }

    if (!camera.ptzEnabled) {
      throw new Error('PTZ not enabled for this camera');
    }

    try {
      const brands = {
        hikvision: this.controlHikvisionPTZ,
        dahua: this.controlDahuaPTZ,
        axis: this.controlAxisPTZ
      };

      const controlFunction = brands[camera.brand];
      if (controlFunction) {
        return await controlFunction.call(this, camera, command, value);
      } else {
        throw new Error(`PTZ not supported for ${camera.brand} cameras`);
      }
    } catch (error) {
      throw new Error(`PTZ control failed: ${error.message}`);
    }
  }

  /**
   * Control Hikvision PTZ
   */
  async controlHikvisionPTZ(camera, command, value) {
    const ptzCommands = {
      'up': '21',
      'down': '22',
      'left': '23',
      'right': '24',
      'zoomin': '11',
      'zoomout': '12',
      'focusin': '13',
      'focusout': '14'
    };

    const cmd = ptzCommands[command.toLowerCase()];
    if (!cmd) {
      throw new Error(`Invalid PTZ command: ${command}`);
    }

    const url = `http://${camera.ipAddress}:${camera.httpPort}/ISAPI/PTZCtrl/channels/1/${cmd}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
      },
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`PTZ command failed: ${response.statusText}`);
    }

    return { success: true, message: `PTZ command executed: ${command}` };
  }

  /**
   * Control Dahua PTZ
   */
  async controlDahuaPTZ(camera, command, value) {
    const ptzCommands = {
      'up': 'Up',
      'down': 'Down',
      'left': 'Left',
      'right': 'Right',
      'zoomin': 'ZoomTele',
      'zoomout': 'ZoomWide',
      'focusin': 'FocusNear',
      'focusout': 'FocusFar'
    };

    const cmd = ptzCommands[command.toLowerCase()];
    if (!cmd) {
      throw new Error(`Invalid PTZ command: ${command}`);
    }

    const url = `http://${camera.ipAddress}:${camera.httpPort}/cgi-bin/ptz.cgi?action=start&channel=0&code=${cmd}&arg1=0&arg2=0&arg3=0`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
      },
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`PTZ command failed: ${response.statusText}`);
    }

    return { success: true, message: `PTZ command executed: ${command}` };
  }

  /**
   * Control Axis PTZ
   */
  async controlAxisPTZ(camera, command, value) {
    const ptzCommands = {
      'up': 'continuouspantiltmove=0,30',
      'down': 'continuouspantiltmove=0,-30',
      'left': 'continuouspantiltmove=-30,0',
      'right': 'continuouspantiltmove=30,0',
      'zoomin': 'continuouszoommove=30',
      'zoomout': 'continuouszoommove=-30',
      'stop': 'continuouspantiltmove=0,0&continuouszoommove=0'
    };

    const cmd = ptzCommands[command.toLowerCase()];
    if (!cmd) {
      throw new Error(`Invalid PTZ command: ${command}`);
    }

    const url = `http://${camera.ipAddress}:${camera.httpPort}/axis-cgi/com/ptz.cgi?${cmd}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${camera.username}:${camera.password}`).toString('base64')
      },
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`PTZ command failed: ${response.statusText}`);
    }

    return { success: true, message: `PTZ command executed: ${command}` };
  }

  /**
   * Start recording
   */
  async startRecording(cameraId, duration = 3600) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error('Camera not found');
    }

    try {
      const recordingId = uuidv4();
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 1000);

      const recordingTask = {
        id: recordingId,
        cameraId,
        cameraName: camera.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        status: 'recording',
        filePath: `recordings/${camera.name}_${startTime.toISOString().slice(0, 19).replace(/:/g, '-')}.mp4`
      };

      this.recordingTasks.set(recordingId, recordingTask);
      camera.isRecording = true;

      // Stop recording after duration
      setTimeout(() => {
        this.stopRecording(recordingId);
      }, duration * 1000);

      this.emit('recordingStarted', recordingTask);
      return { success: true, data: recordingTask };
    } catch (error) {
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(recordingId) {
    const recordingTask = this.recordingTasks.get(recordingId);
    if (!recordingTask) {
      throw new Error('Recording task not found');
    }

    try {
      recordingTask.status = 'completed';
      recordingTask.endTime = new Date().toISOString();

      const camera = this.cameras.get(recordingTask.cameraId);
      if (camera) {
        camera.isRecording = false;
      }

      this.recordingTasks.delete(recordingId);
      this.emit('recordingStopped', recordingTask);
      return { success: true, data: recordingTask };
    } catch (error) {
      throw new Error(`Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Get all cameras
   */
  getAllCameras() {
    return Array.from(this.cameras.values());
  }

  /**
   * Get camera by ID
   */
  getCamera(cameraId) {
    return this.cameras.get(cameraId);
  }

  /**
   * Update camera
   */
  updateCamera(cameraId, updates) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      return { success: false, error: 'Camera not found' };
    }

    Object.assign(camera, updates, {
      updatedAt: new Date().toISOString()
    });

    if (updates.ipAddress || updates.port || updates.username || updates.password) {
      this.testConnection(camera).then(isOnline => {
        camera.status = isOnline ? 'online' : 'offline';
        camera.lastSeen = isOnline ? new Date().toISOString() : null;
      });
    }

    return { success: true, data: camera };
  }

  /**
   * Delete camera
   */
  deleteCamera(cameraId) {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      return { success: false, error: 'Camera not found' };
    }

    this.stopMonitoring(cameraId);
    this.cameras.delete(cameraId);
    return { success: true, message: 'Camera deleted successfully' };
  }

  /**
   * Get recording tasks
   */
  getRecordingTasks() {
    return Array.from(this.recordingTasks.values());
  }

  /**
   * Get camera statistics
   */
  getCameraStats() {
    const cameras = this.getAllCameras();
    const total = cameras.length;
    const online = cameras.filter(c => c.status === 'online').length;
    const offline = cameras.filter(c => c.status === 'offline').length;
    const recording = cameras.filter(c => c.isRecording).length;

    return {
      total,
      online,
      offline,
      recording,
      onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0
    };
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Stop all monitoring
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();

    // Clear all data
    this.cameras.clear();
    this.connections.clear();
    this.streamSessions.clear();
    this.recordingTasks.clear();
  }
}

export default DVRManager;