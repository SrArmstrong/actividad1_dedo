import './styles/Splash.css';

export default function Splash(){
  return (
    <div className="splash-container">
      <img src="/icons/icon-192.png" alt="logo" className="splash-logo" />
      <h1 className="splash-title">Mi PWA</h1>
      <p>Cargando...</p>
    </div>
  )
}
