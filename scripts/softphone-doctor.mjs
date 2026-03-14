import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const root = process.cwd();
const envLocalPath = path.join(root, '.env.local');
const envExamplePath = path.join(root, '.env.example');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envExamplePath)) {
  dotenv.config({ path: envExamplePath });
}

const checks = [
  {
    key: 'VITE_SOFTPHONE_ENABLED',
    required: true,
    validate: (value) => value === 'true' || value === 'false',
    hint: 'Use true para exibir o shell do softphone aos moradores.',
  },
  {
    key: 'VITE_SOFTPHONE_TRANSPORT',
    required: true,
    validate: (value) => value === 'mock' || value === 'sipjs',
    hint: 'Use mock antes do PBX e sipjs quando o PBX estiver disponivel.',
  },
  {
    key: 'VITE_SOFTPHONE_PBX_HOST',
    required: false,
    validate: (value) => Boolean(value),
    hint: 'Hostname do PBX exibido no app.',
  },
  {
    key: 'VITE_SOFTPHONE_PBX_DOMAIN',
    required: false,
    validate: (value) => Boolean(value),
    hint: 'Dominio SIP do PBX, ex: pbx.hostel.local.',
  },
  {
    key: 'VITE_SOFTPHONE_PBX_WSS_URL',
    required: false,
    validate: (value) => !value || value.startsWith('wss://'),
    hint: 'Use a URL WSS do PBX, ex: wss://pbx.hostel.local:8089/ws.',
  },
  {
    key: 'SOFTPHONE_PBX_DEFAULT_SECRET',
    required: false,
    validate: (value) => Boolean(value),
    hint: 'Senha padrao provisoria usada pelo backend local para emitir credenciais SIP.',
  },
  {
    key: 'VITE_SOFTPHONE_DOOR_MODE',
    required: false,
    validate: (value) =>
      value === '' ||
      value === 'none' ||
      value === 'dtmf' ||
      value === 'http-relay' ||
      value === 'extension',
    hint: 'Use none, dtmf, http-relay ou extension para preparar a abertura de porta.',
  },
  {
    key: 'VITE_SOFTPHONE_DOOR_DTMF',
    required: false,
    validate: (value) => value === '' || /^[0-9A-D#*]+$/i.test(value),
    hint: 'Quando usar dtmf, defina o digito ou a sequencia esperada pelo PBX.',
  },
  {
    key: 'SOFTPHONE_DOOR_RELAY_URL',
    required: false,
    validate: (value) =>
      value === '' || value.startsWith('http://') || value.startsWith('https://'),
    hint: 'Quando usar http-relay, informe a URL do controlador de acesso.',
  },
];

let failures = 0;

console.log('Softphone Doctor\n');

for (const check of checks) {
  const value = process.env[check.key] ?? '';
  const isPresent = value !== '';
  const isValid = isPresent ? check.validate(value) : !check.required;
  const status = isValid ? 'OK' : 'FAIL';

  if (!isValid) failures += 1;

  console.log(`${status.padEnd(4)} ${check.key} ${isPresent ? `= ${value}` : '(nao definido)'}`);
  if (!isValid || !isPresent) {
    console.log(`      ${check.hint}`);
  }
}

const runtimeReady =
  process.env.VITE_SOFTPHONE_ENABLED === 'true' &&
  process.env.VITE_SOFTPHONE_TRANSPORT === 'sipjs' &&
  process.env.VITE_SOFTPHONE_PBX_HOST &&
  process.env.VITE_SOFTPHONE_PBX_DOMAIN &&
  process.env.VITE_SOFTPHONE_PBX_WSS_URL &&
  process.env.SOFTPHONE_PBX_DEFAULT_SECRET;

const doorMode = process.env.VITE_SOFTPHONE_DOOR_MODE || 'none';
const doorReady =
  doorMode === 'none' ||
  doorMode === 'dtmf' ||
  doorMode === 'extension' ||
  (doorMode === 'http-relay' && Boolean(process.env.SOFTPHONE_DOOR_RELAY_URL));

console.log('');
console.log(
  runtimeReady
    ? 'Softphone SIP ready: o projeto tem os parametros minimos para tentar registro no PBX.'
    : 'Softphone SIP pending: o shell funciona, mas ainda faltam dados para a conexao real.'
);
console.log(
  doorReady
    ? `Door flow ready: modo ${doorMode} validado para a proxima etapa.`
    : `Door flow pending: o modo ${doorMode} ainda precisa de configuracao complementar.`
);

process.exitCode = failures > 0 ? 1 : 0;
