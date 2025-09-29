const { admin } = require('../firebase');

// Check if user is admin
const isAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : utilisateur non administrateur' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Utilisateur non autorisé' });
  }
};

// Check if user is personnel
const isPersonnel = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.role !== 'personnel') {
      return res.status(403).json({ message: 'Accès refusé : personnel seulement' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Utilisateur non autorisé' });
  }
};

// Check if user is admin or personnel
const isAdminOrPersonnel = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!['admin', 'personnel'].includes(decodedToken.role)) {
      return res.status(403).json({ message: 'Accès refusé : admin ou personnel seulement' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Utilisateur non autorisé' });
  }
};

// Check if user is authenticated (student/parent/personnel/admin)
const isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Utilisateur non autorisé' });
  }
};

module.exports = { isAdmin, isPersonnel, isAdminOrPersonnel, isAuthenticated };
