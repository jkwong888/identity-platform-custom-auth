import app from 'firebase/app';
import 'firebase/auth';

const config = {
    apiKey: "AIzaSyDzeXU-9BUlSGaUlp28PZC8oweYYKR8x2c",
    authDomain: "jkwng-identity.firebaseapp.com",
}

class Firebase {
    constructor() {
        app.initializeApp(config);

        this.auth = app.auth();
    }

    doSignInWithCustomToken = (token) => 
        this.auth.signInWithCustomToken(token);
    
    doSignOut = () => this.auth.signOut();
}

export default Firebase;