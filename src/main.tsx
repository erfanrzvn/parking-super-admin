import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Amplify configuration
import { Amplify } from 'aws-amplify';

// Inline Amplify configuration for production reliability
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ca-central-1_UecP7kd1N',
      userPoolClientId: '7ckai37tgmnlqeeq5i4ujvkm6n',
      identityPoolId: 'ca-central-1:a47d9621-3bf4-48ff-8560-f350e18bbb99',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    }
  },
  API: {
    GraphQL: {
      endpoint: 'https://dp457mgtrvdkfod6o6mmhpoy74.appsync-api.ca-central-1.amazonaws.com/graphql',
      region: 'ca-central-1',
      defaultAuthMode: 'userPool',
      apiKey: 'da2-jjcraxop5bgjvdtm2k4iupt64e',
    }
  }
};

Amplify.configure(amplifyConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
