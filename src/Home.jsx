import './styles/Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Mi PWA</h1>
        <nav>
          <a href="/">Inicio</a>
          <a href="/about">Acerca</a>
        </nav>
      </header>

      <main className="home-main">
        <section className="home-section">
          <h2>Pantalla principal</h2>
          <p>Tu contenido aquí.</p>
        </section>

        <section className="home-dynamic">
          {/* Aquí puedes renderizar contenido dinámico */}
          <div className="card">Contenido dinámico 1</div>
          <div className="card">Contenido dinámico 2</div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Mi PWA. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
