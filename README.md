# Actividad 1: Desarrollo de repositorio web

## Caso de estudio

Crear una PWA académica que permita registrar la asistencia de alumnos en eventos mediante el uso de la cámara del dispositivo, capturando una fotografía al momento del ingreso, validando la identidad del estudiante, y almacenando la información junto con la fecha y hora del registro.

## Instalación

#### Clonar repositorio

- git clone https://github.com/SrArmstrong/actividad1_dedo
- cd actividad_1

#### Instalar dependencias

- npm install

#### Modo desarrollo

- npm run dev

#### Build de producción

- npm run build
- npm run preview

#### Funcionalidad divergente

Cambiar en el **vite.config.js** el apartado de server para pruebas en movile/dekstop debido a los permisos de sensores y configuraciónes de certificados ssl:

- https: true/false
- host: true/false

## Dependencias principales

- **React**: Biblioteca para construir interfaces de usuario interactivas.
- **Vite**: Entorno de desarrollo rápido y moderno para proyectos frontend.
- **vite-plugin-pwa**: Configuración de la PWA, incluyendo:
  - Manifest
  - Service Worker
  - Estrategias de caché
- **Firebase**: Plataforma utilizada para el almacenamiento de datos (Firestore).

### Backend (Apis con Node + Express)

Se creó un servidor backend sencillo con Express que se conecta a Firestore (Firebase Admin) para manejar usuarios.

- **GET /users** → obtiene usuarios de Firestore (sin mostrar contraseñas).
- **POST /adduser** → permite añadir un usuario nuevo (requiere name, email y password).
- **CORS habilitado** → el frontend puede consumir la API.

#### Ejecución

- npm install express cors firebase-admin

#### Claves de Firebase

Cambiar las claves de **claveEj.txt** a un documento que se llame **serviceAccountKey.json** y colocarlo entre corchetes {}

#### iniciar servidor

- node index.js

#### Servidor disponible

- http://localhost:3000

### Requisitos

- Node.js V22.17.0+
- Navegador con soporte PWA, cámara y http/https

### Dueño

Sergio Pérez Aldavalde - 2022371061