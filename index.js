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

var sub = '';
googleAuth.getCredentials().then((res) => {
  sub = res.client_email;

  console.log("whoami: " + sub);
});

googleAuth.getClient().then((value) => {
  google.options({
    auth: value
  })
});

// TODO: get these on startup from metadata service?  or client lib
var sPKCS8PEM = '';
var kid = '';


app.set('view engine', 'pug');

app.use(express.json());

// Use the built-in express middleware for serving static files from './public'
app.use('/static', express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/authenticate', (req, res) => {
  // NOTE: This is an example token generator to allow you to easily create
  // Firebase custom auth tokens with a service account JSON file. You should
  // integrate token generation and signing in to your own code using a Google
  // client library for the language you work with.

  // These values are extracted from the service account JSON.

  console.log(req.body);

  var username = req.body.username;
  var password = req.body.password;

  // TODO: check if they match


  // Generate an ID token and sign it with the private key.
  var uid = username;

  // Header
  var oHeader = {alg: 'RS256', kid: kid, typ: 'JWT'};

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

  var sHeader = JSON.stringify(oHeader);
  var sPayload = JSON.stringify(oPayload);

  console.log("payload: " + JSON.stringify(oPayload));
  
  // sign the JWT
  var sJWT;
  iamcredentials.projects.serviceAccounts.signJwt({
    name: "projects/-/serviceAccounts/" + sub,
    requestBody: {
      payload: sPayload
    }
  }).then((output) => {
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

