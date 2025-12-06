import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export const AuthCallback: React.FC = () => {
    const [status, setStatus] = useState('Checking credentials...');
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const handleCallback = async () => {
            // DO NOT clear hash here. Let the user click continue to clear it via redirect.
            const hash = window.location.hash;

            try {
                // 2. Try to get session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (session) {
                    setIsSuccess(true);
                    setStatus('Login Successful!');
                    return;
                }

                // 3. Manual Parse Fallback
                if (hash && hash.includes('access_token')) {
                    if (import.meta.env.DEV) console.log('Attempting manual parse...');
                    const params = new URLSearchParams(hash.substring(1));
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { data, error: setError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (setError) throw setError;

                        if (data.session) {
                            setIsSuccess(true);
                            setStatus('Login Successful (Manual Force)!');
                            return;
                        }
                    }
                }

                if (sessionError) throw sessionError;
                throw new Error('Could not establish session.');

            } catch (err: any) {
                console.error('Login error:', err);
                if (err.message?.includes('future')) {
                    setError('Clock Skew Detected. Please sync your PC clock.');
                } else {
                    setError(err.message || 'Login failed.');
                }
            }
        };

        handleCallback();
    }, []);

    const handleContinue = () => {
        // Force hard redirect to root, clearing everything
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
            <div className="flex flex-col items-center gap-6 p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-md text-center">
                {error ? (
                    <>
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Login Issue</h3>
                            <p className="text-rose-400 text-sm">{error}</p>
                        </div>
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
                        >
                            Back to Login
                        </button>
                    </>
                ) : isSuccess ? (
                    <>
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">{status}</h3>
                            <p className="text-slate-400 text-sm">Click below to enter the app.</p>
                        </div>
                        <button
                            onClick={handleContinue}
                            className="group flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20"
                        >
                            Continue to App
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
                        <div>
                            <h3 className="text-xl font-medium text-white">{status}</h3>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
