import { doc, setDoc, deleteDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to save current movie/show to user's continue_watching list in Firestore
export const saveToContinueWatching = async (userUid, item) => {
  if (!userUid || !item || !item.id) return;

  try {
    const ref = doc(db, 'users', userUid, 'continue_watching', String(item.id));
    await setDoc(ref, {
      ...item,
      updatedAt: Date.now(),
    });

    // Enforce max logic per-user on write inside Cloud Functions or securely in frontend:
    // Here we clean up old items if > 20
    const q = query(collection(db, 'users', userUid, 'continue_watching'), orderBy('updatedAt', 'desc'));
    const snaps = await getDocs(q);
    if (snaps.docs.length > 20) {
      // Delete anything beyond top 20
      const toDelete = snaps.docs.slice(20);
      for (const d of toDelete) {
        await deleteDoc(d.ref);
      }
    }
  } catch (err) {
    console.error('Failed to save to continue watching in Firestore', err);
  }
};

export const removeFromContinueWatching = async (userUid, id) => {
  if (!userUid || !id) return;
  try {
    const ref = doc(db, 'users', userUid, 'continue_watching', String(id));
    await deleteDoc(ref);
  } catch (err) {
    console.error('Failed to remove from continue watching', err);
  }
};
