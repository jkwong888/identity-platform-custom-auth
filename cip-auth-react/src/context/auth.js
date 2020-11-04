import React, { useState, useEffect } from 'react';
import { useFirebase } from './firebase';

import { getCustomToken } from './service';

const AuthContext = React.createContext()

function AuthProvider(props) {
    const [authData, setAuthData] = useState({uid: null, idToken: null});
    const firebase = useFirebase();

    const doSignIn = (username, password) => {
        // login backend, then login firebase to get firebase managed token
        return getCustomToken(username, password).then((token) => {
            //console.log(token);
            firebase
                .doSignInWithCustomToken(token)
                .then(idToken => {
                    localStorage.setItem("idToken", idToken);
                    setAuthData({uid: firebase.auth.currentUser.uid, idToken: idToken})

                    return idToken;
                })
        }).catch((error) => {
            throw error;
        });

    }
    
    const doSignOut = () => {
        return firebase.doSignOut().then(() => {
            localStorage.setItem("idToken", null);
            setAuthData({uid: null, idToken: null})
        });
    }

    useEffect(() => {
        //console.log(firebase);

        const unsubscribe = firebase.onAuthStateChanged(
            authUser => {
                if (authUser) {
                    authUser.getIdToken(false).then(
                        idToken => {
                            localStorage.setItem("idToken", idToken);
                            setAuthData({uid: authUser.uid, idToken: idToken})
                        }
                    )
                } else {
                    localStorage.setItem("idToken", null);
                    setAuthData({uid: null, idToken: null})
                }
            }
        );

        return function cleanup() {
            unsubscribe();
            setAuthData({uid: null, idToken: null})
        }

    }, [firebase]);

    return (
        <AuthContext.Provider value={{ authData, doSignIn, doSignOut }} {...props} />
    );
}

const useAuth = () => React.useContext(AuthContext)

export { AuthContext, AuthProvider, useAuth }