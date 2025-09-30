import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function NetworkStatus() {
  const { isOnline, queueLength, syncOfflineQueue } = useNetworkStatus();

  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="status-indicator">
        <span className="status-dot"></span>
        {isOnline ? 'En línea' : 'Sin conexión'}
      </div>
      
      {queueLength > 0 && (
        <div className="offline-queue">
          <span>{queueLength} elementos pendientes</span>
          {isOnline && (
            <button onClick={syncOfflineQueue} className="sync-btn">
              Sincronizar
            </button>
          )}
        </div>
      )}
    </div>
  );
}