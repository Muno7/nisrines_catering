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
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
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