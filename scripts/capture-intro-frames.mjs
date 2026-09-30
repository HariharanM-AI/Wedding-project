async function cdp(wsUrl, method, params = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const id = 1;
    ws.onopen = () => ws.send(JSON.stringify({ id, method, params }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) { ws.close(); resolve(data.result); }
    };
    ws.onerror = reject;
  });
}

async function main() {
  const tabs = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const clientTab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('/w/'));
  if (!clientTab) return;

  // Navigate to ananya-karthik or suriya-jotika where intro is enabled
  // First ensure intro is enabled for rohidcb-pushyar or test on default
  await cdp(clientTab.webSocketDebuggerUrl, 'Emulation.clearDeviceMetricsOverride', {});
  await cdp(clientTab.webSocketDebuggerUrl, 'Page.navigate', {
    url: 'http://localhost:5173/w/ananya-karthik'
  });
  await new Promise(r => setTimeout(r, 2000));

  await cdp(clientTab.webSocketDebuggerUrl, 'Page.reload', {});
  await new Promise(r => setTimeout(r, 2500));

  const initialStatus = await cdp(clientTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
    expression: `(() => {
      const v = document.querySelector('video');
      const img = document.querySelector('img[alt*="Envelope"]');
      return {
        hasVideo: !!v,
        videoReadyState: v?.readyState,
        videoCurrentTime: v?.currentTime,
        videoPaused: v?.paused,
        imgOpacity: img ? window.getComputedStyle(img).opacity : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Initial Status before click:', initialStatus.result.value);

  // Capture screenshot before click
  const fs = await import('fs');
  const shotPre = await cdp(clientTab.webSocketDebuggerUrl, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/intro_pre_click.png', Buffer.from(shotPre.data, 'base64'));

  // Click seal
  console.log('Clicking wax seal to open intro...');
  await cdp(clientTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
    expression: 'document.querySelector(".wax-seal-hotspot")?.click()'
  });

  // Capture frames every 20ms for 300ms
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 25));
    const shot = await cdp(clientTab.webSocketDebuggerUrl, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`public/intro_frame_${i}.png`, Buffer.from(shot.data, 'base64'));
    
    const info = await cdp(clientTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        const img = document.querySelector('img[alt*="Envelope"]');
        return {
          i: ${i},
          videoCurrentTime: v?.currentTime,
          videoPaused: v?.paused,
          imgOpacity: img ? window.getComputedStyle(img).opacity : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Frame', i, info.result.value);
  }
}

main().catch(console.error);
