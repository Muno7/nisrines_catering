// src/scripts/services/uploadPdf.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { generatePDF } from './pdfGenerator.js';

async function initializeFirebase() {
  try {
    const response = await fetch('/api/firebase-init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to initialize Firebase');
    }

    const { projectId, storageBucket, authDomain, token } = await response.json();
    
    // Initialize with minimal config - no sensitive data
    const app = initializeApp({
      projectId,
      storageBucket,
      authDomain
    });

    const auth = getAuth(app);
    await signInWithCustomToken(auth, token);
    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

export async function generateOrderNumber() {
  const app = await initializeFirebase();
  const db = getFirestore(app);
  const orderNumber = `ORD-${doc(collection(db, 'orders')).id}`;
  return orderNumber;
}

export async function uploadPDFToFirebase(orderData) {
  const app = await initializeFirebase();
  const auth = getAuth(app);

  if (!auth.currentUser) {
    throw new Error('User must be authenticated to upload PDF');
  }

  try {
    const pdfBlob = await generatePDF(orderData);
    const storage = getStorage(app);
    const pdfRef = ref(storage, `orders/${orderData.orderNumber}.pdf`);
    const snapshot = await uploadBytes(pdfRef, pdfBlob);
    const downloadURL = await getDownloadURL(pdfRef);
    
    return {
      downloadURL,
      path: snapshot.ref.fullPath
    };
  } catch (error) {
    console.error("Error generating or uploading PDF:", error);
    throw error;
  }
}