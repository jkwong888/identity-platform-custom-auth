function sendRequest(method, url, body) {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // TODO: redirect to somewhere nice

            document.getElementById("output").innerHTML = "Your roken is " + xhr.responseText;
        }
    }

    xhr.send(body);
}

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
    // Listening for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var providerData = user.providerData;
        // [START_EXCLUDE]
        //document.getElementById('login').textContent = 'Signed in';
        //document.getElementById('quickstart-sign-in').textContent = 'Sign out';
        //document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
        // [END_EXCLUDE]
    } else {
        // User is signed out.
        // [START_EXCLUDE]
        document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
        document.getElementById('quickstart-sign-in').textContent = 'Sign in';
        document.getElementById('quickstart-account-details').textContent = 'null';
        // [END_EXCLUDE]
    }
    // [START_EXCLUDE]
    document.getElementById('quickstart-sign-in').disabled = false;
    // [END_EXCLUDE]
    });
    // [END authstatelistener]

    document.getElementById('login').addEventListener('click', toggleSignIn, false);
}

function getHashValue(key) {
    var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
    return matches ? matches[1] : null;
}

window.onload = function() {
    initApp();

    // If a token has been passed in the hash fragment we display it in the UI and start the sign in process.
    //document.getElementById('tokentext').value = getHashValue('token') || '';
    //if (document.getElementById('tokentext').value) {
    //firebase.auth().signInWithCustomToken(getHashValue('token'));
    //}
};

/**
 * Handle the sign in button press.
 */
function login() {
    if (firebase.auth().currentUser) {
        // [START signout]
        firebase.auth().signOut();
        // [END signout]
        return;
    } 

    var username = document.querySelector('#user').value;
    var password = document.querySelector('#password').value;
    var formData = JSON.stringify({
        username: username,
        password: password
    });

    console.log(formData);

    sendRequest("POST", "/authenticate", formData);
    /*

    var token = document.getElementById('tokentext').value;
    if (token.length < 10) {
        alert('Please enter a token in the text area');
        return;
    }
    // Sign in with custom token generated following previous instructions.
    // [START authwithtoken]
    firebase.auth().signInWithCustomToken(token).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode === 'auth/invalid-custom-token') {
        alert('The token you provided is not valid.');
        } else {
        console.error(error);
        }
        // [END_EXCLUDE]
    });
    // [END authwithtoken]
    }
    document.getElementById('quickstart-sign-in').disabled = true;
    */
}

