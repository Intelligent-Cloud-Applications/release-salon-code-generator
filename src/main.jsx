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
// Fix: Access environment variable through import.meta.env
console.log("ckck", import.meta.env.VITE_APP_STAGE);

// Updated Amplify configuration for v6
Amplify.configure({
  Auth: {
    region: import.meta.env.VITE_APP_STAGE === "PROD" ? "us-east-1" : "us-east-2",
    userPoolId:
      import.meta.env.VITE_APP_STAGE === "PROD"
        ? import.meta.env.VITE_APP_PROD_USER_POOL_ID
        : import.meta.env.VITE_APP_DEV_USER_POOL_ID,
    userPoolWebClientId:
      import.meta.env.VITE_APP_STAGE === "PROD"
        ? import.meta.env.VITE_APP_PROD_CLIENT_ID
        : import.meta.env.VITE_APP_DEV_CLIENT_ID,
    identityPoolId: import.meta.env.VITE_APP_STAGE === "PROD"
        ? import.meta.env.VITE_APP_PROD_IDENTITY_POOL_ID
        : import.meta.env.VITE_APP_DEV_IDENTITY_POOL_ID,
    // authenticationFlowType: "USER_PASSWORD_AUTH",
    // OAuth settings for older versions
    oauth: {
      domain: import.meta.env.VITE_APP_AUTH_DOMAIN_BETA,
      scope: ['openid', 'email', 'profile'],
      redirectSignIn: import.meta.env.NODE_ENV === 'development' ?
        'http://localhost:3000/redirect' : institutionData.BETA_DOMAIN + '/redirect',
      redirectSignOut: import.meta.env.NODE_ENV === 'development' ?
        'http://localhost:3000' : institutionData.BETA_DOMAIN,
      responseType: 'code'
    }
  },
  Storage: {
    AWSS3: {
      region: "us-east-1",
      bucket: "institution-utils",
    },
  },
  API: {
    endpoints: [
      {
        name: 'main',
        endpoint: import.meta.env.VITE_APP_STAGE === "PROD"
          ? import.meta.env.VITE_APP_PROD_API_ENDPOINT
          : import.meta.env.VITE_APP_DEV_API_ENDPOINT,
        region: import.meta.env.VITE_APP_STAGE === "PROD" ? "us-east-1" : "us-east-2",
      }
    ]
  },
});
// Debugging API Configuration - Fix: Don't log the result of configure as it returns undefined
console.log("Amplify Configuration:", Amplify);

const root = ReactDOMClient.createRoot(document.getElementById("root"));
root.render(
  <ContextProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ContextProvider>
);