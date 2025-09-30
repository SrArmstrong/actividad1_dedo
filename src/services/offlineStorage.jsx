const OFFLINE_STORAGE_KEYS = {
  USERS: 'offline_users',
  ATTENDANCE: 'offline_attendance', 
  PHOTOS: 'offline_photos',
  QUEUE: 'offlineQueue'
};

export class OfflineStorage {
  // Guardar datos localmente
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error guardando en offline storage:', error);
      return false;
    }
  }

  // Recuperar datos localmente
  static get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error leyendo de offline storage:', error);
      return null;
    }
  }

  // Guardar registro de asistencia offline
  static saveAttendanceRecord(record) {
    const existing = this.get(OFFLINE_STORAGE_KEYS.ATTENDANCE) || [];
    const newRecord = {
      ...record,
      id: Date.now(), // ID temporal
      synced: false,
      createdAt: new Date().toISOString()
    };
    
    existing.push(newRecord);
    this.save(OFFLINE_STORAGE_KEYS.ATTENDANCE, existing);
    return newRecord;
  }

  // Obtener registros de asistencia pendientes
  static getPendingAttendance() {
    return this.get(OFFLINE_STORAGE_KEYS.ATTENDANCE) || [];
  }

  // Marcar registro como sincronizado
  static markAsSynced(recordId) {
    const records = this.get(OFFLINE_STORAGE_KEYS.ATTENDANCE) || [];
    const updated = records.map(record => 
      record.id === recordId ? { ...record, synced: true } : record
    );
    this.save(OFFLINE_STORAGE_KEYS.ATTENDANCE, updated);
  }

  // Limpiar registros sincronizados
  static clearSyncedRecords() {
    const records = this.get(OFFLINE_STORAGE_KEYS.ATTENDANCE) || [];
    const pending = records.filter(record => !record.synced);
    this.save(OFFLINE_STORAGE_KEYS.ATTENDANCE, pending);
  }

  // Guardar foto offline (como base64)
  static savePhoto(photoBlob, filename) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photos = this.get(OFFLINE_STORAGE_KEYS.PHOTOS) || {};
        photos[filename] = reader.result; // base64
        this.save(OFFLINE_STORAGE_KEYS.PHOTOS, photos);
        resolve(filename);
      };
      reader.readAsDataURL(photoBlob);
    });
  }

  // Obtener foto offline
  static getPhoto(filename) {
    const photos = this.get(OFFLINE_STORAGE_KEYS.PHOTOS) || {};
    return photos[filename];
  }
}