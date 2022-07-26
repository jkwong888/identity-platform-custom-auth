# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START run_helloworld_dockerfile]

# Use the official lightweight Node.js 10 image.
# https://hub.docker.com/_/node
FROM node:14-slim as react-builder

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN mkdir cip-auth-react
COPY cip-auth-react ./

RUN cd cip-auth-react && npm install --loglevel verbose  --only=production && npm run-script build

FROM node:14-slim as typescript-builder

WORKDIR /usr/src/app

RUN npm install -g typescript

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you add a package-lock.json, speed your build by switching to 'npm ci'.
# RUN npm ci --only=production
RUN npm install --verbose

# Copy local code to the container image.
COPY tsconfig.json ./
COPY src ./src

RUN npm run-script build

FROM node:14-slim 

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --verbose --only=production

COPY --from=react-builder /usr/src/app/build ./cip-auth-react/build
COPY --from=typescript-builder /usr/src/app/dist ./
COPY users.json ./

EXPOSE 8080

# Run the web service on container startup.
CMD [ "node", "index.js" ]

# [END run_helloworld_dockerfile]
