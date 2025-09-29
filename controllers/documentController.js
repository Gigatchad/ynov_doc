const cloudinary = require('../cloudinaryConfig'); // Cloudinary config
const { db, admin } = require('../firebase'); // Firebase Admin SDK

// Upload document (Personnel only)
const uploadDocument = async (req, res) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(
      req.headers.authorization?.split(' ')[1]
    );
    if (!['personnel'].includes(decodedToken.role)) {
      return res.status(403).json({ message: 'Access denied: personnel only' });
    }

    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = req.files.document;
    const uploadResult = await cloudinary.uploader.upload(document.tempFilePath, {
      folder: 'documents',
    });

    // Notify the requester (student or parent)
    const requestId = req.body.requestID;
    if (requestId) {
      const requestDoc = await db.collection("document_requests").doc(requestId).get();
      if (requestDoc.exists) {
        const requestData = requestDoc.data();

        // Update status to "en cours" if it's still "pas commencé"
        if (requestData.status === 'pas commencé') {
          await db.collection("document_requests").doc(requestId).update({ status: 'en cours' });
        }

        await db.collection("notifications").doc().set({
          userID: requestData.userID,
          message: `Your document for request "${requestData.type}" has been uploaded by personnel.`,
          type: "DocumentUploaded",
          status: "en cours",
          timestamp: new Date()
        });
      }
    }

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
    const decodedToken = await admin.auth().verifyIdToken(
      req.headers.authorization?.split(' ')[1]
    );
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
    const decodedToken = await admin.auth().verifyIdToken(
      req.headers.authorization?.split(' ')[1]
    );
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

// GET requests for the current user (student/parent)
const getUserRequests = async (req, res) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(
      req.headers.authorization?.split(' ')[1]
    );

    const snapshot = await db.collection('document_requests')
      .where('userID', '==', decodedToken.uid)
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    }));

    res.json(requests);
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

    const role = userDoc.data().role?.toLowerCase();
    if (!['étudiant', 'parent', 'personnel'].includes(role)) {
      return res.status(403).json({ message: 'Access denied: only étudiant, parent, or personnel can send requests' });
    }

    const { type, message } = req.body;
    if (!type || !message) return res.status(400).json({ error: "Type and message are required" });

    const docRef = await db.collection("document_requests").add({
      userID: decodedToken.uid,
      type,
      message,
      status: "pas commencé",
      role,
      timestamp: new Date()
    });

    // Notify personnel
    const personnelSnapshot = await db.collection("users")
      .where("role", "==", "personnel")
      .get();

    const batch = db.batch();
    personnelSnapshot.docs.forEach(user => {
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, {
        userID: user.id,
        message: `New document request from ${userDoc.data().email}: ${type}`,
        type: "Request",
        status: "pas commencé",
        timestamp: new Date()
      });
    });
    await batch.commit();

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH update 'status' (Personnel only)
const updateRequestStatus = async (req, res) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(
      req.headers.authorization?.split(' ')[1]
    );
    if (!['personnel'].includes(decodedToken.role)) {
      return res.status(403).json({ message: 'Access denied: personnel only' });
    }

    const { status } = req.body;
    const validStatuses = ["en cours", "completed", "rejected"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: `Status must be one of ${validStatuses.join(", ")}` });

    const requestRef = db.collection("document_requests").doc(req.params.id);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return res.status(404).json({ error: "Request not found" });

    await requestRef.update({ status });

    // Notify the requester
    const requestData = requestDoc.data();
    await db.collection("notifications").doc().set({
      userID: requestData.userID,
      message: `Your document request "${requestData.type}" has been updated to "${status}"`,
      type: "StatusUpdate",
      status,
      timestamp: new Date()
    });

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
  updateRequestStatus,
  getUserRequests
};
