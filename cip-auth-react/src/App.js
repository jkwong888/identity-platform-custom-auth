import React, { Component } from 'react';
import { BrowserRouter, Switch, Route, NavLink } from 'react-router-dom';

import './App.css';

import Login, { LoginLink } from './components/login';
import Home from './components/home';

import { withAuthentication } from './components/auth';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      authUser: null,
    };
  }


  render() {
    return (
      <div className="App">
        <BrowserRouter>
        <div className="header">
          <NavLink exact activeClassName="active" to="/">Home</NavLink>
          <LoginLink/>
        </div>
        <div>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/login" component={Login} />
          </Switch>
        </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default withAuthentication(App);
