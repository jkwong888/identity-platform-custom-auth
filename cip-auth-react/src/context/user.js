
import React from 'react';
import { useAuth } from './auth';


const UserContext = React.createContext()

function UserProvider(props) {
    const auth = useAuth();

    return (
        <UserContext.Provider 
            value={ auth ? auth.email : null} {...props} 
        >
            {props.children}
        </UserContext.Provider>
    );
}

const useUser = () => React.useContext(UserContext)

export { UserProvider, useUser };