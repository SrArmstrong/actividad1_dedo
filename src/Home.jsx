import './styles/Home.css';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function Home() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersCollection = collection(db, 'USERS');
        const snapshot = await getDocs(usersCollection);
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Usuarios obtenidos:', usersData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    }

    fetchUsers();
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Reporte del Clima</h1>
        <nav>
          <a href="/">Sign In</a>
          <a href="/">Sign Up</a>
          {/*<a href="/about">Acerca</a>*/}
        </nav>
      </header>

      <main className="home-main">
        <section className="home-section">
          <h2>Pantalla principal</h2>
          {/*<p>Tu contenido aquí.</p>*/}
        </section>

        <section className="home-dynamic">
          {/* Aquí puedes renderizar contenido dinámico */}
          <div className="card">
            <h3>Usuarios</h3>
            {users.length > 0 ? (
              <ul>
                {users.map(user => (
                  <li key={user.id}>
                    <strong>{user.nombre}</strong> — {user.id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Cargando usuarios...</p>
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
