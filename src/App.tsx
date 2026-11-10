import AdminPage from '@/pages/AdminPage';
import HomePage from '@/pages/HomePage';

function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  return isAdminRoute ? <AdminPage /> : <HomePage />;
}

export default App;
