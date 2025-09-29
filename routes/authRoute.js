const express = require('express');
const { loginAdmin,getProfile ,getAllUsers,addUser,getUserById,updateUser,deleteUser,loginUser,sendPasswordResetEmail,resetPassword} = require('../controllers/authController');
const { isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route pour la connexion de l'admin
router.post('/login', loginAdmin);
router.get('/profile', isAdmin, getProfile);
router.get('/users', isAdmin, getAllUsers);
// Route protégée pour vérifier si l'utilisateur est bien admin
router.post('/add-user', isAdmin, addUser);
router.get('/users/:id', isAdmin, getUserById);
router.put('/users/:id', isAdmin, updateUser);
router.delete('/users/:id', isAdmin, deleteUser);
router.post('/user/login', loginUser);
router.post('/password-reset', sendPasswordResetEmail);
router.post('/reset-password', resetPassword);
router.get('/admin', isAdmin, (req, res) => {
  res.status(200).json({ message: 'Bienvenue dans la zone admin' });
});

module.exports = router;
