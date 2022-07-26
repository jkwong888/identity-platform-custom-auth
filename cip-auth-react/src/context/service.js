import React, { useEffect, useState } from 'react';

import axios from 'axios';

import { useAuth } from './auth';
import { useFirebase } from './firebase';

const ServiceContext = React.createContext()

const defaultOptions = {
    //baseURL: 'http://localhost:19562',
    headers: {
        'Content-Type': 'application/json',
    },
};

class Service {
    constructor() {
        this.svc = axios.create(defaultOptions);
    }

    get = (url, options = {}) => {
        this.setAuthToken();
        return this.svc.get(url, { ...defaultOptions, ...options});
    }

    post = (url, data, options = {}) => {
        this.setAuthToken();
        return this.svc.post(url, data, { ...defaultOptions, ...options});
    }

    put = (url, data, options = {}) => {
        this.setAuthToken();
        return this.svc.put(url, data, { ...defaultOptions, ...options});
    }

    delete = (url, options = {}) => {
        this.setAuthToken();
        return this.svc.delete(url, { ...defaultOptions, ...options});
    }

    setAuthToken = () => {
        this.svc.defaults.headers.common['Authorization'] = '';
        delete this.svc.defaults.headers.common['Authorization'];

        // if we have an impersonated token, use it
        var impersonatedToken = localStorage.getItem('impersonatedIdToken');
        if (impersonatedToken && impersonatedToken !== 'null') {
            this.svc.defaults.headers.common['Authorization'] = `Bearer ${impersonatedToken}`;
            return;
        } 
        
        var token = localStorage.getItem('idToken');
        if (token && token !== 'null') {
            this.svc.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    };
}

function ServiceProvider(props) {
    const auth = useAuth();
    const firebase = useFirebase();
    const [idToken, setIdToken] = useState();
    const svc = new Service();

    const getHomepage = () => {
        return svc.get('/homepage')
            .then((response) => {
            //console.log(response.status);
            //console.log(response.data);

            return response.data;
        });
    }

    const signIn = (email, password) => auth.doSignIn(email, password);
    const signOut = () => auth.doSignOut();

    /*
    const getCustomToken = (username, password) => {
        //console.log("post to " + url_base + '/authenticate');
        return axios.post('/authenticate', {
                username: username,
                password: password,
            }, defaultOptions)
            .then((response) => {
            //console.log(response.status);
            //console.log(response.data);

            return response.data;
        });
    }
    */

    const impersonate = (uid) => {
        //console.log("post to " + url_base + '/authenticate');
        return svc.post('/impersonate', {
                uid: uid,
            })
            .then(async (response) => {
            //console.log(response.status);
                //console.log(`custom token is: ${response.data}`);
                //console.log(`apiKey is: ${firebase.app.options.apiKey}`);
                const fbResp = await axios.post('/v1/accounts:signInWithCustomToken', 
                    {
                        token: response.data,
                        returnSecureToken: true,
                    },
                    {
                        baseURL: "https://identitytoolkit.googleapis.com",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        params: {
                            key: firebase.app.options.apiKey,
                        },
                    }
                )
                //console.log(`firebase response is ${JSON.stringify(fbResp)}`);

                // set the impersonated token in the auth layer
                auth.doImpersonate(fbResp.data.idToken);

                return fbResp.data.idToken;
        });
    }

    const getUserList = () => {
        return svc.get("/listUsers")
            .then ((response) => {
                return response.data;
            });
    }


    useEffect(() => {
        setIdToken(auth.authData.idToken);

    }, [auth.authData]);

    return (
        <ServiceContext.Provider value={{
            signIn,
            signOut,
            impersonate,
            getHomepage,
            getUserList,
            idToken,
        }} {...props} />
    );
}

const useService = () => React.useContext(ServiceContext)

export { ServiceProvider, ServiceContext, useService };
