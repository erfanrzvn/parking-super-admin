import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import Admins from './pages/Admins';
import Units from './pages/Units';
import Parkings from './pages/Parkings';
import Reservations from './pages/Reservations';

// Configure Amplify IMMEDIATELY at module load
import { Amplify } from 'aws-amplify';

console.log('🔧 Configuring Amplify...');

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ca-central-1_UecP7kd1N',
      userPoolClientId: '7ckai37tgmnlqeeq5i4ujvkm6n',
      identityPoolId: 'ca-central-1:a47d9621-3bf4-48ff-8560-f350e18bbb99',
      loginWith: {
        email: true
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true
        }
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true
      }
    }
  },
  API: {
    GraphQL: {
      endpoint: 'https://dp457mgtrvdkfod6o6mmhpoy74.appsync-api.ca-central-1.amazonaws.com/graphql',
      region: 'ca-central-1',
      defaultAuthMode: 'userPool'
    }
  }
});

console.log('✅ Amplify configured successfully!');

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'buildings':
        return <Buildings />;
      case 'admins':
        return <Admins />;
      case 'units':
        return <Units />;
      case 'parkings':
        return <Parkings />;
      case 'reservations':
        return <Reservations />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Authenticator
      formFields={{
        signIn: {
          username: {
            label: 'Email',
            placeholder: 'superadmin@parking.com',
          },
        },
      }}
    >
      {({ signOut, user }) => (
        <div className="app-container">
          <Navigation
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onSignOut={signOut!}
            userEmail={user?.signInDetails?.loginId}
          />
          <main className="app-main">
            {renderPage()}
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
