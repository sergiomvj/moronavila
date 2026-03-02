import React from 'react';
import { Wifi, Router, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Resident, UserRole } from '../types';

interface InternetViewProps {
    residents: Resident[];
    isAdmin: boolean;
}

export function InternetView({ residents, isAdmin }: InternetViewProps) {
    const activeUsers = residents.filter(r => r.internet_active);
    const inactiveUsers = residents.filter(r => !r.internet_active && r.mac_address);
    const noMacUsers = residents.filter(r => !r.mac_address);

    // Apenas Admin deveria ver esta tela de controle detalhado
    if (!isAdmin) {
        return (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wifi size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso à Internet</h2>
                <p className="text-slate-600 mb-6">Seu acesso à internet é renovado automaticamente a cada pagamento mensal confirmado. Verifique a aba de Financeiro se houver pendências.</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                    <p className="text-sm font-bold text-slate-900 mb-1">Como configurar meu dispositivo?</p>
                    <p className="text-xs text-slate-500">Acesse a aba <strong>Moradores</strong> e edite seu perfil para incluir o endereço MAC (MAC Address) do seu celular ou notebook.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Controle de Internet</h2>
                    <p className="text-slate-500 text-sm">Gerenciamento de acesso via MAC Address (Mikrotik/Roteador)</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
                    <Router size={20} />
                    <span className="font-bold text-sm">Sistema Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Acesso Liberado</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{activeUsers.length}</h4>
                    <p className="text-xs text-slate-500">Dispositivos conectados</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Acesso Bloqueado</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{inactiveUsers.length}</h4>
                    <p className="text-xs text-slate-500">Falta de pagamento</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                            <Wifi size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Sem MAC Address</h3>
                    </div>
                    <h4 className="text-3xl font-bold text-slate-900 mb-2">{noMacUsers.length}</h4>
                    <p className="text-xs text-slate-500">Não configurado</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Lista de Autorização MAC</h3>
                    <button className="text-sm font-bold text-indigo-600 hover:underline">Exportar Lista (.csv)</button>
                </div>
                <div className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Morador</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">MAC Address</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Renovação Automática</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Rede</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {residents.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{r.name}</td>
                                    <td className="px-6 py-4 font-mono text-sm text-slate-600">
                                        {r.mac_address || <span className="text-slate-400 italic">Não fornecido</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {r.internet_renewal_date ? new Date(r.internet_renewal_date).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {r.internet_active ? (
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Permitido
                                            </span>
                                        ) : (
                                            <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Bloqueado
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
