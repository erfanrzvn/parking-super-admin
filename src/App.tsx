import { useState, useEffect } from 'react';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import './App.css';
import Login from './components/Login';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import Admins from './pages/Admins';
import Units from './pages/Units';
import Parkings from './pages/Parkings';
import Reservations from './pages/Reservations';

// Amplify is already configured in amplifyConfig.ts (imported in main.tsx)

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
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
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
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
