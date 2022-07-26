import React from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithCustomToken, signOut } from 'firebase/auth';

/* 
   we used the firebase auth library here for laziness' sake.
   you can call the APIs directly to sign in with a custom token using the docs here:
   https://cloud.google.com/identity-platform/docs/use-rest-api
*/
const FirebaseContext = React.createContext(null);

const config = {
    apiKey: "AIzaSyDzeXU-9BUlSGaUlp28PZC8oweYYKR8x2c",
    authDomain: "jkwng-identity.firebaseapp.com",
}

class Firebase {
    constructor() {
        this.app = initializeApp(config);
        this.auth = getAuth(this.app);
    }

    onAuthStateChanged = (authUser) => this.auth.onAuthStateChanged(authUser);

    doSignInWithEmailPassword = (email, password) => 
        signInWithEmailAndPassword(this.auth, email, password);

    doSignInWithCustomToken = (token) => 
        signInWithCustomToken(this.auth, token);
    
    doSignOut = () => signOut(this.auth);
}

function FirebaseProvider(props) {
    return (
        <FirebaseContext.Provider value={new Firebase()} {...props} />
    );
}

const useFirebase = () => React.useContext(FirebaseContext)


export { FirebaseProvider, FirebaseContext, useFirebase };
