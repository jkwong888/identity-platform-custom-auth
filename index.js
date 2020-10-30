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

// [START run_helloworld_service]
// Initialize the default app
var firebaseAdmin = require('firebase-admin');
var firebaseApp = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.applicationDefault()
});

const {google} = require('googleapis');
const iamcredentials = google.iamcredentials("v1");
const KJUR = require('jsrsasign');
const express = require('express');
const app = express();

var googleAuth = new google.auth.GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

// sub is the email address of the service account in a GCP project that has identity platform API turned on.  if the app
// is a firebase app, you'll get one of these automatically with the right permissions.
var sub = 'firebase-adminsdk-tyuf3@jkwng-identity.iam.gserviceaccount.com';

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

});

googleAuth.getClient().then((value) => {
  google.options({
    auth: value
  })
});

// load the userlist from disk
const fs = require('fs');

let rawdata = fs.readFileSync("users.json");
let users = JSON.parse(rawdata);
console.log("loaded users.json from disk: ", JSON.stringify(users));

app.set('view engine', 'pug');

app.use(express.json());

// Use the built-in express middleware for serving static files from './public'
app.use('/static', express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/authenticate', (req, res) => {
  //console.log(req.body);


  var username = req.body.username;
  var password = req.body.password;

  // TODO: check if they match
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

  // Payload
  var oPayload = {};
  var tNow = KJUR.jws.IntDate.get('now');
  var tEnd = KJUR.jws.IntDate.get('now + 1hour');
  oPayload.aud = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
  oPayload.exp = tEnd;
  oPayload.iat = tNow;
  oPayload.iss = sub;
  oPayload.sub = sub;
  oPayload.user_id = username;
  oPayload.scope = 'https://www.googleapis.com/auth/identitytoolkit';
  oPayload.claims = users[username]["attributes"];

  var sPayload = JSON.stringify(oPayload);

  var signJwtReqBody = {
    name: "projects/-/serviceAccounts/" + sub,
    requestBody: {
      delegates: [
        del
      ],
      payload: sPayload
    }
  };

  console.log("payload: " + JSON.stringify(signJwtReqBody));
  
  // sign the JWT
  var sJWT;
  iamcredentials.projects.serviceAccounts.signJwt(signJwtReqBody).then((output) => {
    sJWT = output.data.signedJwt;
    console.log(sJWT);

    res.send(sJWT);
  }).catch((reason) => {
    console.log("failed to sign: " + reason);
  });


  // TODO: get the real identity platform auth token

  //document.getElementById('tokenbox').textContent = sJWT;

  //var link = '<a href="../customauth.html#token=' + sJWT + '">Use this token in the web custom auth example</a>';
  //document.getElementById('linktokenbox').innerHTML = link;

});


// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

// [END gae_flex_node_static_files]
module.exports = app;

