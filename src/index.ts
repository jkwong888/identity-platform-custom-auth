// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { appendFile } from "fs";


const {google} = require('googleapis');
const iamcredentials = google.iamcredentials("v1");
import admin from 'firebase-admin';
import { getAuth }  from 'firebase-admin/auth';

const kjur = require('jsrsasign');

const https = require('https');
const express = require('express');
const path = require('path');
const morgan = require('morgan');

const app = express();
const cors = require('cors')

const googleAuth = new google.auth.GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

const GOOGLE_CIP_PROJECT = 'jkwng-identity';
const GOOGLE_SECURE_TOKEN_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const GOOGLE_SECURE_TOKEN_ISS_PREFIX = 'https://securetoken.google.com/';
const GOOGLE_SECURE_TOKEN_ISS = GOOGLE_SECURE_TOKEN_ISS_PREFIX + GOOGLE_CIP_PROJECT;

// sub is the email address of the service account in a GCP project that has identity platform API turned on.  if the app
// is a firebase app, you'll get one of these automatically with the right permissions and can make sub and del the same value
const sub = 'firebase-adminsdk-tyuf3@jkwng-identity.iam.gserviceaccount.com';

// del will be the service account this node app runs as.   if you're using app engine or cloud run, we'll auto discover it. 
// make sure permissions are set and we'll as follows
// -- del needs roles/iam.serviceAccountTokenCreator on sub
var del;
googleAuth.getCredentials().then((res) => {
  del = res.client_email;

  // delegate - the service account that will create the JWT signing request
  console.log("del: " + res.client_email);

  // sub - the service account whose key will be used to sign the request
  console.log("sub: " + sub);

  getOauthToken();
});

googleAuth.getClient().then((value) => {
  google.options({
    auth: value
  })

});

function getOauthToken() {
  // sign using sub's private key
  var generateAccessTokenReq = {
    name: "projects/-/serviceAccounts/" + sub,
    requestBody: {
      scope: [
        "openid",
        "https://www.googleapis.com/auth/cloud-platform",
      ],
      lifetime: "3600s",
    }
  };
  //console.log(generateAccessTokenReq);

  iamcredentials.projects.serviceAccounts.generateAccessToken(generateAccessTokenReq).then((output) => {
    //console.log(sJWT);
    //console.log(output);

  }).catch((reason) => {
    console.log("failed to access token: " + reason);
  });

}

console.log(googleAuth);

const firebaseAdmin = admin.initializeApp(
  {
    //credential: googleAuth,
    projectId: GOOGLE_CIP_PROJECT,
  }
);


// load the userlist from disk
const fs = require('fs');

const rawdata = fs.readFileSync("users.json");
const users = JSON.parse(rawdata);
console.log("loaded users.json from disk: ", JSON.stringify(users));

// load the public cert list for verification from google securetoken service
const googleSecureTokenCerts = {};
https.get(GOOGLE_SECURE_TOKEN_URL, {}, (res) => {
  var certsStr = '';
  res.on('data', (d) => {
    certsStr = certsStr + d;
  });

  res.on('end', () => {
    const googleSecureTokenCertsTmp = JSON.parse(certsStr);
    for (const [kid, cert] of Object.entries(googleSecureTokenCertsTmp)) {
      var key = kjur.KEYUTIL.getKey(cert);
      googleSecureTokenCerts[kid] = key;

    }
    //console.log(googleSecureTokenCerts);
  })
});
console.log("loaded secure token certs from google URL: " + GOOGLE_SECURE_TOKEN_URL);

app.use(morgan('combined'));

// TODO: limit the domains this applies to
app.use(cors())

app.use(express.json());

// Use the built-in express middleware for serving static files from pre-built react app
app.use(express.static(path.join(__dirname, 'cip-auth-react/build')));

function isBearerAuth(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // no token so unauthenticated
    return false;
  }

  var authTokenArr = authHeader.split(' ');
  if (authTokenArr[0].toLowerCase() != 'bearer') {
    return false;
  }

  return true;
}

function getToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // no token so unauthenticated
    return null;
  }

  var authTokenArr = authHeader.split(' ');
  if (authTokenArr[0].toLowerCase() != 'bearer') {
    return null;
  }

  return authTokenArr[1];
}

