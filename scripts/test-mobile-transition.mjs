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

  console.log('Setting mobile device emulation (390x844)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Page.navigate', { url: 'http://localhost:5173/w/ananya-karthik?view=mobile' });
  await new Promise(r => setTimeout(r, 2500));

  const shotPre = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scripts/mobile_pre.png', Buffer.from(shotPre.data, 'base64'));

  console.log('Clicking mobile seal...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.wax-seal-hotspot')?.click()`
  });

  for (let i = 0; i < 15; i++) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scripts/mobile_${i}.png`, Buffer.from(shot.data, 'base64'));

    const st = await send('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        const img = document.querySelector('img[alt*="Envelope"]');
        return {
          time: v?.currentTime,
          paused: v?.paused,
          imgOp: img ? window.getComputedStyle(img).opacity : null,
          readyState: v?.readyState
        };
      })()`,
      returnByValue: true
    });
    console.log(`mobile ${i}:`, st.result.value);
    await new Promise(r => setTimeout(r, 30));
  }

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

main().catch(console.error);
