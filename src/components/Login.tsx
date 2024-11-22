'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { app } from '@/lib/firebase_client'
import { 
    getAuth, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signInWithPopup,
    User
} from "firebase/auth"

export default function Login() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        try {
          // Get the ID token when user signs in
          const idToken = await user.getIdToken();
          
          // Make API call with the token
          const response = await fetch('/api/useraccount', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              user_id: user.uid
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch user account');
          }

          const data = await response.json();
          console.log('User account data:', data);
          setUser(user);
          setError(null);
        } catch (error) {
          console.error('Error fetching user account:', error);
          setError(error instanceof Error ? error.message : 'An error occurred');
          // Sign out user if account verification fails
          await auth.signOut();
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setError(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome</h1>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden">
            <Image
              src={user.photoURL || '/default-avatar.png'}
              alt="Profile picture"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{user.displayName}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            disabled={loading}
            className="px-6 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}