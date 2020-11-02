import React from 'react';

const AuthUserContext = React.createContext(null);
class withAuthentication extends Component {
    constructor(props) {
        super(props);

        this.state = {
            auth: new Auth(),
        };
    }

    componentDidMount() {
        console.log(this.props.auth);
        this.listener = this.props.auth.firebase.onAuthStateChanged(
            authUser => {
                if (authUser) {
                    this.setState({
                        uid: authUser.uid,
                    })
                    authUser.getIdToken(false).then(
                        idToken => {
                            this.setState({ idToken })
                        }
                    )
                } else {
                    this.setState({ 
                        uid: null,
                        idToken: null,
                    })
                }
            }
        );
    }

    componentWillUnmount() {
        this.listener();
    }

    render() {
        return (
            <AuthUserContext.Provider value={this.state.auth}>
                <Component {...props} />
            </AuthUserContext.Provider>
        );
    }
}
export default AuthUserContext;