import { doc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from './configs/firebase';
import { initializeServerApp } from 'firebase/app';
import { getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export async function middleware(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
        }
        const requestBody = await request.json();
        const userId = requestBody.user_id;
        const idToken = authHeader.split('Bearer ')[1];

        console.log('userId', userId);
        console.log('idToken', idToken);
        
        const firebaseServerAppSettings = {
            authIdToken: idToken
        }

        const serverApp =
            initializeServerApp(firebaseConfig,
                firebaseServerAppSettings);
        const serverAuth = getAuth(serverApp);
        await serverAuth.authStateReady();

        if (serverAuth.currentUser === null) {
            console.log('User is not logged in');
        }

        const db = getFirestore(serverApp, 'transcriber-store');
        const userRef = doc(db, "user-accounts", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            console.log('User document does not exist');
            return NextResponse.json({ error: 'User account is not found' }, { status: 401 });
        }

    } catch (e) {
        console.log('Erorr happened', e);
    }
}

export const config = {
    matcher: [
        '/api/:path*'
    ]
}