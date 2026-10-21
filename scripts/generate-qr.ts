import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import QRCode from 'qrcode';

const payload = process.env.TECHNICIAN_QR_PAYLOAD;
if (!payload) throw new Error('Set TECHNICIAN_QR_PAYLOAD to a test-tenant QR payload');
if (payload.includes('api-token') || payload.includes('password')) {
  throw new Error('QR payload must not contain credentials or API tokens');
}

const directory = resolve('artifacts', 'qr');
const target = resolve(directory, 'technician-test-qr.png');
mkdirSync(directory, { recursive: true });
await QRCode.toFile(target, payload, { width: 900, margin: 4 });
console.log(`Display this QR on a separate screen: ${target}`);
