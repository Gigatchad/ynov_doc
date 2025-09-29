const cloudinary = require('../cloudinaryConfig'); // Importer la configuration Cloudinary

// Fonction d'upload de document
const uploadDocument = async (req, res) => {
  try {
    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été envoyé' });
    }

    const document = req.files.document; // Récupérer le fichier envoyé
    const uploadResult = await cloudinary.uploader.upload(document.tempFilePath, {
      folder: 'documents', // Spécifie le dossier dans Cloudinary où stocker le fichier
    });

    // Retourner l'URL sécurisée du document uploadé
    res.status(200).json({
      message: 'Document téléchargé avec succès',
      url: uploadResult.secure_url, // URL du document sur Cloudinary
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload du document', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload du document' });
  }
};

module.exports = { uploadDocument };