function syncAdminClaim(firebaseTokenObj) {
  var dbAdmin = false;
  var uid = firebaseTokenObj['user_id'];
  var user = firebaseTokenObj['email'];
  var isAdmin = firebaseTokenObj['isAdmin'];

  // if firebase doesn't say we're admin, check the config file to see if we are admin and update it
  if (user in users && 'attributes' in users[user]) {
    console.log(`${user} is admin: ${users[user]['attributes']['isAdmin']}`);
    dbAdmin = users[user]['attributes']['isAdmin'];
  }

  if (dbAdmin !== isAdmin) {
  // TODO: tell firebase we're admin by passing a custom claim back to firebase.  
    console.log(`sync firebase admin claim for: ${user}: ${dbAdmin}...`);
    admin.auth().setCustomUserClaims(uid, {isAdmin: true});
  }

  return dbAdmin;
}

/*
 * verify a firebase token - we use 3rd party jwt library to validate but you can also use firebase-admin sdk to do this
 */
function authenticateToken(req, res, next) {
  res.locals.isAuthenticated = false;

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    next();
    return;
  }

  // basic auth is not supported, so we want to throw an error if "basic" appears in the authorization string
  if (!isBearerAuth(req)) {
    res.status(401).send('Basic auth not supported');
    return;
  }

  // See here for token verification steps: 
  // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
  const token = getToken(req);
  //console.log(token);

  // get the kid from the token header
  var jwt = kjur.KJUR.jws.JWS.parse(token);
  var kid = jwt.headerObj['kid'];
  var alg = jwt.headerObj['alg'];
  //console.log(kid);

  // get the pubkey for this kid
  const pubkey = googleSecureTokenCerts[kid];
  if (! pubkey) {
    res.status(403).send('Invalid token -- Unknown kid');
    return;
  }

  // validate the signature on the token using the pubkey
  // -- also validates iat and exp
  var isValid = kjur.KJUR.jws.JWS.verifyJWT(token, pubkey, {alg: [alg]});
  if (!isValid) {
    res.status(403).send('Invalid token');
    return;
  }

  // check if the projects match, i.e. this is a token from our CIP project
  //console.log(jwt.payloadObj);
  if (jwt.payloadObj['aud'] !== GOOGLE_CIP_PROJECT) {
    isValid = false;
    res.status(403).send('Invalid token');
    return;
  }

  // iss must be the securetoken URL with our project in it
  if (jwt.payloadObj['iss'] !== GOOGLE_SECURE_TOKEN_ISS) {
    isValid = false;
    res.status(403).send('Invalid token');
    return;
  }

  // auth_time must be in the past
  const tNow = kjur.jws.IntDate.get('now');
  if (jwt.payloadObj['auth_time'] > tNow) {
    isValid = false;
    res.status(403).send('Invalid token');
    return;
  }
  
  // sub must be non-empty -- corresponds to the user id
  if (!jwt.payloadObj['sub'] || jwt.payloadObj['sub'] === '') {
    isValid = false;
    res.status(403).send('Invalid token');
    return;
  }

  res.locals.isAuthenticated = true;
  res.locals.email = jwt.payloadObj['email'];
  res.locals.uid = jwt.payloadObj['user_id'];
  res.locals.team = jwt.payloadObj['team'];

  // performance wise maybe it's not the best place to put this in the path of every service call
  var isAdmin = syncAdminClaim(jwt.payloadObj);
  res.locals.isAdmin = isAdmin;

  next();
}

function isAdmin(req, res, next) {
  // check if passed token has admin
  const token = getToken(req);
  if (!token) {
    res.status(403).send("Unauthorized");
    return;
  }

  if (!res.locals.isAuthenticated) {
    res.status(403).send("Unauthorized");
    return;
  }

  if (!res.locals.isAdmin) {
    res.status(403).send("Unauthorized");
    return;
  }

  next();
}

app.get('/homepage', authenticateToken, (req, res) => {
  const defaultResponse = {
    uid: "nobody",
    team: "nobody",
    isAdmin: 0,
  }

  const token = getToken(req);
  if (!token) {
    res.status(200).json(defaultResponse);
    return;
  }

  res.status(200).json({
    isAdmin: res.locals.isAdmin,
    team: res.locals.team,
    uid: res.locals.uid,
    email: res.locals.email,
  });

});

