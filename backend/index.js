const express = require('express');
const app = express();
const PORT = 3000;
const cors = require('cors');

app.use(cors());

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('¡Hola desde el backend!');
});

app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('USERS').get();
    const users = snapshot.docs.map(doc => {
      const { password, ...safeData } = doc.data();
      return { id: doc.id, ...safeData };
    });
    res.json(users);
  } catch (error) {
    console.error('Error al consultar USERS:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/adduser', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Campos requeridos' });
    }

    const userRef = db.collection('USERS').doc(email);
    await userRef.set({ name, password });

    res.status(201).json({ message: 'Usuario agregado' });
  } catch (error) {
    console.error('Error al añadir usuario:', error);
    res.status(500).json({ error: 'Error al agregar usuario' });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
