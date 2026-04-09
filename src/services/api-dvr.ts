import { fetchWithAuth } from '@/services/api';
import type { DVRCamera } from '@/types';

export { fetchWithAuth };

// DVR Cameras API
export const dvrApi = {
  getAll: () => fetchWithAuth<DVRCamera[]>('/api/dvr'),
  create: (data: Partial<DVRCamera>) => 
    fetchWithAuth<DVRCamera>('/api/dvr', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<DVRCamera>) => 
    fetchWithAuth<DVRCamera>(`/api/dvr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    fetchWithAuth<null>(`/api/dvr/${id}`, {
      method: 'DELETE',
    }),
  
  // Advanced DVR features
  testConnection: (cameraData: {
    ipAddress: string;
    port?: number;
    username?: string;
    password?: string;
    model?: string;
  }) => fetchWithAuth<any>('/api/dvr/test-connection', {
    method: 'POST',
    body: JSON.stringify(cameraData),
  }),
  
  getStreamUrl: (cameraId: string, channel = 1, quality = 'main') => 
    fetchWithAuth<{ streamUrl: string }>('/api/dvr/stream-url', {
      method: 'POST',
      body: JSON.stringify({ cameraId, channel, quality }),
    }),
  
  controlPTZ: (cameraId: string, command: string, value = 0) => 
    fetchWithAuth<any>('/api/dvr/ptz-control', {
      method: 'POST',
      body: JSON.stringify({ cameraId, command, value }),
    }),
  
  startRecording: (cameraId: string, duration = 3600) => 
    fetchWithAuth<any>('/api/dvr/start-recording', {
      method: 'POST',
      body: JSON.stringify({ cameraId, duration }),
    }),
  
  stopRecording: (recordingId: string) => 
    fetchWithAuth<any>('/api/dvr/stop-recording', {
      method: 'POST',
      body: JSON.stringify({ recordingId }),
    }),
  
  getStats: () => fetchWithAuth<any>('/api/dvr/stats'),
};