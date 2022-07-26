import React, { useEffect, useState }  from 'react';
import { useAuth } from '../context/auth';
import { useService } from '../context/service';
import { Link, useHistory } from 'react-router-dom';


function LoginLink(props) {
    const auth = useAuth();
    const service = useService();
    const history = useHistory();

    const [
        userData, setUserData,
    ] = useState({
        uid: null,
        email: null,
        isLoggedIn: false,
    });

    const doSignOut = () => {
        service.signOut().then(() => {
            setUserData({
                uid: null,
                email: null,
                isLoggedIn: false,
            });
            history.push('/');
        });
    }

    useEffect(() => {
        setUserData({
            uid: auth.authData.uid,
            email: auth.authData.email,
            isLoggedIn : auth.authData.uid != null,
        });
    }, [
        auth.authData.uid, 
        auth.isLoggedIn, 
        auth.authData.email
    ]);

    //console.log(auth);
    if (userData.isLoggedIn) {
        return <Link to='/' onClick={doSignOut}>Logout {userData.email}</Link>;
    } else {
        return <Link to='/login'>Login</Link>;
    }
}

export default LoginLink;