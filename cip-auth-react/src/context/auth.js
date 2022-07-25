import React, { useState, useEffect } from 'react';
import { useFirebase } from './firebase';
import jwt_decode from "jwt-decode";

import { getCustomToken } from './service';

const AuthContext = React.createContext()

function AuthProvider(props) {
    const [authData, setAuthData] = useState({
        uid: null, 
        idToken: null, 
        email: null, 
        isImpersonated: false,
        isAdmin: false,
    });
    const firebase = useFirebase();

    const doSignIn = (email, password) => {
        // login firebase to get firebase managed token
        return firebase
            .doSignInWithEmailPassword(email, password)
            .then(async (credential) => {
                var idToken = await firebase.auth.currentUser.getIdToken(false);
                localStorage.setItem("idToken", idToken);
                
                // unpack the idtoken to find out if we are admin -- claims are in the token
                //console.log(idToken);
                var decoded = jwt_decode(idToken);
                //console.log(decoded);
                
                setAuthData({
                    uid: firebase.auth.currentUser.uid, 
                    email: firebase.auth.currentUser.email, 
                    idToken: idToken,
                    isImpersonated: false,
                    isAdmin: decoded.isAdmin,
                })

                return idToken;
            }).catch((error) => {
                throw error;
            });
    }

    const doImpersonate = (customToken) => {
        // login backend, then login firebase to get firebase managed token
        //console.log(token);
        firebase
            .doSignInWithCustomToken(customToken)
            .then(idToken => {
                localStorage.setItem("impersonatedIdToken", idToken);

                var decoded = jwt_decode(idToken);

                setAuthData({
                    uid: firebase.auth.currentUser.uid, 
                    email: firebase.auth.currentUser.email, 
                    idToken: idToken,
                    isImpersonated: true,
                    isAdmin: decoded.isAdmin,
                })

                return idToken;
        }).catch((error) => {
            throw error;
        });
    }
    
    const doSignOut = () => {
        return firebase.doSignOut().then(() => {
            localStorage.setItem("idToken", null);
            setAuthData({
                uid: null, 
                idToken: null, 
                email: null, 
                isImpersonated: false, 
                isAdmin: false
            });
        });
    }

    useEffect(() => {
        //console.log(firebase);

        const unsubscribe = firebase.onAuthStateChanged(
            authUser => {
                if (authUser) {
                    authUser.getIdToken(true).then(
                        idToken => {
                            localStorage.setItem("idToken", idToken);

                            var decoded = jwt_decode(idToken);
                            setAuthData({
                                uid: authUser.uid, 
                                idToken: idToken,
                                email: authUser.email,
                                isImpersonated: false,
                                isAdmin: decoded.isAdmin,
                            })
                        }
                    )
                } else {
                    localStorage.setItem("idToken", null);
                    setAuthData({
                        uid: null, 
                        idToken: null,
                        email: null,
                        isImpersonated: false,
                        isAdmin: false,
                    });
                }
            }
        );

        return function cleanup() {
            unsubscribe();
            setAuthData({
                uid: null, 
                idToken: null,
                email: null,
                isImpersonated: false,
                isAdmin: false,
            });
        }

    }, [firebase]);

    return (
        <AuthContext.Provider value={{ authData, doSignIn, doImpersonate, doSignOut }} {...props} />
    );
}

const useAuth = () => React.useContext(AuthContext)

export { AuthContext, AuthProvider, useAuth }