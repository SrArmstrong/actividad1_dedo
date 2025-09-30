import { useNetworkStatus } from './useNetworkStatus';
import { OfflineStorage } from '../services/offlineStorage';

export function useOfflineFetch() {
  const { isOnline, addToOfflineQueue } = useNetworkStatus();

  const offlineFetch = async (url, options = {}) => {
    if (isOnline) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        // Si falla la conexión, guardar para offline
        if (error.message.includes('Failed to fetch') || !navigator.onLine) {
          console.log('Guardando solicitud para modo offline:', url);
          addToOfflineQueue({ url, options, timestamp: new Date().toISOString() });
          throw new Error('OFFLINE_MODE');
        }
        throw error;
      }
    } else {
      // Modo offline: guardar en cola
      console.log('Modo offline - Guardando solicitud:', url);
      addToOfflineQueue({ url, options, timestamp: new Date().toISOString() });
      throw new Error('OFFLINE_MODE');
    }
  };

  const fetchWithFallback = async (url, options = {}, fallbackData = null) => {
    try {
      const response = await offlineFetch(url, options);
      return await response.json();
    } catch (error) {
      if (error.message === 'OFFLINE_MODE') {
        console.log('Usando datos de fallback offline');
        return fallbackData;
      }
      throw error;
    }
  };

  return {
    offlineFetch,
    fetchWithFallback,
    isOnline
  };
}