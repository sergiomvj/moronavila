import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const app = express();
const port = 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para obter o MAC a partir do IP (Windows)
async function getMacFromIp(ip: string): Promise<string | null> {
    try {
        // Para localhost em Windows, o ARP não funciona da mesma forma, mas na rede sim.
        if (ip === '::1' || ip === '127.0.0.1') return 'Dispositivo Local (Servidor)';

        const { stdout } = await execPromise(`arp -a ${ip}`);
        const lines = stdout.split('\n');
        for (const line of lines) {
            if (line.includes(ip)) {
                const parts = line.trim().split(/\s+/);
                // O MAC costuma ser a segunda ou terceira coluna dependendo do SO/Versão
                const macMatch = parts.find(p => /([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/.test(p));
                return macMatch || 'Não encontrado';
            }
        }
        return 'Não mapeado no ARP';
    } catch (error) {
        console.error('Erro ao buscar MAC:', error);
        return 'Erro na detecção';
    }
}

app.get('/', async (req, res) => {
    const ip = req.ip?.replace('::ffff:', '') || '0.0.0.0';
    const mac = await getMacFromIp(ip);

    const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MoronaVila - Detector de MAC</title>
    <style>
        :root {
            --primary: #c084fc;
            --secondary: #22c55e;
            --bg: #0f172a;
        }
        body {
            margin: 0;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: radial-gradient(circle at top right, #1e293b, #0f172a);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 2.5rem;
            border-radius: 2rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
            text-align: center;
            position: relative;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(to right, #22c55e, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 2rem;
            letter-spacing: -1px;
        }
        .mac-box {
            background: rgba(0, 0, 0, 0.3);
            padding: 1.5rem;
            border-radius: 1.25rem;
            margin: 1.5rem 0;
            border: 2px solid rgba(192, 132, 252, 0.3);
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.25rem;
            color: #c084fc;
            text-transform: uppercase;
            box-shadow: 0 0 20px rgba(192, 132, 252, 0.1);
        }
        .label {
            color: #94a3b8;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .btn {
            background: #22c55e;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 1rem;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3);
        }
        .info {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 1.5rem;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">MoronaVila</div>
        <div class="label">Identificamos seu dispositivo</div>
        <div class="mac-box">${mac}</div>
        <div class="label">Seu IP na rede: ${ip}</div>
        <button class="btn" onclick="copyMac()">Copiar MAC Address</button>
        <p class="info">
            Este código é necessário para liberar o acesso à internet na MoronaVila. 
            Copie e cole no seu perfil no aplicativo principal.
        </p>
    </div>

    <script>
        function copyMac() {
            const mac = "${mac}";
            navigator.clipboard.writeText(mac);
            alert("MAC Address copiado!");
        }
    </script>
</body>
</html>
  `;
    res.send(html);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`--------------------------------------------------`);
    console.log(`MoronaVila MAC Discovery App rodando em:`);
    console.log(`http://localhost:${port}`);
    console.log(`Acesse do seu celular/tablet usando o IP do PC!`);
    console.log(`--------------------------------------------------`);
});
