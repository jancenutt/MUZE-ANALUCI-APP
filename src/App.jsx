import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Archive from '@/pages/Archive';
import ReleaseDetail from '@/pages/ReleaseDetail';
import Ask from '@/pages/Ask';
import Membership from '@/pages/Membership';
import Account from '@/pages/Account';
const LibrarySync = lazy(() => import('@/pages/LibrarySync'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const Profile = lazy(() => import('@/pages/Profile'));
const Brand = lazy(() => import('@/pages/Brand'));
const Links = lazy(() => import('@/pages/Links'));
const Admin = lazy(() => import('@/pages/Admin'));
const ArtistStats = lazy(() => import('@/pages/ArtistStats'));
const ClaimArtist = lazy(() => import('@/pages/ClaimArtist'));
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminOnlyRoute from '@/components/AdminOnlyRoute';
const Playlists = lazy(() => import('@/pages/Playlists'));
const Join = lazy(() => import('@/pages/Join'));
const Terms = lazy(() => import('@/pages/Terms'));
const TermsOfUse = lazy(() => import('@/pages/TermsOfUse'));
const Privacy = lazy(() => import('@/pages/Privacy'));
// Add page imports here

// The artist subdomain (artist.analuci.app) exists for one thing: the
// owner's private stats page. Anyone landing on its root is sent straight
// there — and the admin gate on /artist decides who actually gets in.
const IS_ARTIST_HOST =
  typeof window !== "undefined" && window.location.hostname === "artist.analuci.app";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-amber/20 border-t-amber rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-amber/20 border-t-amber rounded-full animate-spin"></div>
        </div>
      }
    >
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={IS_ARTIST_HOST ? <Navigate to="/artist" replace /> : <Home />}
        />
        <Route path="/archive" element={<Archive />} />
        <Route path="/claim-artist" element={<ClaimArtist />} />
        <Route path="/release/:id" element={<ReleaseDetail />} />
        <Route path="/ask" element={<Ask />} />
        <Route element={<AdminOnlyRoute />}>
          <Route path="/membership" element={<Membership />} />
          <Route path="/pricing" element={<Navigate to="/membership" replace />} />
          <Route path="/join" element={<Join />} />
          <Route path="/artist" element={<ArtistStats />} />
        </Route>
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/brand" element={<Brand />} />
        <Route path="/links" element={<Links />} />
        <Route path="/sync" element={<LibrarySync />} />
        <Route
          element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}
        >
          <Route path="/account" element={<Account />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App