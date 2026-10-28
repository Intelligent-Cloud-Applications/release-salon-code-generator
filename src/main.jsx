window.global = window;
import { Buffer } from "buffer";
window.Buffer = Buffer;

import React from "react";
import ReactDOMClient from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";
import ContextProvider from "./development/Context/ContextProvider";
import "./index.css";
import App from "./App";
import institutionData from "./constants";

console.log("ckck", import.meta.env.VITE_APP_STAGE);

// --- Helpers for cleaner config ---
const isProd = import.meta.env.VITE_APP_STAGE === "PROD";
const isDevEnv = import.meta.env.NODE_ENV === 'development';

// V6 Requirement: Redirects MUST be arrays
const redirectSignIn = isDevEnv
  ? ['http://localhost:3000/redirect']
  : [institutionData.BETA_DOMAIN + '/redirect'];

const redirectSignOut = isDevEnv
  ? ['http://localhost:3000']
  : [institutionData.BETA_DOMAIN];

// --- Amplify v6 Configuration ---
Amplify.configure({
  Auth: {
    Cognito: {
      region: isProd ? "us-east-1" : "us-east-2",
      userPoolId: isProd
        ? import.meta.env.VITE_APP_PROD_USER_POOL_ID
        : import.meta.env.VITE_APP_DEV_USER_POOL_ID,
      // CHANGE: 'userPoolWebClientId' renamed to 'userPoolClientId'
      userPoolClientId: isProd
        ? import.meta.env.VITE_APP_PROD_CLIENT_ID
        : import.meta.env.VITE_APP_DEV_CLIENT_ID,
      identityPoolId: isProd
        ? import.meta.env.VITE_APP_PROD_IDENTITY_POOL_ID
        : import.meta.env.VITE_APP_DEV_IDENTITY_POOL_ID,

      // CHANGE: OAuth moved inside 'loginWith'
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_APP_AUTH_DOMAIN_BETA,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: redirectSignIn,   // Must be Array
          redirectSignOut: redirectSignOut, // Must be Array
          responseType: 'code'
        }
      }
    }
  },
  Storage: {
    // CHANGE: 'AWSS3' renamed to 'S3'
    S3: {
      region: isProd ? "us-east-1" : "us-east-2",
      bucket: "templatesalon.awsaiapp.com",
    },
  },
  API: {
    // CHANGE: 'endpoints' array replaced by 'REST' object
    REST: {
      main: { // The key 'main' is the API Name
        endpoint: isProd
          ? import.meta.env.VITE_APP_PROD_API_ENDPOINT
          : import.meta.env.VITE_APP_DEV_API_ENDPOINT,
        region: isProd ? "us-east-1" : "us-east-2",
      }
    }
  },
});

// Note: In v6, Amplify.configure doesn't return the config object,
// so logging 'Amplify' shows the library instance, not the config JSON.
console.log("Amplify Configured");

const root = ReactDOMClient.createRoot(document.getElementById("root"));
root.render(
  <ContextProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ContextProvider>
);