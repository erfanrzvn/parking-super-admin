import { useState, useEffect } from 'react';
import { signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import './App.css';
import Login from './components/Login';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import Admins from './pages/Admins';
import EditAdmin from './pages/EditAdmin';
import Units from './pages/Units';
import Parkings from './pages/Parkings';
import Reservations from './pages/Reservations';

// Amplify is already configured in amplifyConfig.ts (imported in main.tsx)

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [editingAdminUsername, setEditingAdminUsername] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      
      // Fetch auth session to ensure credentials are available
      const session = await fetchAuthSession({ forceRefresh: true });
      
      // Log session details for debugging
      console.log('🔑 Auth session:', {
        tokens: session.tokens ? 'Present' : 'Missing',
        credentials: session.credentials ? 'Present' : 'Missing',
        identityId: session.identityId
      });
      
      // Log user groups if available
      const groups = session.tokens?.accessToken?.payload['cognito:groups'];
      console.log('👥 User groups:', groups);
      
      setUser(currentUser);
    } catch (err) {
      console.log('No user signed in');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  const renderPage = () => {
    // If editing an admin, show EditAdmin page
    if (editingAdminUsername) {
      return (
        <EditAdmin
          adminUsername={editingAdminUsername}
          onBack={() => {
            setEditingAdminUsername(null);
            setCurrentPage('admins');
          }}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'buildings':
        return <Buildings />;
      case 'admins':
        return <Admins onEditAdmin={(username) => setEditingAdminUsername(username)} />;
      case 'units':
        return <Units />;
      case 'parkings':
        return <Parkings />;
      case 'reservations':
        return <Reservations />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onSignOut={handleSignOut}
        userEmail={user?.username || user?.signInDetails?.loginId}
      />
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
