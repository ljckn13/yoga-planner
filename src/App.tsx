import { FlowPlanner } from './components/FlowPlanner';
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import { SignIn } from './components/SignIn';
import './App.css';

function AppContent() {
  const { user, isLoading } = useAuthContext();

  // Only show loading if auth is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return <FlowPlanner />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;