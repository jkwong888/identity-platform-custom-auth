import React, { useState, useEffect, useCallback } from 'react';

import { useService } from '../context/service';
import { useAuth } from '../context/auth';

function UnauthenticatedHome(props) {
    const service = useService();
    const [data, setData] = useState({uid: null, error: null});

    const getHomepage = useCallback(() => {
        service.svc.get('/homepage')
            .then((response, err) => {
                console.log(response);
                setData({uid: response.data.uid, error: null});
            }).catch((error) => {
                console.log(error);
                setData({uid: null, error: error.response.data});
            });;

    }, [service.svc]);

    useEffect(() => {
        getHomepage();

        return function cleanup() {
            //setUid(null);
            //setError(null);
        }
    }, []);


    return (
        data.error 
            ? <div>Error: {data.error}</div> 
            : <div className="Home">
                Please log in!  You are: {data.uid}
              </div>
    );
}

function AuthenticatedHome(props) {
    const service = useService();
    const [data, setData] = useState({uid: null, team: null, isAdmin: null, error: null});

    const getHomepage = useCallback(() => {
        service.svc.get('/homepage')
            .then((response, err) => {
                console.log(response);
                setData({
                    uid: response.data.uid,
                    team: response.data.team,
                    isAdmin: response.data.isAdmin,
                    error: null,
                });
            }).catch((error) => {
                console.log(error);
                setData({
                    uid: null,
                    team: null,
                    isAdmin: null,
                    error: error.response.data,
                });

            });

    }, [service.svc]);

    useEffect(() => {
        getHomepage();

        return function cleanup() {
            //setUid(null);
            //setError(null);
        }

    }, [getHomepage]);

    return (
        data.error 
        ? <div>Error: {data.error}</div>
        : <div className="Home">
            <div>
                Hi there {data.uid}
            </div>
            <div>
                Token contents:
                <table>
                    <tbody>
                        <tr>
                            <td>uid</td>
                            <td>{data.uid}</td>
                        </tr>
                        <tr>
                            <td>team</td>
                            <td>{data.team}</td>
                        </tr>
                        <tr>
                            <td>isAdmin</td>
                            <td>{data.isAdmin}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Home(props) {
    const auth = useAuth();
    
    //console.log(auth);
    return auth.authData.uid
                ? <AuthenticatedHome/>
                : <UnauthenticatedHome/> ;
}

export default Home;