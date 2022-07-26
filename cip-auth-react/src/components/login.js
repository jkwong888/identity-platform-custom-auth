import React, { Component }  from 'react';
import { ServiceContext } from '../context/service';
import { withRouter } from 'react-router-dom';

function Login(props) {
    return (
        <div className="Login">
            <h1>Log in</h1>
            <LoginForm/>
        </div>
    );
}

class LoginFormBase extends Component {
    static contextType = ServiceContext;
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
        this.context.signIn(this.state.username, this.state.password)
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
            <div className="Home" align="center">
                <form onSubmit={this.onSubmit}>
                    <table className="LoginForm">
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
                            <tr align="right">
                                <td>
                                    <button disabled={isInvalid} type="submit">Login</button>
                                </td>
                            </tr>
                            {error && <tr>
                                <td>
                                    {error && <p>{error.message}</p>}
                                </td>
                            </tr>
                            }

                        </tbody>
                    </table>
                </form>
                </div>
        )
    }
}

const LoginForm = withRouter(LoginFormBase);
export default Login;
