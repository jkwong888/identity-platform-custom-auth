import React, { useState, useEffect, useCallback } from 'react';

import { useService } from '../context/service';

function Home(props) {
    const service = useService();
    const [data, setData] = useState({
        uid: null, 
        team: null, 
        isAdmin: "false", 
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
                    isAdmin: String(response.isAdmin),
                    email: response.email,
                    error: null,
                });
            }).catch((error) => {
                //console.log(error);
                setData({
                    uid: null,
                    team: null,
                    isAdmin: "false",
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
                isAdmin: "false",
                email: null,
                error: null
            });
        }

    }, [getHomepage]);

    return (
        data.error 
        ? <div>Error: {data.error}</div>
        : <div className="Home" align="center">
            <div>
                {data.uid ? `Hi there ${data.email}` : "Please log in!"}
            </div>
            <div>
                <br></br>
            </div>
            <div>
                { data.uid && 
                <table>
                    <thead>
                        <tr>
                            <th align="center" colSpan="2">
                                Homepage
                            </th>
                        </tr>
                    </thead>
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
                }
            </div>
        </div>
    );
}

export default Home;