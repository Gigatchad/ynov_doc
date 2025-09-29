const admin = require('firebase-admin');

// Initialiser Firebase Admin avec la clé de service
const serviceAccount = require('./firebase-adminsdk.json');  // Assurez-vous que ce chemin est correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<your-project-id>.firebaseio.com' // Remplacez par l'URL de votre projet
});

const db = admin.firestore();

module.exports = { admin, db };
