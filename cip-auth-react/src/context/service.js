import React, { useEffect, useState } from 'react';

import axios from 'axios';

import { useAuth } from './auth';

const ServiceContext = React.createContext()

const defaultOptions = {
    baseURL: 'http://10.11.0.37:8080',
    headers: {
        'Content-Type': 'application/json',
    },
};

export const getCustomToken = (username, password) => {
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


class Service {
    constructor() {
        this.svc = axios.create(defaultOptions);
    }

    get = (url, options = {}) => {
        this.setAuthToken();
        return this.svc.get(url, { ...defaultOptions, ...options});
    }

    post = (url, options = {}) => {
        this.setAuthToken();
        return this.svc.post(url, { ...defaultOptions, ...options});
    }

    put = (url, options = {}) => {
        this.setAuthToken();
        return this.svc.put(url, { ...defaultOptions, ...options});
    }

    delete = (url, options = {}) => {
        this.setAuthToken();
        return this.svc.delete(url, { ...defaultOptions, ...options});
    }

    setAuthToken = () => {
        var token = localStorage.getItem('idToken');
        this.svc.defaults.headers.common['Authorization'] = '';
        delete this.svc.defaults.headers.common['Authorization'];

        if (token && token !== 'null') {
            this.svc.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    };

}

function ServiceProvider(props) {
    const auth = useAuth();
    const [idToken, setIdToken] = useState();

    useEffect(() => {
        setIdToken(auth.authData.idToken);

    }, [auth.authData]);

    return (
        <ServiceContext.Provider value={{
            svc: new Service(),
            idToken,
        }} {...props} />
    );
}

const useService = () => React.useContext(ServiceContext)

export { ServiceProvider, ServiceContext, useService };
