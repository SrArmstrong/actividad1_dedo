import './styles/Home.css';
import { useEffect, useState } from 'react';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/users');
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
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
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Reporte del Clima</h1>
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
            {!loading && !error && users.length === 0 && (
              <p>No hay usuarios registrados.</p>
            )}

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

          <div className="card">Contenido dinámico 1</div>
          <div className="card">Contenido dinámico 2</div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Reporte del Clima. Todos los derechos reservados. 2022371061@uteq.edu.mx</p>
      </footer>
    </div>
  );
}
