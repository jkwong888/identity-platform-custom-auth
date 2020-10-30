import React, { Component }  from 'react';
import { withFirebase } from './firebase';
import { AuthUserContext } from './auth';
import { withRouter, Link } from 'react-router-dom';

import { getCustomToken } from '../service';

function Login(props) {
    return (
        <div className="Login">
            <h1>Log in</h1>
            <LoginForm/>
        </div>
    );
}

class LoginFormBase extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            error: null,
        }
    }

    onSubmit = event => {
        getCustomToken(this.state.username, this.state.password).then((token) => {
            //console.log(token);
            this.props.firebase
                .doSignInWithCustomToken(token)
                .then(() => {
                    this.setState({
                        username: '',
                        password: '',
                        error: null,
                    });

                    this.props.history.push('/');
                })
        }).catch((error) => {
            this.setState({error});
        });

        event.preventDefault();

    };

    onChange = event => {
        this.setState({ [event.target.name]: event.target.value })
    };

    render() {
        const {
            username,
            password,
            error,
        } = this.state;

        const isInvalid = 
            username === '' ||
            password === '';

        return (

            <form onSubmit= {this.onSubmit}>
                <input
                    name="username"
                    value={username}
                    onChange={this.onChange}
                    type="text"
                    placeholder="Username"
                />
                <input
                    name="password"
                    value={password}
                    onChange={this.onChange}
                    type="password"
                    placeholder="Password"
                />
                <button disabled={isInvalid} type="submit">Login</button>

                {error && <p>{error.message}</p>}

            </form>
        )

    }
}


class LoginLinkBase extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
        <AuthUserContext.Consumer>
            {
                authUser  => authUser
                    ? <Link to='/' onClick={this.props.firebase.doSignOut}>Logout</Link>
                    : <Link to="/login">Login</Link> 
            }
        </AuthUserContext.Consumer>
        );
    }
}

const LoginForm = withRouter(withFirebase(LoginFormBase));
const LoginLink = withFirebase(LoginLinkBase);

export default Login;

export { LoginLink };