import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Init from "./components/Init";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css"

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // show Init immediately
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [minTimeReached, setMinTimeReached] = useState(false);

  useEffect(() => {
    if (!auth) return;

    setFirebaseReady(true);

    // Minimum display timeout (e.g., 5s)
    const timer = setTimeout(() => {
      setMinTimeReached(true);
    }, 5000);

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // Close loader only if both Firebase resolved AND min timeout reached
  useEffect(() => {
    if (minTimeReached && firebaseReady) {
      setLoading(false);
    }
  }, [minTimeReached, firebaseReady]);

  if (loading) return <Init />;

  return user ? <Dashboard user={user} setUser={setUser} /> : <Login setUser={setUser} />;
}
