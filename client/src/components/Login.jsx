import { useState, useRef, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { createUser, getUser } from '../api/users';
import ErrorMessage from './ErrorMessage';

async function ensureUserDoc(user) {
  const existing = await getUser(user.uid);
  if (!existing) {
    await createUser(user.uid, {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
    });
  }
}

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const [pendingCred, setPendingCred] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [disabledMsg, setDisabledMsg] = useState('');

  useEffect(() => {
    const flag = localStorage.getItem('accountDisabled');
    if (flag === 'true') {
      setDisabledMsg('Akun kamu telah dinonaktifkan oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.');
      localStorage.removeItem('accountDisabled');
    }
  }, []);
  const forgotEmailRef = useRef(null);

  useEffect(() => {
    if (showForgot) {
      const t = setTimeout(() => forgotEmailRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [showForgot]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        setUnverifiedEmail(email);
        setError('Email belum diverifikasi. Cek inbox kamu dan klik link verifikasi.');
        await signOut(auth);
        return;
      }
      await ensureUserDoc(cred.user);
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email atau password salah');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, unverifiedEmail, password);
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setError('Email verifikasi telah dikirim ulang. Cek inbox kamu.');
    } catch {
      setError('Gagal mengirim ulang. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, pendingEmail, password);
      await linkWithCredential(result.user, pendingCred);
      await ensureUserDoc(result.user);
      setPendingCred(null);
      setPendingEmail('');
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Password salah' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setUnverifiedEmail('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(result.user);
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setPendingCred(err.credential);
        setPendingEmail(err.email);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup ditutup, yakin mau lewatin Google Login? Klik lagi ya');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Wah, kebanyakan klik! Santai aja, cukup satu kali klik');
      } else {
        setError(err.message);
      }
    }
  };

  const handleForgotOpen = () => {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotError('');
    setShowForgot(true);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setForgotError(err.code === 'auth/user-not-found' ? 'Email tidak terdaftar' : err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const ForgotModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onPointerDown={(e) => { if (e.target === e.currentTarget) return; }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm" onPointerDown={(e) => e.preventDefault()}>
        <h3 className="text-lg font-semibold mb-1 dark:text-white">Lupa Password</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Masukkan email untuk menerima link reset password.</p>
        {forgotError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{forgotError}</p>
          </div>
        )}
        {forgotSent ? (
          <div>
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 dark:text-green-300">Email reset password telah dikirim</p>
            </div>
            <button
              onClick={() => setShowForgot(false)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium transition"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit}>
            <input
              ref={forgotEmailRef}
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition mb-4"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-medium transition"
              >
                {forgotLoading ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (pendingCred) {
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Hubungkan Akun</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Email <strong>{pendingEmail}</strong> sudah terdaftar dengan password.
          Masukkan password untuk menghubungkan akun Google.
        </p>
        <ErrorMessage message={error} onClose={() => setError('')} />
        <form onSubmit={handleLinkAccount}>
          <div className="relative mb-4">
            <input
              ref={passwordRef}
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onPointerDown={(e) => { e.preventDefault(); const el = passwordRef.current; const focused = document.activeElement === el; const pos = el?.selectionStart ?? 0; setShowPass(s => !s); if (focused) requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(pos, pos); }); }} className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              {showPass ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-medium transition mb-2"
          >
            {loading ? 'Memproses...' : 'Hubungkan'}
          </button>
          <button type="button"
            onClick={() => { setPendingCred(null); setPendingEmail(''); setPassword(''); }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            Batal
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <form onSubmit={handleEmailLogin} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-center dark:text-white">Masuk</h2>
          <ErrorMessage message={error} onClose={() => setError('')} />
          {disabledMsg && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{disabledMsg}</p>
              </div>
              <button onClick={() => setDisabledMsg('')} className="text-red-400 hover:text-red-600 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {unverifiedEmail && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Email belum diverifikasi</p>
                <button
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 disabled:opacity-50"
                >
                  {loading ? 'Mengirim...' : 'Kirim ulang email verifikasi'}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-4 mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-10 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                ref={passwordRef}
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                className="w-full pl-10 pr-10 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); const el = passwordRef.current; const focused = document.activeElement === el; const pos = el?.selectionStart ?? 0; setShowPass(s => !s); if (focused) requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(pos, pos); }); }}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <button type="button" onClick={handleForgotOpen} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition">
              Lupa password?
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-medium transition"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
          <p className="text-center mt-5 text-sm text-gray-500 dark:text-gray-400">
            Belum punya akun?{' '}
            <button type="button" onClick={onSwitch} className="text-blue-600 hover:text-blue-700 font-medium transition">
              Daftar
            </button>
          </p>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-800 px-4 py-1 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
              atau
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-200 p-3 rounded-2xl border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-medium">Login dengan Google</span>
        </button>
      </div>

      {showForgot && <ForgotModal />}
    </>
  );
}
