import React, { useState, useEffect, useCallback } from 'react';

import { useService } from '../context/service';
import { useAuth } from '../context/auth';

function UnauthenticatedHome(props) {
    const service = useService();
    const [data, setData] = useState({
        uid: null, 
        error: null
    });

    const getHomepage = useCallback(() => {
        service.getHomepage()
            .then((response, err) => {
                //console.log(response);
                setData({
                    uid: response.uid, 
                    error: null
                });
            }).catch((error) => {
                console.log(error);
                setData({
                    uid: null, 
                    error: error,
                });
            });;

    }, [service]);

    useEffect(() => {
        getHomepage();

        return function cleanup() {
            setData({
                uid: null, 
                error: null,
            });
        }
    }, [getHomepage]);


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
    const [data, setData] = useState({
        uid: null, 
        team: null, 
        isAdmin: false, 
        email: null,
        error: null
    });

    const getHomepage = useCallback(() => {
        service.getHomepage()
            .then((response, err) => {
                //console.log(response);
                setData({
                    uid: response.uid,
                    team: response.team,
                    isAdmin: response.isAdmin,
                    email: response.email,
                    error: null,
                });
            }).catch((error) => {
                //console.log(error);
                setData({
                    uid: null,
                    team: null,
                    isAdmin: false,
                    email: null,
                    error: error,
                });

            });

    }, [service]);

    useEffect(() => {
        getHomepage();

        return function cleanup() {
            setData({
                uid: null,
                team: null,
                isAdmin: false,
                email: null,
                error: null
            });
        }

    }, [getHomepage]);

    return (
        data.error 
        ? <div>Error: {data.error}</div>
        : <div className="Home">
            <div>
                Hi there {data.email}
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
                            <td>email</td>
                            <td>{data.email}</td>
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