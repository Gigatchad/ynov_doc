const cloudinary = require('../cloudinaryConfig'); // Cloudinary config
const { db, admin } = require('../firebase'); // Firebase Admin SDK

// Upload document (Admin or Personnel)
const uploadDocument = async (req, res) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(req.headers.authorization?.split(' ')[1]);
    if (!['admin', 'personnel'].includes(decodedToken.role)) {
      return res.status(403).json({ message: 'Access denied: admin or personnel only' });
    }

    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = req.files.document;
    const uploadResult = await cloudinary.uploader.upload(document.tempFilePath, {
      folder: 'documents',
    });

    res.status(200).json({
      message: 'Document uploaded successfully',
      url: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('Error uploading document', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
};

// GET all requests (Admin or Personnel)
const getAllRequests = async (req, res) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(req.headers.authorization?.split(' ')[1]);
    if (!['admin', 'personnel'].includes(decodedToken.role)) {
      return res.status(403).json({ message: 'Access denied: admin or personnel only' });
    }

    const snapshot = await db.collection("document_requests").get();
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET request by ID (Admin or Personnel)
const getRequestById = async (req, res) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(req.headers.authorization?.split(' ')[1]);
    if (!['admin', 'personnel'].includes(decodedToken.role)) {
      return res.status(403).json({ message: 'Access denied: admin or personnel only' });
    }

    const docRef = await db.collection("document_requests").doc(req.params.id).get();
    if (!docRef.exists) return res.status(404).json({ error: "Request not found" });

    const data = docRef.data();
    res.json({
      id: docRef.id,
      ...data,
      timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST new request (Student, Parent, or Personnel)
const addRequest = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

    const role = userDoc.data().role?.toLowerCase(); // étudiant, parent, personnel
    if (!['étudiant', 'parent', 'personnel'].includes(role)) {
      return res.status(403).json({ message: 'Access denied: only étudiant, parent, or personnel can send requests' });
    }

    const { type, message } = req.body;
    if (!type || !message) return res.status(400).json({ error: "Type and message are required" });

    // Default status is "en cours"
    const docRef = await db.collection("document_requests").add({
      userID: decodedToken.uid,
      type,
      message,
      status: "en cours", // tracking field
      role, // étudiant, parent, or personnel
      timestamp: new Date()
    });

    // Notify all admins
    const adminsSnapshot = await db.collection("users").where("role", "==", "admin").get();
    const notifications = adminsSnapshot.docs.map(adminDoc => ({
      userID: adminDoc.id,
      message: `New document request from ${userDoc.data().email}: ${type}`,
      type: "Request",
      status: "en cours",
      timestamp: new Date()
    }));

    const batch = db.batch();
    notifications.forEach(notification => {
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, notification);
    });
    await batch.commit();

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH update 'status' (Admin or Personnel)
const updateRequestStatus = async (req, res) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(req.headers.authorization?.split(' ')[1]);
    if (!['admin', 'personnel'].includes(decodedToken.role)) {
      return res.status(403).json({ message: 'Access denied: admin or personnel only' });
    }

    const { status } = req.body;
    const validStatuses = ["en cours", "completed", "rejected"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: `Status must be one of ${validStatuses.join(", ")}` });

    await db.collection("document_requests").doc(req.params.id).update({ status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getAllRequests,
  getRequestById,
  addRequest,
  updateRequestStatus
};
