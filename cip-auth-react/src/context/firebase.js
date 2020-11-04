import React from 'react';
import app from 'firebase/app';
import 'firebase/auth';

const FirebaseContext = React.createContext(null);

const config = {
    apiKey: "AIzaSyDzeXU-9BUlSGaUlp28PZC8oweYYKR8x2c",
    authDomain: "jkwng-identity.firebaseapp.com",
}

class Firebase {
    constructor() {
        app.initializeApp(config);

        this.auth = app.auth();
    }

    onAuthStateChanged = (authUser) => this.auth.onAuthStateChanged(authUser);

    doSignInWithCustomToken = (token) => 
        this.auth.signInWithCustomToken(token);
    
    doSignOut = () => this.auth.signOut();
}

function FirebaseProvider(props) {
    return (
        <FirebaseContext.Provider value={new Firebase()} {...props} />
    );
}

const useFirebase = () => React.useContext(FirebaseContext)


export { FirebaseProvider, FirebaseContext, useFirebase };
