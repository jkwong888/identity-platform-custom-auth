import React, { Component, useEffect, useState }  from 'react';
import { useAuth, AuthContext } from '../context/auth';
import { withRouter, Link, useHistory } from 'react-router-dom';

function Login(props) {
    return (
        <div className="Login">
            <h1>Log in</h1>
            <LoginForm/>
        </div>
    );
}

class LoginFormBase extends Component {
    static contextType = AuthContext;
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            error: null,
        }
    }

    onSubmit = (event) => {
        //console.log(this.context);
        this.context.doSignIn(this.state.username, this.state.password)
            .then((token) => {
                //console.log(token);
                this.setState({
                    username: '',
                    password: '',
                    error: null,
                });

                this.props.history.push('/');
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
            <table>
                <tbody>
                    <tr>
                        <td>
                            <input
                                name="username"
                                value={username}
                                onChange={this.onChange}
                                type="text"
                                placeholder="Username"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <input
                                name="password"
                                value={password}
                                onChange={this.onChange}
                                type="password"
                                placeholder="Password"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <button disabled={isInvalid} type="submit">Login</button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            {error && <p>{error.message}</p>}
                        </td>
                    </tr>

                </tbody>
            </table>
                </form>
        )
    }
}


function LoginLink(props) {
    const auth = useAuth();
    const history = useHistory();

    const [
        userData, setUserData,
    ] = useState({
        uid: null,
        email: null,
        isLoggedIn: false,
    });

    const doSignOut = () => {
        auth.doSignOut().then(() => {
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
    }, [auth.authData]);

    //console.log(auth);
    if (userData.isLoggedIn) {
        return <Link to='/' onClick={doSignOut}>Logout {userData.email}</Link>;
    } else {
        return <Link to='/login'>Login</Link>;
    }
}

const LoginForm = withRouter(LoginFormBase);

export default Login;

export { LoginLink };