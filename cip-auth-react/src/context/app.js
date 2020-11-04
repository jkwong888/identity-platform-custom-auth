import React from 'react';
import { AuthProvider } from './auth';
import { UserProvider } from './user';
import { FirebaseProvider } from './firebase';
import { ServiceProvider } from './service';

function AppProvider({ children }) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <ServiceProvider>
          <UserProvider>{children}</UserProvider>
        </ServiceProvider>
      </AuthProvider>
    </FirebaseProvider>
  )
}

export default AppProvider