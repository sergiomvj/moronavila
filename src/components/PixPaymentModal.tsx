import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, QrCode, Timer, Loader2, AlertCircle } from 'lucide-react';
import { Payment } from '../types';

interface PixPaymentModalProps {
    payment: Payment;
    residentId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function PixPaymentModal({ payment, residentId, onClose, onSuccess }: PixPaymentModalProps) {
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState<string | null>(payment.pix_qr_code || null);
    const [copyPaste, setCopyPaste] = useState<string | null>(payment.pix_copy_paste || null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!qrCode) {
            generatePix();
        } else {
            setLoading(false);
        }
    }, []);

    const generatePix = async () => {
        setLoading(true);
        setError(null);
        try {
            // Chamada ao nosso proxy local no mac-server.ts (Porta 4000)
            const response = await fetch('http://localhost:4000/api/payments/pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    residentId,
                    amount: payment.amount,
                    description: `VPR Manager - ${payment.month}`,
                    paymentId: payment.id
                })
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Erro ao gerar PIX');

            setQrCode(data.qrCode);
            setCopyPaste(data.copyPaste);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (copyPaste) {
            navigator.clipboard.writeText(copyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>

                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Pagamento PIX</h3>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Escaneie ou copie o código abaixo</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="bg-slate-950 rounded-3xl border border-slate-800 p-8 flex flex-col items-center justify-center relative min-h-[300px]">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 size={48} className="text-rose-500 animate-spin" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Gerando QR Code...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center p-4">
                                <AlertCircle size={40} className="text-rose-500 mx-auto mb-4" />
                                <p className="text-rose-500 font-bold text-sm">{error}</p>
                                <button onClick={generatePix} className="mt-4 text-[10px] font-black text-white uppercase bg-rose-600 px-4 py-2 rounded-xl">Tentar Novamente</button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-rose-950/20 mb-6">
                                    <img
                                        src={`data:image/png;base64,${qrCode}`}
                                        alt="PIX QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                                <div className="text-center">
                                    <span className="text-3xl font-black text-white tracking-tighter">R$ {payment.amount.toFixed(2)}</span>
                                    <div className="flex items-center justify-center gap-2 mt-2 text-slate-500">
                                        <Timer size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Expira em 24 horas</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {!loading && !error && (
                        <div className="mt-8 space-y-4">
                            <button
                                onClick={handleCopy}
                                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[11px] tracking-widest
                                    ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 border border-slate-700'}`}
                            >
                                {copied ? (
                                    <><CheckCircle2 size={18} /> Código Copiado!</>
                                ) : (
                                    <><Copy size={18} /> Copiar Código PIX</>
                                )}
                            </button>

                            <div className="p-4 bg-rose-600/5 border border-rose-500/10 rounded-2xl">
                                <p className="text-[9px] text-slate-400 leading-relaxed text-center font-medium">
                                    Após o pagamento, o sistema identificará a transação automaticamente em até 5 minutos. Não é necessário enviar o comprovante.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
