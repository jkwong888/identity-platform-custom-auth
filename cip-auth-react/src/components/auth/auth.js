import React, { Component } from 'react';

import AuthUserContext from './context';
import { getCustomToken } from '../../service';
import Firebase from '../firebase';

class Auth {
    constructor() {
        this.firebase = new Firebase();

        this.uid = null;
        this.idToken = null;
    }

    doSignIn = (username, password) => {
        // login backend, then login firebase to get firebase managed token
        getCustomToken(username, password).then((token) => {
            //console.log(token);
            this.firebase
                .doSignInWithCustomToken(token)
                .then(idToken => {
                    this.uid = this.firebase.auth.currentUser.uid;
                    this.idToken = idToken;
                    return idToken;
                })
        }).catch((error) => {
            throw error;
        });

    }
    
    doSignOut = () => {
        this.firebase.doSignOut().then(() => {
            this.uid = null;
            this.idToken = null;
        });
    }
}





export default Auth;
export default withAuthentication;