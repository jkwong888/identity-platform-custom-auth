import React, { useState, useEffect } from 'react';
import { BrowserRouter, Switch, Route, NavLink } from 'react-router-dom';

import './App.css';

import Login from './components/login';
import LoginLink from './components/loginlink';
import Home from './components/home';
import Users from './components/userlist';
import { useAuth } from './context/auth.js';

//const App = () => {

function App(props) {
  const auth = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  //console.log(auth.authData);
  useEffect(() => {
    setIsAdmin(auth.authData.isAdmin);

    return function cleanup() {
      setIsAdmin(false);
    }

  }, [auth.authData.isAdmin]);

  return <div className="App">
    <BrowserRouter>
    <div className="header">
      <NavLink exact activeClassName="active" to="/">Home</NavLink>
      {isAdmin && <NavLink to="/users">Users</NavLink>}
      <LoginLink/>
    </div>
    <div>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/users" component={Users} />
        <Route exact path="/login" component={Login} />
      </Switch>
    </div>
    </BrowserRouter>
  </div>
}

export default App;
