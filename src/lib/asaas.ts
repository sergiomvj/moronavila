import { createClient } from '@supabase/supabase-js';

const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3'; // Usar sandbox para testes
const ASAAS_API_KEY = process.env.VITE_ASAAS_API_KEY || '';

/**
 * Serviço de Integração com Asaas (PIX)
 */
export class AsaasService {
    /**
     * Gera uma cobrança PIX para um morador
     */
    static async createPixCharge(params: {
        residentName: string;
        residentEmail: string;
        amount: number;
        description: string;
        externalReference: string; // ID do pagamento no nosso banco
    }) {
        try {
            const response = await fetch(`${ASAAS_API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': ASAAS_API_KEY
                },
                body: JSON.stringify({
                    billingType: 'PIX',
                    name: params.residentName,
                    email: params.residentEmail,
                    value: params.amount,
                    description: params.description,
                    externalReference: params.externalReference,
                    dueDate: new Date().toISOString().split('T')[0] // Vence hoje
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas');
            }

            const paymentData = await response.json();

            // Buscar QR Code e Copy/Paste
            const qrCodeResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, {
                headers: { 'access_token': ASAAS_API_KEY }
            });

            if (!qrCodeResponse.ok) {
                throw new Error('Erro ao obter QR Code do PIX');
            }

            const qrData = await qrCodeResponse.json();

            return {
                asaasId: paymentData.id,
                copyPaste: qrData.payload,
                qrCodeBase64: qrData.encodedImage,
                expirationDate: qrData.expirationDate
            };
        } catch (error: any) {
            console.error('Asaas Error:', error);
            throw error;
        }
    }

    /**
     * Consulta o status de um pagamento
     */
    static async getPaymentStatus(asaasId: string) {
        try {
            const response = await fetch(`${ASAAS_API_URL}/payments/${asaasId}`, {
                headers: { 'access_token': ASAAS_API_KEY }
            });
            const data = await response.json();
            return data.status; // RECEIVED, CONFIRMED, OVERDUE, etc.
        } catch (error) {
            return 'ERROR';
        }
    }
}
