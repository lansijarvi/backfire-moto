import { Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ADMIN_UID } from '../adminConfig';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-neutral-500">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.uid !== ADMIN_UID) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 text-center px-4">
        <p className="text-neutral-400">This account isn't authorized for admin access.</p>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-neutral-400 hover:text-white border border-neutral-700 rounded px-4 py-2"
        >
          Sign out
        </button>
      </div>
    );
  }

  return children;
}
