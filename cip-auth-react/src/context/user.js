
import React from 'react';
import { useAuth } from './auth';


const UserContext = React.createContext()

function UserProvider(props) {
    const auth = useAuth();

    return (
        <UserContext.Provider value={ auth ? auth.uid : null} {...props} />
    );
}

const useUser = () => React.useContext(UserContext)

export { UserProvider, useUser };