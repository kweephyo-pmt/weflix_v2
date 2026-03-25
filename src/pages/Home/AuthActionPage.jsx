import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthActionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (!mode || !oobCode) {
      // Missing required params, send home
      navigate('/', { replace: true });
      return;
    }

    // Redirect to the correct feature page based on Firebase mode
    if (mode === 'resetPassword') {
      navigate(`/reset-password?oobCode=${encodeURIComponent(oobCode)}`, { replace: true });
    } else if (mode === 'verifyEmail') {
      navigate(`/verify-email?oobCode=${encodeURIComponent(oobCode)}`, { replace: true });
    } else {
      // Fallback for unhandled modes like 'recoverEmail'
      navigate('/', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
