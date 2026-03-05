import React, { useState } from 'react';
import { Home, LogIn, UserPlus } from 'lucide-react';
import { signIn, signUpResident, resetPassword } from '../lib/database';

export function Login({ onLogin }: { onLogin: (authId: string) => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            if (isForgotPassword) {
                await resetPassword(email);
                setSuccessMessage('Instruções de recuperação de senha foram enviadas para o seu e-mail!');
                setIsForgotPassword(false);
            } else if (isLogin) {
                const { user } = await signIn(email, password);
                if (user) {
                    onLogin(user.id);
                }
            } else {
                const { user } = await signUpResident(email, password, name, phone);
                if (user) {
                    setSuccessMessage('Cadastro realizado com sucesso! Faça login para continuar.');
                    setIsLogin(true); // Switch to login view
                    setPassword(''); // Clear password for safety
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro de autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 text-center bg-indigo-600 text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Home size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">VPR-Manager</h1>
                    <p className="text-indigo-100 text-sm opacity-80 mt-1">Gestão Inteligente de Repúblicas</p>
                </div>

                <div className="flex border-b border-slate-100">
                    <button
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin && !isForgotPassword ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => { setIsLogin(true); setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
                    >
                        Entrar
                    </button>
                    <button
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin && !isForgotPassword ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => { setIsLogin(false); setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
                    >
                        Cadastrar
                    </button>
                </div>

                <div className="p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">
                        {isForgotPassword ? 'Recuperar senha' : (isLogin ? 'Acesse sua conta' : 'Crie sua nova conta')}
                    </h2>
                    {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm mb-4">{error}</div>}
                    {successMessage && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm mb-4">{successMessage}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && !isForgotPassword && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                    <input
                                        type="text" required
                                        value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
                                    <input
                                        type="tel" required
                                        value={phone} onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                            <input
                                type="email" required
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        {!isForgotPassword && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
                                <input
                                    type="password" required minLength={6}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                                {isLogin && (
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                        >
                                            Esqueci minha senha
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-indigo-600 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50 mt-6"
                        >
                            {isForgotPassword ? null : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                            {loading ? 'Aguarde...' : (isForgotPassword ? 'Enviar e-mail' : (isLogin ? 'Entrar' : 'Cadastrar'))}
                        </button>
                        {isForgotPassword && (
                            <button
                                type="button"
                                onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
                                className="w-full bg-slate-100 text-slate-700 font-bold rounded-xl py-3 hover:bg-slate-200 transition mt-2 border border-slate-200"
                            >
                                Voltar ao login
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
