// services/emailService.js

const nodemailer = require('nodemailer');

// Créer un transporteur pour envoyer des emails via Gmail (ou un autre service)
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Utilisation de Gmail (peut être remplacé par un autre service si nécessaire)
  auth: {
    user: process.env.EMAIL_USER,  // Votre adresse e-mail dans .env
    pass: process.env.EMAIL_PASSWORD,  // Votre mot de passe dans .env
  },
});

// Fonction pour envoyer un email de confirmation de création de compte
const sendEmail = (email, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,  // Utilise l'adresse e-mail configurée
    to: email,
    subject: 'Votre compte a été créé',
    text: `Votre compte a été créé avec succès. Voici vos informations de connexion :
    Email : ${email}
    Mot de passe : ${password}
    Vous pouvez maintenant vous connecter à l'application.`
  };

  // Envoi de l'email
  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