app.get('/listUsers', authenticateToken, isAdmin, async (req, res) => {
  var defaultResponse = [];
  const listAllUsers = async (nextPageToken) => {
    // List batch of users, 1000 at a time.
    await getAuth(firebaseAdmin)
      .listUsers(1000, nextPageToken)
      .then((listUsersResult) => {
        listUsersResult.users.forEach((userRecord) => {
          //console.log('user', userRecord.toJSON());
          if (userRecord.email != null ) {
            defaultResponse.push({
              "uid": userRecord.uid,
              "email": userRecord.email,
            });
          }
        });
        if (listUsersResult.pageToken) {
          // List next batch of users.
          listAllUsers(listUsersResult.pageToken);
        }
      })
      .catch((error) => {
        console.log('Error listing users:', error);
      });
  };

  await listAllUsers("0");

  //console.log(defaultResponse);

  // firebase admin to get all users
  res.status(200).json(defaultResponse);

});

app.post('/impersonate', authenticateToken, isAdmin, (req, res) => {
  var defaultResponse = [];

  // construct JWT Payload for signing using our SA private key
  const tNow = kjur.jws.IntDate.get('now');
  const tEnd = kjur.jws.IntDate.get('now + 1hour');

  //console.log(req.body);

  var oPayload = {
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    nbf: tNow,
    iat: tNow,
    exp: tEnd,
    iss: sub,
    sub: sub,
    user_id: req.body.uid,
    scope: 'https://www.googleapis.com/auth/identitytoolkit',
    claims: {},
  };

  const sPayload = JSON.stringify(oPayload);

  //console.log("sPayload: " + sPayload);

  // sign using sub's private key
  var signJwtReqBody = {
    name: "projects/-/serviceAccounts/" + sub,
    requestBody: {
      delegates: [
        del
      ],
      payload: sPayload,
    }
  };

  //console.log("payload: " + JSON.stringify(signJwtReqBody));
  
  // sign the JWT -- the client will take this and submit it to CIP to get a real token
  var sJWT;
  iamcredentials.projects.serviceAccounts.signJwt(signJwtReqBody).then((output) => {
    sJWT = output.data.signedJwt;
    //console.log(sJWT);

    res.send(sJWT);
  }).catch((reason) => {
    console.log("failed to sign: " + reason);
    res.status(500).send(reason);
  });
});

/* custom authentication using the passwords in the json database */
app.post('/authenticate', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  // check if username/password matches
  if (!(username in users)) {
    // send 401
    res.status(401).send('login failed');
    return;
  }

  if (users[username]['password'] !== password) {
    // send 401
    res.status(401).send('login failed');
    return;
  }

  // construct JWT Payload for signing using our SA private key
  const tNow = kjur.jws.IntDate.get('now');
  const tEnd = kjur.jws.IntDate.get('now + 1hour');

  var oPayload = {
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    nbf: tNow,
    iat: tNow,
    exp: tEnd,
    iss: sub,
    sub: sub,
    user_id: username,
    scope: 'https://www.googleapis.com/auth/identitytoolkit',
    claims: users[username]['attributes'],
  };

  const sPayload = JSON.stringify(oPayload);

  //console.log("sPayload: " + sPayload);

  // sign using sub's private key
  var signJwtReqBody = {
    name: "projects/-/serviceAccounts/" + sub,
    requestBody: {
      delegates: [
        del
      ],
      payload: sPayload,
    }
  };

  //console.log("payload: " + JSON.stringify(signJwtReqBody));
  
  // sign the JWT -- the client will take this and submit it to CIP to get a real token
  var sJWT;
  iamcredentials.projects.serviceAccounts.signJwt(signJwtReqBody).then((output) => {
    sJWT = output.data.signedJwt;
    //console.log(sJWT);

    res.send(sJWT);
  }).catch((reason) => {
    console.log("failed to sign: " + reason);
    res.status(500).send(reason);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/build'));
});

// Start the server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

const shutdown = () => {
  console.log('Stopping ...');
  server.close(() => {
    console.log('Stopped');
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// [END gae_flex_node_static_files]
module.exports = app;

