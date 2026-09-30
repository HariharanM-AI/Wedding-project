import fs from 'fs';

async function main() {
  const tabs = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const clientTab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('/w/'));
  if (!clientTab) {
    console.error('No client tab found!');
    process.exit(1);
  }

  const ws = new WebSocket(clientTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let curId = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = curId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  console.log('Reloading page...');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2000));

  const shotPre = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scripts/frame_pre.png', Buffer.from(shotPre.data, 'base64'));

  // Click seal
  console.log('Clicking seal...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.wax-seal-hotspot')?.click()`
  });

  // Capture immediately and rapidly
  for (let i = 0; i < 12; i++) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scripts/frame_${i}.png`, Buffer.from(shot.data, 'base64'));
    
    const evalData = await send('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        const img = document.querySelector('img[alt*="Envelope"]');
        return {
          time: v?.currentTime,
          paused: v?.paused,
          imgOpacity: img ? window.getComputedStyle(img).opacity : null
        };
      })()`,
      returnByValue: true
    });
    console.log(`Frame ${i}:`, evalData.result.value);
    await new Promise(r => setTimeout(r, 25));
  }

  ws.close();
}

main().catch(console.error);
