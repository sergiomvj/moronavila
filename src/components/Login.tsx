import React, { useState } from 'react';
import { Home, LogIn, UserPlus, Mail, Lock, User, Phone, ArrowRight, Heart } from 'lucide-react';
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
                setSuccessMessage('Instruções de recuperação de senha foram enviadas!');
                setIsForgotPassword(false);
            } else if (isLogin) {
                const { user } = await signIn(email, password);
                if (user) onLogin(user.id);
            } else {
                const { user } = await signUpResident(email, password, name, phone);
                if (user) {
                    setSuccessMessage('Cadastro realizado! Faça login agora.');
                    setIsLogin(true);
                    setPassword('');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Algo deu errado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-110 blur-[2px]"
                style={{ backgroundImage: 'url("https://images.pexels.com/photos/5935228/pexels-photo-5935228.jpeg")' }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-rose-950/40"></div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 relative z-10 bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">

                {/* Visual Side (Hidden on mobile) */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-xl shadow-rose-900/20">
                            <Home size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Morona<span className="text-rose-600">Vila</span></h1>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
                            Viver feliz <br />
                            <span className="text-rose-600">perto de tudo</span>
                        </h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px]">
                            A gestão inteligente que você precisava para sua república, com a harmonia que você merece.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-white/40">
                        <Heart size={16} className="text-rose-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Feito com carinho para você</span>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-8 lg:p-12 bg-slate-950/50">
                    {/* Header for mobile */}
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <div className="bg-rose-600 p-2.5 rounded-xl text-white mb-4 shadow-lg shadow-rose-900/30">
                            <Home size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic text-center">Morona<span className="text-rose-600">Vila</span></h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Viver feliz perto de tudo</p>
                    </div>

                    <div className="mb-10">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                            {isForgotPassword ? 'Recuperar Acesso' : (isLogin ? 'Bem-vindo de volta' : 'Comece sua jornada')}
                        </h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                            {isForgotPassword
                                ? 'Enviaremos um link de reset para o seu e-mail'
                                : (isLogin ? 'Acesse sua conta para continuar' : 'Preencha seus dados para cadastrar')}
                        </p>
                    </div>

                    {(error || successMessage) && (
                        <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in slide-in-from-top-2 
                            ${error ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'}`}>
                            <span className="text-xs font-black uppercase tracking-widest italic">{error || successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && !isForgotPassword && (
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <div className="relative group">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                                        <input
                                            type="text" required
                                            value={name} onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all placeholder:text-slate-700"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                                    <div className="relative group">
                                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                                        <input
                                            type="tel" required
                                            value={phone} onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all placeholder:text-slate-700"
                                            placeholder="(11) 99999-9999"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                                <input
                                    type="email" required
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all placeholder:text-slate-700"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Palavra-Chave</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                                    <input
                                        type="password" required minLength={6}
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all placeholder:text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {isLogin && (
                                    <div className="flex justify-end pr-2">
                                        <button
                                            type="button"
                                            onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                                            className="text-[10px] font-black text-slate-500 hover:text-rose-600 uppercase tracking-widest transition-colors"
                                        >
                                            Recuperar Senha?
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl py-4 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-rose-950/20 disabled:opacity-50 mt-8"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isForgotPassword ? null : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                                    {isForgotPassword ? 'Redefinir Senha' : (isLogin ? 'Entrar no Sistema' : 'Criar minha Conta')}
                                </>
                            )}
                        </button>

                        <div className="pt-6 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setSuccessMessage('');
                                }}
                                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto group"
                            >
                                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

