import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { generatePDF } from './pdfGenerator.js';

export async function generateOrderNumber() {
  const app = await initializeFirebase();
  const db = getFirestore();
  const orderNumber = `ORD-${doc(collection(db, 'orders')).id}`;
  return orderNumber;
}

async function initializeFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyDp_kWlfB6S3wyJivzqYZ8_oAqwOH_QFoM",
    authDomain: "nisrines-kitchen-orders.firebaseapp.com",
    projectId: "nisrines-kitchen-orders",
    storageBucket: "nisrines-kitchen-orders.firebasestorage.app",
    messagingSenderId: "1084877957696",
    appId: "1:1084877957696:web:52243432c2c841849ccda5"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await signInAnonymously(auth)
  .then(() => {
      console.log('Signed in anonymously');
  })
  .catch((error) => {
      console.error('Error signing in:', error);
  });

  return app;
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
      // Upload the PDF
      const snapshot = await uploadBytes(pdfRef, pdfBlob);
      // Get the download URL
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