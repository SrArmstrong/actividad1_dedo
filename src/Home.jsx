import './styles/Home.css';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cámara
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Captura
  const [lastPhotoUrl, setLastPhotoUrl] = useState(null);
  const [captureMsg, setCaptureMsg] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/users');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error al obtener usuarios:', err);
        setError('No se pudieron cargar los usuarios.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();

    return () => {
      stopCamera();
      if (lastPhotoUrl) {
        URL.revokeObjectURL(lastPhotoUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCameraError(null);
    setCaptureMsg(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('El navegador no soporta acceso a la cámara.');
      return;
    }

    try {
      const constraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError('No se pudo iniciar la cámara.');
      setCameraOn(false);
    }
  }

  function stopCamera() {
    setCameraOn(false);
    try {
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch (err) {
      console.error('Error al detener la cámara:', err);
    }
  }

  async function capturePhoto() {
    setCaptureMsg(null);
    setCameraError(null);

    if (!videoRef.current) {
      setCameraError('La cámara no está lista.');
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError('La cámara aún no ha entregado frames. Intenta de nuevo.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCameraError('No se pudo generar la imagen.');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `foto_${timestamp}.jpg`;
      const url = URL.createObjectURL(blob);

      if (lastPhotoUrl) URL.revokeObjectURL(lastPhotoUrl);
      setLastPhotoUrl(url);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      setCaptureMsg('Imagen guardada en Descargas.');
    }, 'image/jpeg', 0.92);
  }

  function downloadLastPhoto() {
    if (!lastPhotoUrl) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `foto_${timestamp}.jpg`;
    const a = document.createElement('a');
    a.href = lastPhotoUrl;
    a.download = filename;
    a.click();
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Reporte de Asistencia Académica</h1>
      </header>

      <main className="home-main">
        <section className="home-section">
          <h2>Pantalla principal</h2>
        </section>

        <section className="home-dynamic" aria-live="polite">
          <div className="card">
            <h3>Usuarios</h3>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p role="alert">{error}</p>}
            {!loading && !error && users.length === 0 && <p>No hay usuarios registrados.</p>}

            {!loading && !error && users.length > 0 && (
              <ul>
                {users.map(user => (
                  <li key={user.id}>
                    <strong>{user?.nombre ?? 'Sin nombre'}</strong> — {user.id}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3>Acceso a la cámara</h3>
            <p>Usa el botón para abrir la cámara y tomar fotos.</p>

            <div className="camera-buttons">
              {!cameraOn ? (
                <button onClick={startCamera}>Abrir cámara</button>
              ) : (
                <button onClick={stopCamera}>Cerrar cámara</button>
              )}
              <button onClick={capturePhoto} disabled={!cameraOn}>
                Tomar foto
              </button>
            </div>

            {cameraError && <p className="error">{cameraError}</p>}
            {captureMsg && <p className="success">{captureMsg}</p>}

            <div className="camera-preview">
              <video ref={videoRef} playsInline muted autoPlay className="video" />
            </div>

            {lastPhotoUrl && (
              <div className="photo-preview">
                <h4>Última foto</h4>
                <img src={lastPhotoUrl} alt="Última captura" className="photo" />
                <div className="photo-actions">
                  <button onClick={downloadLastPhoto}>Descargar foto</button>
                  <button onClick={() => window.open(lastPhotoUrl, '_blank')}>
                    Abrir en nueva pestaña
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card">Contenido dinámico 2</div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Reporte del Clima. Todos los derechos reservados. 2022371061@uteq.edu.mx</p>
      </footer>
    </div>
  );
}
