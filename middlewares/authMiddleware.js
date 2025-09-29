const { admin } = require('../firebase'); // Importer l'Admin SDK

// Middleware pour vérifier si l'utilisateur est authentifié et a le rôle admin
const isAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    // Vérification du token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Vérification du rôle "admin"
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : utilisateur non administrateur' });
    }

    // L'utilisateur est un admin, passer au prochain middleware ou route
    next();
  } catch (error) {
    res.status(401).json({ message: 'Utilisateur non autorisé' });
  }
};

module.exports = { isAdmin };
