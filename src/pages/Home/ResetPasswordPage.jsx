import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../firebase';
import { FaLock, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import SEO from './SEO';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [validating, setValidating] = useState(true);

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const oobCode = queryParams.get('oobCode');
  const mode = queryParams.get('mode');

  useEffect(() => {
    if (!oobCode || mode !== 'resetPassword') {
      setError('Invalid or missing reset token. Make sure you used the exact link from your email.');
      setValidating(false);
      return;
    }

    // Verify the password reset code
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setValidating(false);
      })
      .catch((err) => {
        setError('The password reset link is invalid or has expired. Please request a new one.');
        setValidating(false);
      });
  }, [oobCode, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4">
        <FaSpinner className="text-red-500 animate-spin text-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4">
      <SEO title="Reset Password — WeFlix" noSuffix />
      
      <div className="w-full max-w-[400px] bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black p-8">
        <div className="flex justify-center items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <BiMoviePlay className="text-red-500 text-2xl" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            We<span className="text-red-500">Flix</span>
          </span>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-xl font-bold text-white">Password Reset!</h2>
            <p className="text-gray-400 text-sm mb-4">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <Link
              to="/"
              className="w-full py-3.5 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
            >
              Go to Homepage
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Set New Password</h2>
            {email ? (
                <p className="text-gray-400 text-sm text-center mb-6">for {email}</p>
            ) : (
                <div className="mb-6"/>
            )}

            {error && (
              <div className="flex items-start gap-2.5 mb-6 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
                <FaExclamationCircle className="text-red-400 text-base shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-medium leading-snug">{error}</p>
              </div>
            )}

            {(!email || error) && (
              <Link
                to="/"
                className="w-full py-3.5 flex justify-center items-center bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                Back to Homepage
              </Link>
            )}

            {email && !error && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-500 text-sm" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 flex justify-center items-center gap-2 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] bg-red-600 hover:bg-red-500 transition-all"
                >
                  {loading && <FaSpinner className="animate-spin" />}
                  Update Password
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
