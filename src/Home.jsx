import './styles/Home.css';
import { useEffect, useState } from 'react';
import Camera from './components/Camara.jsx';
import NetworkStatus from './components/NetworkStatus/NetworkStatus';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useOfflineFetch } from './hooks/useOfflineFetch';
import { OfflineStorage } from './services/offlineStorage';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de usuario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const [formError, setFormError] = useState(null);

  // Geolocalización
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState(null);

  // Estados offline/online
  const { isOnline, offlineQueue, addToOfflineQueue } = useNetworkStatus();
  const { fetchWithFallback, offlineFetch } = useOfflineFetch();

  // Cargar usuarios con soporte offline
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const usersData = await fetchWithFallback(
          'http://localhost:3000/users',
          {},
          OfflineStorage.get('cached_users') || [] // Fallback offline
        );
        
        setUsers(usersData);
        
        // Guardar cache para uso offline
        if (isOnline) {
          OfflineStorage.save('cached_users', usersData);
        }
      } catch (err) {
        console.error('Error cargando usuarios:', err);
        
        // Intentar usar datos cacheados como último recurso
        const cachedUsers = OfflineStorage.get('cached_users');
        if (cachedUsers) {
          setUsers(cachedUsers);
          setError('Usando datos cacheados - Sin conexión');
        } else {
          setError('No se pudieron cargar los usuarios.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isOnline]);

  // Sincronizar datos pendientes cuando vuelve la conexión
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncPendingData();
    }
  }, [isOnline, offlineQueue.length]);

  // Función para sincronizar datos pendientes
  const syncPendingData = async () => {
    try {
      const pendingAttendance = OfflineStorage.getPendingAttendance();
      
      for (const record of pendingAttendance) {
        if (!record.synced) {
          await syncAttendanceRecord(record);
        }
      }
      
      console.log('Datos pendientes sincronizados');
    } catch (error) {
      console.error('Error sincronizando datos pendientes:', error);
    }
  };

  // Sincronizar registro de asistencia
  const syncAttendanceRecord = async (record) => {
    try {
      const response = await fetch('http://localhost:3000/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record)
      });

      if (response.ok) {
        OfflineStorage.markAsSynced(record.id);
      }
    } catch (error) {
      console.error('Error sincronizando registro:', error);
    }
  };

  // Función para obtener ubicación una vez
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no es soportada por este navegador');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(position.timestamp).toLocaleString(),
          address: 'Obteniendo dirección...'
        });
        setLocationLoading(false);
        
        // Obtener dirección basada en coordenadas
        getAddressFromCoords(latitude, longitude);
      },
      (error) => {
        let errorMessage = 'Error al obtener la ubicación: ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Usuario denegó el permiso de ubicación';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage += 'Tiempo de espera agotado';
            break;
          default:
            errorMessage += 'Error desconocido';
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Función para iniciar seguimiento continuo de ubicación
  const startLocationTracking = () => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no es soportada por este navegador');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy,
          speed: speed || 0,
          heading: heading || null,
          timestamp: new Date(position.timestamp).toLocaleString(),
          tracking: true
        });
      },
      (error) => {
        let errorMessage = 'Error en seguimiento: ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage += 'Tiempo de espera agotado';
            break;
          default:
            errorMessage += 'Error desconocido';
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 2000
      }
    );

    setLocationWatchId(watchId);
  };

  // Función para detener el seguimiento
  const stopLocationTracking = () => {
    if (locationWatchId) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
      setLocation(prev => prev ? { ...prev, tracking: false } : null);
    }
  };

  // Obtener dirección a partir de coordenadas
  const getAddressFromCoords = async (lat, lng) => {
    try {
      // Solo intentar obtener dirección si estamos online
      if (!isOnline) {
        setLocation(prev => ({
          ...prev,
          address: 'Dirección no disponible (modo offline)'
        }));
        return;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setLocation(prev => ({
          ...prev,
          address: data.display_name
        }));
      }
    } catch (error) {
      console.error('Error al obtener dirección:', error);
      setLocation(prev => ({
        ...prev,
        address: 'Error obteniendo dirección'
      }));
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes al empezar a escribir
    if (formMessage || formError) {
      setFormMessage(null);
      setFormError(null);
    }
  };

  // Enviar formulario con soporte offline
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage(null);
    setFormError(null);

    // Validación básica
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Todos los campos son obligatorios');
      setFormLoading(false);
      return;
    }

    // Validación de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Por favor ingresa un email válido');
      setFormLoading(false);
      return;
    }

    try {
      if (isOnline) {
        // Enviar directamente al servidor si estamos online
        const response = await offlineFetch('http://localhost:3000/adduser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al agregar usuario');
        }

        setFormMessage('Usuario agregado exitosamente');
        
        // Recargar la lista de usuarios
        await fetchUsers();
      } else {
        // Modo offline: guardar localmente
        const offlineRecord = {
          type: 'USER_REGISTRATION',
          data: formData,
          timestamp: new Date().toISOString(),
          synced: false
        };
        
        addToOfflineQueue(offlineRecord);
        setFormMessage('Usuario guardado localmente. Se sincronizará cuando recuperes la conexión.');
        
        // Actualizar lista local de usuarios
        const updatedUsers = [...users, { 
          id: `offline-${Date.now()}`, 
          nombre: formData.name,
          email: formData.email,
          offline: true 
        }];
        setUsers(updatedUsers);
        OfflineStorage.save('cached_users', updatedUsers);
      }
      
      // Limpiar formulario en ambos casos
      setFormData({
        name: '',
        email: '',
        password: ''
      });

    } catch (err) {
      console.error('Error al agregar usuario:', err);
      
      if (err.message === 'OFFLINE_MODE') {
        setFormMessage('Usuario guardado para sincronización posterior (modo offline)');
        
        // Actualizar UI localmente
        const updatedUsers = [...users, { 
          id: `offline-${Date.now()}`, 
          nombre: formData.name,
          email: formData.email,
          offline: true 
        }];
        setUsers(updatedUsers);
        
        // Limpiar formulario
        setFormData({
          name: '',
          email: '',
          password: ''
        });
      } else {
        setFormError(err.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Función para recargar usuarios
  const fetchUsers = async () => {
    try {
      const response = await fetchWithFallback(
        'http://localhost:3000/users',
        {},
        OfflineStorage.get('cached_users') || []
      );
      
      setUsers(response);
      
      // Actualizar cache
      if (isOnline) {
        OfflineStorage.save('cached_users', response);
      }
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      
      // Usar cache como fallback
      const cachedUsers = OfflineStorage.get('cached_users');
      if (cachedUsers) {
        setUsers(cachedUsers);
      } else {
        setError('No se pudieron cargar los usuarios.');
      }
    }
  };

  // Función para manejar captura de foto desde el componente Camera
  const handlePhotoCaptured = async (photoData) => {
    const { blob } = photoData;
    
    try {
      if (isOnline) {
        // Subir foto al servidor si estamos online
        const formData = new FormData();
        formData.append('photo', blob, `attendance_${Date.now()}.jpg`);
        
        if (location) {
          formData.append('location', JSON.stringify(location));
        }
        
        await offlineFetch('http://localhost:3000/api/upload-photo', {
          method: 'POST',
          body: formData
        });
        
        console.log('Foto subida exitosamente al servidor');
      } else {
        // Guardar localmente en modo offline
        const filename = `offline_photo_${Date.now()}.jpg`;
        await OfflineStorage.savePhoto(blob, filename);
        
        const attendanceRecord = {
          type: 'ATTENDANCE_PHOTO',
          photo: filename,
          location: location,
          timestamp: new Date().toISOString(),
          synced: false
        };
        
        OfflineStorage.saveAttendanceRecord(attendanceRecord);
        addToOfflineQueue(attendanceRecord);
        
        console.log('Foto guardada localmente para sincronización posterior');
      }
    } catch (error) {
      console.error('Error procesando foto:', error);
      
      // En caso de error, guardar localmente de todos modos
      if (error.message !== 'OFFLINE_MODE') {
        const filename = `error_photo_${Date.now()}.jpg`;
        await OfflineStorage.savePhoto(blob, filename);
        console.log('Foto guardada localmente como respaldo');
      }
    }
  };

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  return (
    <div className="home-container">
      {/* Indicador de estado de red */}
      <NetworkStatus />
      
      <header className="home-header">
        <h1>Reporte de Asistencia Académica</h1>
        {!isOnline && (
          <div className="offline-banner">
            ⚠️ Modo offline activado - Los datos se sincronizarán automáticamente cuando recuperes la conexión
          </div>
        )}
      </header>

      <main className="home-main">
        <section className="home-section">
          <h2>Pantalla principal</h2>
          <div className="connection-status">
            <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🟢 En línea' : '🔴 Sin conexión'}
            </span>
            {offlineQueue.length > 0 && (
              <span className="queue-indicator">
                {offlineQueue.length} elementos pendientes de sincronización
              </span>
            )}
          </div>
        </section>

        <section className="home-dynamic" aria-live="polite">

          {/* Card para obtener los usuarios*/}
          <div className="card">
            <div className="card-header">
              <h3>Usuarios</h3>
              <button onClick={fetchUsers} className="reload-btn" disabled={loading}>
                {loading ? '🔄' : '↻'}
              </button>
            </div>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p role="alert" className="error">{error}</p>}
            {!loading && !error && users.length === 0 && <p>No hay usuarios registrados.</p>}

            {!loading && !error && users.length > 0 && (
              <ul>
                {users.map(user => (
                  <li key={user.id} className={user.offline ? 'offline-user' : ''}>
                    <strong>{user?.nombre ?? 'Sin nombre'}</strong> 
                    <span> — {user.id}</span>
                    {user.offline && <span className="offline-badge"> (offline)</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Componente Camera con manejo offline */}
          <Camera onPhotoCaptured={handlePhotoCaptured} isOnline={isOnline} />

          {/* Card para agregar usuarios */}
          <div className="card">
            <h3>Agregar Usuario</h3>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre completo"
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ingresa el email"
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Ingresa la contraseña"
                  disabled={formLoading}
                />
              </div>

              <button 
                type="submit" 
                disabled={formLoading}
                className={`submit-btn ${!isOnline ? 'offline-mode' : ''}`}
              >
                {formLoading ? 'Procesando...' : 
                 !isOnline ? 'Guardar Localmente (Offline)' : 'Agregar Usuario'}
              </button>

              {formMessage && (
                <p className={`message ${!isOnline ? 'offline-message' : 'success'}`}>
                  {formMessage}
                </p>
              )}
              {formError && <p className="error">{formError}</p>}
            </form>
          </div>

          {/* Card para la ubicación */}
          <div className="card">
            <h3>📍 Geolocalización</h3>
            <p>Verifica tu ubicación actual para el reporte de asistencia.</p>

            <div className="location-buttons">
              <button 
                onClick={getCurrentLocation} 
                disabled={locationLoading}
                className="location-btn"
              >
                {locationLoading ? 'Obteniendo...' : 'Obtener Ubicación Actual'}
              </button>
              
              {!locationWatchId ? (
                <button 
                  onClick={startLocationTracking}
                  className="tracking-btn"
                >
                  Iniciar Seguimiento
                </button>
              ) : (
                <button 
                  onClick={stopLocationTracking}
                  className="stop-tracking-btn"
                >
                  Detener Seguimiento
                </button>
              )}
            </div>

            {locationError && <p className="error">{locationError}</p>}

            {location && (
              <div className="location-data">
                <h4>Información de Ubicación:</h4>
                <div className="location-details">
                  <p><strong>Latitud:</strong> {location.latitude.toFixed(6)}</p>
                  <p><strong>Longitud:</strong> {location.longitude.toFixed(6)}</p>
                  <p><strong>Precisión:</strong> ±{location.accuracy.toFixed(2)} metros</p>
                  <p><strong>Última actualización:</strong> {location.timestamp}</p>
                  {location.speed !== undefined && (
                    <p><strong>Velocidad:</strong> {(location.speed * 3.6).toFixed(2)} km/h</p>
                  )}
                  {location.tracking && (
                    <p className="tracking-active">📍 Seguimiento activo</p>
                  )}
                </div>

                {location.address && (
                  <div className="location-address">
                    <p><strong>Dirección aproximada:</strong></p>
                    <p>{location.address}</p>
                  </div>
                )}
              </div>
            )}

            {!location && !locationLoading && !locationError && (
              <p className="location-hint">
                Presiona "Obtener Ubicación Actual" para ver tu ubicación
              </p>
            )}
          </div>

          {/* Información de debug en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-card card">
              <h4>🔧 Información de Debug</h4>
              <div className="debug-info">
                <p><strong>Estado:</strong> {isOnline ? 'Online' : 'Offline'}</p>
                <p><strong>Elementos pendientes:</strong> {offlineQueue.length}</p>
                <p><strong>Usuarios cacheados:</strong> {OfflineStorage.get('cached_users')?.length || 0}</p>
              </div>
            </div>
          )}

        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Reporte de Asistencia Académica. Todos los derechos reservados. 2022371061@uteq.edu.mx</p>
      </footer>
    </div>
  );
}