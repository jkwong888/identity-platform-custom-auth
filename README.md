# Cloud Identity Platform with Custom Authentication tokens

This is a small nodejs backend with a React frontend for implementing custom authentication tokens with Google Cloud Identity Platform.

The frontend uses the firebase auth library to handle token requests and refreshes, but you can implement this yourself using the REST API following the documentation here: [https://cloud.google.com/identity-platform/docs/use-rest-api](https://cloud.google.com/identity-platform/docs/use-rest-api).  Firebase has a javascript library as well as IOS and Android SDKs.

The NodeJS backend has the following APIS:
- `/homepage` endpoint will validate the token returned by the CIP API using the secure token public keys/certs, decodes the token and returns the encoded claims to client.
  - the `Home` page will display different content based on who's logged in.
- `/listUsers` lists the users in firebase using the firebase admin SDK.
  - If the logged in user is an admin, the `Users` link will show in the top which will contain a list of users, and allow the admin to impersonate a user.
- `/impersonate` endpoint returns a custom token for a particular UID in firebase for the purpose of impersonating another user without requiring their password. This is an admin function (if the users.json has an `isAdmin` attribute for the user, then this is allowed, otherwise the client gets a 403).
  - the react client will take the token returned here and exchange it for an id token from firebase using `signInWithCustomToken`.  
-  *(UNUSED)* `/authenticate` endpoint verifies the username/password (backed by a "database" in JSON) and encodes custom claims corrsponding to the team the user is in. The Google Auth API is called with the service account to sign a custom token used to pass to the Cloud Identity Platform API (signInWithCustomToken).  The CIP API returns an identity token with the custom claims that can be verified on the backend and decoded to present different content on the home page depending on the user.
  - note that the frontend now does authentication using "Email / Password" provider in Identity Platform / Firebase Auth, the backend does not need to store passwords, just whether it's an admin and "team" data.

I am not a frontend developer by any stretch so please excuse the bad coding practices and memory leaks :)  I used this as an opportunity to learn React :)


## Project setup
1. create a GCP project e.g. `jkwng-identity`
   - You will need to replace the value of `GOOGLE_CIP_PROJECT` in [./index.js](./index.js) with this project name.  or you can set `CLOUD_IDENTITY_PROJECT` environment variable.
2. Enable Cloud Identity Platform
   - in the GCP console, under `Identity Platform` -> `Provider`, check the `Application Setup Details` link to get the api key and authDomain.
   - You will need to replace this in [./cip-auth-react/src/context/firebase.js](./cip-auth-react/src/context/firebase.js) with your values, this is the frontend app
3. Enable Identity Toolkit API and Token Service API
   - a service account should be created with the role  `Firebase Admin SDK Service Agent` - this was called `firebase-adminsdk-tyuf3@jkwng-identity.iam.gserviceaccount.com` in my project.
   - You will need to replace the value of the constant `sub` in [./index.js](./index.js) with this email address. (or set `SUB` environment variable).
4. Create a second GCP project where this application will be deployed e.g. `jkwng-identity-dev`
5. Enable IAM Service Account Credentials API, Cloud Run Admin API in `jkwng-identity-dev`
6. Create a service account in `jkwng-identity-dev`, e.g. `cip-custom-auth@jkwng-identity-dev.iam.gserviceaccount.com`
7. Assign the role `Service Account Token Creator` on service account `firebase-adminsdk-tyuf3@jkwng-identity.iam.gserviceaccount.com` to `cip-custom-auth@jkwng-identity-dev.iam.gserviceaccount.com`
8. Assign the roles `Service Account Admin` and and `Service Account Token Creator` on service account `cip-custom-auth@jkwng-identity-dev.iam.gserviceaccount.com` to `cip-custom-auth@jkwng-identity-dev.iam.gserviceaccount.com` (i.e. itself)
9. Build the project in `jkwng-identity-dev` and push to GCR
10. Assign the role `Firebase Authencation Admin` on service account `cip-custom-auth@jkwng-identity-dev.iam.gserviceaccount.com` to `jkwng-identity` to allow the backend to list users in Identity Platform/Firebase Auth.
11. Deploy to Cloud Run.  make sure the app runs as your service account `cip-custom-auth@jkwng-identity-dev.iam.gserviceaccount.com`.

