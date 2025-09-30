import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Conexión restaurada - Sincronizando datos...');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Sin conexión - Modo offline activado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Agregar item a la cola offline
  const addToOfflineQueue = (item) => {
    setOfflineQueue(prev => {
      const newQueue = [...prev, { ...item, timestamp: new Date().toISOString() }];
      // Guardar en localStorage como backup
      localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
      return newQueue;
    });
  };

  // Sincronizar cola cuando vuelve la conexión
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    console.log(`Sincronizando ${offlineQueue.length} elementos...`);
    
    const successfulSyncs = [];
    const failedSyncs = [];

    for (const item of offlineQueue) {
      try {
        // Aquí irían tus llamadas a la API real
        await syncItemToServer(item);
        successfulSyncs.push(item);
      } catch (error) {
        console.error('Error sincronizando item:', error);
        failedSyncs.push(item);
      }
    }

    // Actualizar cola con solo los que fallaron
    setOfflineQueue(failedSyncs);
    localStorage.setItem('offlineQueue', JSON.stringify(failedSyncs));

    return { successful: successfulSyncs.length, failed: failedSyncs.length };
  };

  // Cargar cola desde localStorage al iniciar
  useEffect(() => {
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }
  }, []);

  // Sincronizar automáticamente cuando vuelve la conexión
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline]);

  return {
    isOnline,
    offlineQueue,
    addToOfflineQueue,
    syncOfflineQueue,
    queueLength: offlineQueue.length
  };
}

// Función para sincronizar con el servidor
async function syncItemToServer(item) {
  // Simular llamada a API - reemplaza con tus endpoints reales
  const response = await fetch('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item)
  });

  if (!response.ok) {
    throw new Error('Error de sincronización');
  }

  return response.json();
}