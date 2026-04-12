import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dvrApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  Camera, Plus, Search, Edit2, Trash2, 
  MapPin, Video, Eye, EyeOff,
  Play, Square, Settings, RotateCcw, Download,
  Film, Radio, Wifi, WifiOff,
  Move, ZoomIn, ZoomOut
} from 'lucide-react';
import { toast } from 'sonner';
import type { DVRCamera } from '@/types';

export default function DVRCameras() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cameras, setCameras] = useState<DVRCamera[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<DVRCamera | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cameraStats, setCameraStats] = useState<any>(null);
  const [selectedCamera, setSelectedCamera] = useState<DVRCamera | null>(null);
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: 80,
    rtspPort: 554,
    httpPort: 80,
    sdkPort: 8000,
    model: 'Hikvision DS-7200',
    channel: 1,
    username: 'admin',
    password: '',
    location: '',
    streamUrl: '',
    brand: 'hikvision',
    ptzEnabled: false,
    isMotionDetection: false,
    isRecording: false,
    videoQuality: 'HD',
    frameRate: 25,
    bitRate: 2048
  });

  const cameraBrands = [
    { value: 'hikvision', label: 'Hikvision' },
    { value: 'dahua', label: 'Dahua' },
    { value: 'axis', label: 'Axis' },
    { value: 'foscam', label: 'Foscam' },
    { value: 'onvif', label: 'ONVIF Compatible' },
    { value: 'barcode', label: 'كاميرا باركود / QR Scanner' },
  ];

  const videoQualities = [
    { value: 'SD', label: 'Standard Quality (480p)' },
    { value: 'HD', label: 'High Quality (720p)' },
    { value: 'FHD', label: 'Full HD (1080p)' },
    { value: '4K', label: 'Ultra HD (4K)' }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCameras();
    fetchCameraStats();
  }, [isAuthenticated, navigate]);

  const fetchCameras = async () => {
    if (!user) return;
    const result = await dvrApi.getAll();
    if (result.success && result.data) {
      setCameras(result.data);
    }
  };

  const fetchCameraStats = async () => {
    if (!user) return;
    // For now, calculate stats locally since getStats is not available
    const stats = {
      total: cameras.length,
      online: cameras.filter(c => c.status === 'online').length,
      offline: cameras.filter(c => c.status === 'offline').length,
      recording: cameras.filter(c => c.isRecording).length,
      onlinePercentage: cameras.length > 0 ? Math.round((cameras.filter(c => c.status === 'online').length / cameras.length) * 100) : 0
    };
    setCameraStats(stats);
  };

  const testConnection = async () => {
    if (!formData.ipAddress) {
      toast.error('من فضلك أدخل عنوان IP للكاميرا');
      return;
    }

    try {
      const result = await fetch('/api/dvr/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ipAddress: formData.ipAddress,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          model: formData.model
        })
      });

      const data = await result.json();
      
      if (data.success) {
        toast.success('تم الاتصال بالكاميرا بنجاح!');
      setFormData(prev => ({ ...prev }));
      } else {
        toast.error('فشل الاتصال بالكاميرا: ' + (data.error || 'تحقق من الإعدادات'));
      }
    } catch (error) {
      toast.error('خطأ في اختبار الاتصال: ' + (error as Error).message);
    }
  };

  const getStreamUrl = async (camera: DVRCamera, channel = 1, quality = 'main') => {
    try {
      const result = await fetch('/api/dvr/stream-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cameraId: camera.id,
          channel,
          quality
        })
      });

      const data = await result.json();
      
      if (data.success) {
        return data.data.streamUrl;
      } else {
        toast.error('فشل الحصول على رابط البث');
        return '';
      }
    } catch (error: any) {
      toast.error('خطأ في الحصول على رابط البث: ' + (error.message || 'خطأ غير معروف'));
      return '';
    }
  };

  const handleStream = async (camera: DVRCamera) => {
    setSelectedCamera(camera);
    const url = await getStreamUrl(camera);
    setStreamUrl(url);
    setIsStreamDialogOpen(true);
  };

  const handlePTZ = async (command: string, value = 0) => {
    if (!selectedCamera) return;

    try {
      const result = await fetch('/api/dvr/ptz-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cameraId: selectedCamera.id,
          command,
          value
        })
      });

      const data = await result.json();
      
      if (data.success) {
        toast.success(`تم تنفيذ أمر ${command} بنجاح`);
      } else {
        toast.error('فشل تنفيذ أمر PTZ: ' + (data.error || 'غير معروف'));
      }
    } catch (error: any) {
      toast.error('خطأ في التحكم PTZ: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  const startRecording = async (camera: DVRCamera) => {
    try {
      const result = await fetch('/api/dvr/start-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cameraId: camera.id,
          duration: 3600 // 1 hour
        })
      });

      const data = await result.json();
      
      if (data.success) {
        setIsRecording(true);
        toast.success('تم بدء التسجيل بنجاح');
      } else {
        toast.error('فشل بدء التسجيل: ' + (data.error || 'غير معروف'));
      }
    } catch (error: any) {
      toast.error('خطأ في بدء التسجيل: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      const result = await fetch('/api/dvr/stop-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recordingId: 'current-recording'
        })
      });

      const data = await result.json();
      
      if (data.success) {
        setIsRecording(false);
        toast.success('تم إيقاف التسجيل بنجاح');
      } else {
        toast.error('فشل إيقاف التسجيل: ' + (data.error || 'غير معروف'));
      }
    } catch (error: any) {
      toast.error('خطأ في إيقاف التسجيل: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cameraData = {
      ...formData,
      brand: cameraBrands.find(b => formData.model.toLowerCase().includes(b.value))?.value || 'onvif'
    };

    if (editingCamera) {
      const result = await dvrApi.update(editingCamera.id, cameraData);
      if (result.success) {
        toast.success('تم تحديث الكاميرا بنجاح');
        fetchCameras();
        setIsAddDialogOpen(false);
        setEditingCamera(null);
      }
    } else {
      const result = await dvrApi.create(cameraData);
      if (result.success) {
        toast.success('تم إضافة الكاميرا بنجاح');
        fetchCameras();
        fetchCameraStats();
        setIsAddDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (camera: DVRCamera) => {
    if (!user) return;
    if (confirm('هل أنت متأكد من حذف هذه الكاميرا؟')) {
      const result = await dvrApi.delete(camera.id);
      if (result.success) {
        toast.success('تم حذف الكاميرا بنجاح');
        fetchCameras();
        fetchCameraStats();
      }
    }
  };

  const handleEdit = async (camera: DVRCamera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      ipAddress: camera.ipAddress,
      port: camera.port,
      rtspPort: camera.rtspPort || 554,
      httpPort: camera.httpPort || 80,
      sdkPort: camera.sdkPort || 8000,
      model: camera.model,
      channel: camera.channel,
      username: camera.username,
      password: camera.password,
      location: camera.location || '',
      streamUrl: camera.streamUrl || '',
      brand: camera.brand || 'hikvision',
      ptzEnabled: camera.ptzEnabled || false,
      isMotionDetection: camera.isMotionDetection || false,
      isRecording: camera.isRecording || false,
      videoQuality: camera.videoQuality || 'HD',
      frameRate: camera.frameRate || 25,
      bitRate: camera.bitRate || 2048
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      port: 80,
      rtspPort: 554,
      httpPort: 80,
      sdkPort: 8000,
      model: 'Hikvision DS-7200',
      channel: 1,
      username: 'admin',
      password: '',
      location: '',
      streamUrl: '',
      brand: 'hikvision',
      ptzEnabled: false,
      isMotionDetection: false,
      isRecording: false,
      videoQuality: 'HD',
      frameRate: 25,
      bitRate: 2048
    });
  };

  const filteredCameras = cameras.filter(camera =>
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.ipAddress.includes(searchQuery) ||
    camera.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addDialog = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingCamera(null); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة كاميرا
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCamera ? 'تعديل كاميرا' : 'إضافة كاميرا DVR جديدة'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>اسم الكاميرا</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="مثال: كاميرا المدخل الرئيسي"
                        required
                      />
                    </div>
                    <div>
                      <Label>نوع / ماركة الكاميرا</Label>
                      <select
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                      >
                        {cameraBrands.map(brand => (
                          <option key={brand.value} value={brand.value}>{brand.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>الموديل</Label>
                    <Input 
                      value={formData.model} 
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      placeholder="مثال: Hikvision DS-7200"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>عنوان IP</Label>
                      <Input 
                        value={formData.ipAddress} 
                        onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                        placeholder="192.168.1.100"
                        required
                      />
                    </div>
                    <div>
                      <Label>المنفذ HTTP</Label>
                      <Input 
                        type="number"
                        value={formData.httpPort} 
                        onChange={(e) => setFormData({...formData, httpPort: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div>
                      <Label>منفذ RTSP</Label>
                      <Input 
                        type="number"
                        value={formData.rtspPort} 
                        onChange={(e) => setFormData({...formData, rtspPort: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>القناة</Label>
                      <Input 
                        type="number"
                        value={formData.channel} 
                        onChange={(e) => setFormData({...formData, channel: parseInt(e.target.value)})}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>اسم المستخدم</Label>
                      <Input 
                        value={formData.username} 
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>كلمة المرور</Label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password} 
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="absolute left-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>الموقع</Label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="مثال: المدخل الأمامي"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>جودة الفيديو</Label>
                      <select
                        value={formData.videoQuality}
                        onChange={(e) => setFormData({...formData, videoQuality: e.target.value})}
                        className="w-full p-2 border rounded-md"
                      >
                        {videoQualities.map(quality => (
                          <option key={quality.value} value={quality.value}>{quality.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>معدل الإطارات</Label>
                      <Input 
                        type="number"
                        value={formData.frameRate} 
                        onChange={(e) => setFormData({...formData, frameRate: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="ptzEnabled"
                        checked={formData.ptzEnabled}
                        onChange={(e) => setFormData({...formData, ptzEnabled: e.target.checked})}
                      />
                      <Label htmlFor="ptzEnabled">تمكين PTZ</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isMotionDetection"
                        checked={formData.isMotionDetection}
                        onChange={(e) => setFormData({...formData, isMotionDetection: e.target.checked})}
                      />
                      <Label htmlFor="isMotionDetection">كشف الحركة</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isRecording"
                        checked={formData.isRecording}
                        onChange={(e) => setFormData({...formData, isRecording: e.target.checked})}
                      />
                      <Label htmlFor="isRecording">تسجيل تلقائي</Label>
                    </div>
                  </div>

                  <div>
                    <Label>رابط البث (Stream URL)</Label>
                    <Input 
                      value={formData.streamUrl} 
                      onChange={(e) => setFormData({...formData, streamUrl: e.target.value})}
                      placeholder="rtsp://... (اختياري)"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingCamera ? 'تحديث' : 'إضافة'}
                    </Button>
                    <Button type="button" variant="outline" onClick={testConnection}>
                      <Radio className="w-4 h-4 ml-2" />
                      اختبار الاتصال
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
  );

  return (
    <Layout title="كاميرات DVR" actions={addDialog}>
      <div className="space-y-5">
          {/* Stats */}
          {cameraStats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">إجمالي الكاميرات</p>
                    <p className="text-2xl font-bold">{cameraStats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">متصلة</p>
                    <p className="text-2xl font-bold">{cameraStats.online}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <WifiOff className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">غير متصلة</p>
                    <p className="text-2xl font-bold">{cameraStats.offline}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Film className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">قيد التسجيل</p>
                    <p className="text-2xl font-bold">{cameraStats.recording}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Video className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">نسبة الاتصال</p>
                    <p className="text-2xl font-bold">{cameraStats.onlinePercentage}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="البحث في الكاميرات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Cameras Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCameras.map((camera) => (
              <Card key={camera.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        camera.status === 'online' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {camera.status === 'online' ? (
                          <Wifi className={`w-5 h-5 text-green-600`} />
                        ) : (
                          <WifiOff className={`w-5 h-5 text-red-600`} />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{camera.name}</CardTitle>
                        <Badge variant={camera.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                          {camera.status === 'online' ? 'متصلة' : 'غير متصلة'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleStream(camera)}>
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(camera)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(camera)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Radio className="w-4 h-4" />
                      <span>{camera.ipAddress}:{camera.port}</span>
                    </div>
                    {camera.model && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Camera className="w-4 h-4" />
                        <span>{camera.model}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Video className="w-4 h-4" />
                      <span>قناة {camera.channel}</span>
                    </div>
                    {camera.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{camera.location}</span>
                      </div>
                    )}
                    {camera.videoQuality && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Settings className="w-4 h-4" />
                        <span>{camera.videoQuality} - {camera.frameRate}fps</span>
                      </div>
                    )}
                    {camera.ptzEnabled && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Move className="w-4 h-4" />
                        <span>PTZ مُمَكَّن</span>
                      </div>
                    )}
                    {camera.isRecording && (
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        <span>قيد التسجيل</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleStream(camera)}
                      className="flex-1"
                    >
                      <Play className="w-3 h-3 ml-1" />
                      مشاهدة
                    </Button>
                    {camera.ptzEnabled && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { setSelectedCamera(camera); setIsStreamDialogOpen(true); }}
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCameras.length === 0 && (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">لا توجد كاميرات</h3>
              <p className="text-gray-400">قم بإضافة كاميرا DVR جديدة</p>
            </div>
          )}
      {/* Stream Dialog */}
      <Dialog open={isStreamDialogOpen} onOpenChange={setIsStreamDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>مشاهدة البث المباشر - {selectedCamera?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {streamUrl ? (
              <div className="relative">
                <video
                  src={streamUrl}
                  controls
                  autoPlay
                  className="w-full h-64 bg-black rounded-lg"
                  onError={() => toast.error('فشل تحميل البث')}
                />
                {selectedCamera?.ptzEnabled && (
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handlePTZ('up')}>
                        <Move className="w-4 h-4 rotate-0" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handlePTZ('left')}>
                        <Move className="w-4 h-4 rotate-90" />
                      </Button>
                      <Button size="sm" onClick={() => handlePTZ('stop')}>
                        <Square className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => handlePTZ('right')}>
                        <Move className="w-4 h-4 -rotate-90" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handlePTZ('down')}>
                        <Move className="w-4 h-4 rotate-180" />
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" onClick={() => handlePTZ('zoomin')}>
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => handlePTZ('zoomout')}>
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>جاري تحميل البث...</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={isRecording ? "destructive" : "default"}
                  onClick={isRecording ? stopRecording : () => startRecording(selectedCamera!)}
                >
                  {isRecording ? (
                    <><Square className="w-4 h-4 ml-1" /> إيقاف التسجيل</>
                  ) : (
                    <><Play className="w-4 h-4 ml-1" /> تسجيل</>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setStreamUrl('')}
                >
                  <RotateCcw className="w-4 h-4 ml-1" />
                  إعادة تحميل
                </Button>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(streamUrl, '_blank')}
              >
                <Download className="w-4 h-4 ml-1" />
                فتح في نافذة جديدة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}