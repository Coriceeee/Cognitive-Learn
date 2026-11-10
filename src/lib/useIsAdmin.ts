import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

/** UI visibility only. Server APIs and Firestore Rules must enforce permission. */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let mounted = true;
    let sequence = 0;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      const request = ++sequence;
      if (mounted) setIsAdmin(false);
      if (!user) return;
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (mounted && request === sequence) {
          setIsAdmin(snapshot.exists() && snapshot.data().active === true && snapshot.data().role === "admin");
        }
      } catch {
        if (mounted && request === sequence) setIsAdmin(false);
      }
    });
    return () => { mounted = false; sequence++; unsubscribe(); };
  }, []);
  return isAdmin;
}
