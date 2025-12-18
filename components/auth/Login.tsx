import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { LogIn, Mail, Lock, AlertCircle, Info, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
    const { signIn, signInWithGoogle, signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResetInfo, setShowResetInfo] = useState(false);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                await signUp(email, password);
                setError('âœ… Conta criada! Verifique seu email para confirmar.');
            } else {
                await signIn(email, password);
            }
        } catch (err: any) {
            // Traduzir erros comuns
            let errorMsg = err.message || 'Falha na autenticaÃ§Ã£o';
            if (errorMsg.includes('Invalid login credentials')) {
                errorMsg = 'âŒ Email ou senha incorretos. Verifique e tente novamente.';
            } else if (errorMsg.includes('Email not confirmed')) {
                errorMsg = 'âš ï¸ Email nÃ£o confirmado. Verifique sua caixa de entrada.';
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Falha ao autenticar com Google');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTllMGIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

            <div className="relative bg-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-amber-500/10 rounded-full mb-4">
                        <LogIn className="w-8 h-8 text-amber-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">WurmForge</h1>
                    <p className="text-slate-400 text-sm">AnÃ¡lise de Mercado para Wurm Online</p>
                </div>

                {/* Info Box for New Users */}
                {isSignUp && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-start gap-2">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold mb-1">Primeira vez aqui?</p>
                            <p className="text-xs text-blue-300">ApÃ³s criar sua conta, vocÃª receberÃ¡ um email de confirmaÃ§Ã£o. Clique no link para ativar sua conta.</p>
                        </div>
                    </div>
                )}

                {/* Error/Success Message */}
                {error && (
                    <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${error.includes('âœ…')
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Senha
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                            required
                            minLength={6}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition"
                        />
                        {isSignUp && (
                            <p className="text-xs text-slate-500">MÃ­nimo de 6 caracteres</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20"
                    >
                        {loading ? 'Carregando...' : isSignUp ? 'âœ¨ Criar Conta' : 'ðŸ”“ Entrar'}
                    </button>
                </form>

                {/* Forgot Password */}
                {!isSignUp && (
                    <div className="mb-4">
                        <button
                            onClick={() => setShowResetInfo(!showResetInfo)}
                            className="w-full text-sm text-slate-400 hover:text-amber-400 transition flex items-center justify-center gap-1"
                        >
                            <KeyRound className="w-3 h-3" />
                            Esqueceu a senha?
                        </button>
                        {showResetInfo && (
                            <div className="mt-2 p-3 rounded-lg bg-slate-700/50 border border-slate-600 text-xs text-slate-300">
                                <p className="mb-2">Para resetar sua senha:</p>
                                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                    <li>Entre em contato com o suporte</li>
                                    <li>Ou use a opÃ§Ã£o "Esqueci a senha" no Supabase</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {/* Toggle Sign Up/In */}
                <button
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                        setShowResetInfo(false);
                    }}
                    className="w-full text-sm text-slate-400 hover:text-amber-400 transition mb-4 font-medium"
                >
                    {isSignUp ? 'ðŸ‘¤ JÃ¡ tem uma conta? Entrar' : 'âœ¨ NÃ£o tem conta? Criar agora'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-800 text-slate-500">Ou continue com</span>
                    </div>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Entrar com Google
                </button>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-slate-500">
                    <p>Ao entrar, vocÃª concorda com nossos Termos de ServiÃ§o</p>
                </div>
                {/* Manual Token Fallback */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <button
                        onClick={() => {
                            const url = prompt('Cole aqui a URL completa do navegador (ex: torta-app://...#access_token=...):');
                            if (url) {
                                try {
                                    let hash = url.split('#')[1];
                                    if (!hash && url.includes('?')) hash = url.split('?')[1];
                                    
                                    if (hash) {
                                        const params = new URLSearchParams(hash);
                                        const access_token = params.get('access_token');
                                        const refresh_token = params.get('refresh_token');
                                        
                                        if (access_token && refresh_token) {
                                            supabase.auth.setSession({ access_token, refresh_token })
                                                .then(({ error }: any) => {
                                                    if (error) {
                                                        alert('Erro: ' + error.message);
                                                    } else {
                                                        alert('Token recebido! Atualizando...');
                                                    }
                                                });
                                        } else {
                                            alert('Token nao encontrado na URL.');
                                        }
                                    } else {
                                        alert('URL invalida.');
                                    }
                                } catch (e) {
                                    alert('Erro ao processar URL.');
                                }
                            }
                        }}
                        className="text-xs text-slate-600 hover:text-slate-400 underline"
                    >
                        Problemas no Login? Entrar Manualmente
                    </button>
                </div>

            </div>
        </div>
    );
};
