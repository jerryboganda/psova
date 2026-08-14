import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [baseUrl, outputDir] = process.argv.slice(2);
if (!baseUrl || !outputDir) throw new Error('Usage: node capture-mobile-cdp.mjs <baseUrl> <outputDir>');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const remotePort = 9347;
const profile = await mkdtemp(join(tmpdir(), 'psova-capture-'));
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${remotePort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

async function json(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { const response = await fetch(url); if (response.ok) return response.json(); } catch {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

try {
  const targets = await json(`http://127.0.0.1:${remotePort}/json/list`);
  const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
  if (!page) throw new Error('No Chrome page target found.');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); } });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message.result)); socket.send(JSON.stringify({ id: requestId, method, params })); });

  await call('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 1, mobile: true, screenWidth: 430, screenHeight: 932 });
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const screens = [
    ['01-home-en.png', '?locale=en#/'], ['02-library-en.png', '?locale=en#/library'], ['03-directory-en.png', '?locale=en#/directory'],
    ['04-home-ur.png', '?locale=ur#/'], ['05-library-ur.png', '?locale=ur#/library'], ['06-directory-ur.png', '?locale=ur#/directory'],
  ];
  for (const [name, suffix] of screens) {
    await call('Page.navigate', { url: `${baseUrl}/${suffix}` });
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const metrics = await call('Runtime.evaluate', { returnByValue: true, expression: `({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,dir:document.documentElement.dir,title:document.title})` });
    const value = metrics.result.value;
    if (value.title !== 'PSOVA' || value.width !== 430 || value.scrollWidth > 430) throw new Error(`Invalid mobile layout for ${name}: ${JSON.stringify(value)}`);
    const capture = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(capture.data, 'base64'));
  }
  socket.close();
} finally {
  chrome.kill();
  await new Promise((resolve) => setTimeout(resolve, 300));
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
}
