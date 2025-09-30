import { useRef, useState } from 'react';
//import './Camera.css';

export default function Camera() {
  // Referencias
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Estados de la cámara
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [lastPhotoUrl, setLastPhotoUrl] = useState(null);
  const [captureMsg, setCaptureMsg] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);

  // Iniciar cámara
  const startCamera = async () => {
    setCameraError(null);
    setCaptureMsg(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('El navegador no soporta acceso a la cámara.');
      return;
    }

    try {
      const constraints = { 
        video: { facingMode: { ideal: 'environment' } }, 
        audio: false 
      };
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
  };

  // Detener cámara
  const stopCamera = () => {
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
  };

  // Capturar foto
  const capturePhoto = async () => {
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

      // Crear URL para la previsualización
      const url = URL.createObjectURL(blob);
      
      // Limpiar foto anterior si existe
      if (lastPhotoUrl) {
        URL.revokeObjectURL(lastPhotoUrl);
      }
      
      // Guardar tanto la URL como el blob
      setLastPhotoUrl(url);
      setPhotoBlob(blob);
      setCaptureMsg('Foto capturada. ¿Deseas guardarla o borrarla?');
    }, 'image/jpeg', 0.92);
  };

  // Guardar foto
  const savePhoto = async () => {
    if (!photoBlob) return;

    try {
      if ('showSaveFilePicker' in window) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `foto_${timestamp}.jpg`;
        
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Imagen JPEG',
            accept: { 'image/jpeg': ['.jpg'] },
          }],
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(photoBlob);
        await writable.close();
        
        setCaptureMsg('Imagen guardada exitosamente.');
        clearPhoto();
      } else {
        fallbackDownload(photoBlob);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error al guardar:', err);
        setCameraError('El usuario canceló la descarga o no se pudo guardar.');
      } else {
        setCaptureMsg('Guardado cancelado.');
      }
    }
  };

  // Función fallback para navegadores antiguos
  const fallbackDownload = (blob) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `foto_${timestamp}.jpg`;
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    setCaptureMsg('Imagen descargada en Descargas.');
    clearPhoto();
  };

  // Limpiar foto
  const clearPhoto = () => {
    if (lastPhotoUrl) {
      URL.revokeObjectURL(lastPhotoUrl);
    }
    setLastPhotoUrl(null);
    setPhotoBlob(null);
    setCaptureMsg(null);
  };

  return (
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
        <video 
          ref={videoRef} 
          playsInline 
          muted 
          autoPlay 
          className="video" 
        />
      </div>

      {lastPhotoUrl && (
        <div className="photo-preview">
          <h4>Vista previa de la foto</h4>
          <img src={lastPhotoUrl} alt="Captura reciente" className="photo" />
          <div className="photo-actions">
            <button onClick={savePhoto} className="save-btn">
              Guardar foto
            </button>
            <button onClick={clearPhoto} className="delete-btn">
              Borrar foto
            </button>
            <button onClick={() => window.open(lastPhotoUrl, '_blank')}>
              Abrir en nueva pestaña
            </button>
          </div>
        </div>
      )}
    </div>
  );
}