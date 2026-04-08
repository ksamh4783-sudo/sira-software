// DVR Camera API Service
import type { DVRCamera } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * DVR Camera API service with advanced features
 */
export const dvrApi = {
  // Get all cameras
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/api/dvr`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cameras');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cameras:', error);
      return { success: false, error: 'Failed to fetch cameras' };
    }
  },

  // Create new camera
  async create(cameraData: Partial<DVRCamera>) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(cameraData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error creating camera:', error);
      return { success: false, error: 'Failed to create camera' };
    }
  },

  // Update camera
  async update(id: string, cameraData: Partial<DVRCamera>) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(cameraData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error updating camera:', error);
      return { success: false, error: 'Failed to update camera' };
    }
  },

  // Delete camera
  async delete(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting camera:', error);
      return { success: false, error: 'Failed to delete camera' };
    }
  },

  // Test camera connection
  async testConnection(cameraData: {
    ipAddress: string;
    port?: number;
    username?: string;
    password?: string;
    model?: string;
  }) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...cameraData,
          port: cameraData.port || 80,
          username: cameraData.username || 'admin',
          model: cameraData.model || 'Hikvision DS-7200'
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, error: 'Failed to test connection' };
    }
  },

  // Get camera stream URL
  async getStreamUrl(cameraId: string, channel = 1, quality = 'main') {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/stream-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cameraId,
          channel,
          quality
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error getting stream URL:', error);
      return { success: false, error: 'Failed to get stream URL' };
    }
  },

  // Control PTZ (Pan, Tilt, Zoom)
  async controlPTZ(cameraId: string, command: string, value = 0) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/ptz-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cameraId,
          command,
          value
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error controlling PTZ:', error);
      return { success: false, error: 'Failed to control PTZ' };
    }
  },

  // Start recording
  async startRecording(cameraId: string, duration = 3600) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/start-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cameraId,
          duration
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error starting recording:', error);
      return { success: false, error: 'Failed to start recording' };
    }
  },

  // Stop recording
  async stopRecording(recordingId: string) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/stop-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recordingId
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error stopping recording:', error);
      return { success: false, error: 'Failed to stop recording' };
    }
  },

  // Get camera statistics
  async getStats() {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error getting stats:', error);
      return { success: false, error: 'Failed to get stats' };
    }
  },

  // Get recording tasks
  async getRecordings() {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/recordings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error getting recordings:', error);
      return { success: false, error: 'Failed to get recordings' };
    }
  },

  // Get camera info (device info)
  async getCameraInfo(cameraId: string) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/${cameraId}/info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error getting camera info:', error);
      return { success: false, error: 'Failed to get camera info' };
    }
  },

  // Motion detection settings
  async updateMotionDetection(cameraId: string, settings: {
    enabled: boolean;
    sensitivity?: number;
    zones?: any[];
    schedules?: any[];
  }) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/${cameraId}/motion-detection`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error updating motion detection:', error);
      return { success: false, error: 'Failed to update motion detection' };
    }
  },

  // Camera presets management
  async getPresets(cameraId: string) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/${cameraId}/presets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error getting presets:', error);
      return { success: false, error: 'Failed to get presets' };
    }
  },

  async savePreset(cameraId: string, presetName: string, presetNumber: number) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/${cameraId}/presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: presetName,
          number: presetNumber
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error saving preset:', error);
      return { success: false, error: 'Failed to save preset' };
    }
  },

  async gotoPreset(cameraId: string, presetNumber: number) {
    try {
      const response = await fetch(`${API_BASE}/api/dvr/${cameraId}/presets/goto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          number: presetNumber
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error going to preset:', error);
      return { success: false, error: 'Failed to go to preset' };
    }
  }
};

export default dvrApi;