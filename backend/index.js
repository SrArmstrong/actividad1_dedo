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


app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
