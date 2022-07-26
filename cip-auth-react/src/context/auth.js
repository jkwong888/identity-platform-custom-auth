import React, { useState, useEffect } from 'react';
import { useFirebase } from './firebase';
import jwt_decode from "jwt-decode";

const AuthContext = React.createContext()

function AuthProvider(props) {
    const [authData, setAuthData] = useState({
        uid: null, 
        idToken: null, 
        impersonatedIdToken: null, 
        email: null, 
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
                    impersonatedIdToken: null,
                    isAdmin: decoded.isAdmin,
                })

                return idToken;
            }).catch((error) => {
                throw error;
            });
    }

    const doImpersonate = (idToken) => {
        // service layer called our backend and called firebase, set the impersonatedId Token
        localStorage.setItem("impersonatedIdToken", idToken);
        var decoded = jwt_decode(idToken);
        setAuthData({
            uid: decoded.user_id, 
            email: decoded.email, 
            idToken: authData.idToken,
            impersonatedIdToken: idToken,
            isAdmin: decoded.isAdmin,
        })
    }

    const stopImpersonate = () => {
        // service layer called our backend and called firebase, set the impersonatedId Token
        localStorage.setItem("impersonatedIdToken", null);
        var decoded = jwt_decode(authData.idToken);
        setAuthData({
            uid: decoded.user_id, 
            email: decoded.email, 
            idToken: authData.idToken,
            impersonatedIdToken: null,
            isAdmin: decoded.isAdmin,
        })
    }
    
    const doSignOut = () => {
        return firebase.doSignOut().then(() => {
            localStorage.setItem("idToken", null);
            localStorage.setItem("impersonatedIdToken", null);
            setAuthData({
                uid: null, 
                idToken: null, 
                email: null, 
                impersonatedIdToken: null,
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
                                impersonatedIdToken: null,
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
                impersonatedIdToken: null,
                isAdmin: false,
            });
        }

    }, [firebase]);

    return (
        <AuthContext.Provider value={{ authData, doSignIn, doImpersonate, stopImpersonate, doSignOut }} {...props} />
    );
}

const useAuth = () => React.useContext(AuthContext)

export { AuthContext, AuthProvider, useAuth }