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
                console.log(token);
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


function LoginLink(props) {
    const auth = useAuth();
    const history = useHistory();

    const [uid, setUid] = useState();

    const doSignOut = () => {
        auth.doSignOut().then(() => {
            setUid(auth.authData.uid);
            history.push('/');
        });
    }

    useEffect(() => {
        setUid(auth.authData.uid);
    }, [auth.authData]);

    //console.log(auth);
    return auth.authData.uid
                ? <Link to='/' onClick={doSignOut}>Logout {uid}</Link>
                : <Link to="/login">Login</Link> ;
}

const LoginForm = withRouter(LoginFormBase);

export default Login;

export { LoginLink };