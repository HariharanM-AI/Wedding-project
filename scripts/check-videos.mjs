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
async function run() {
  const tabs = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const tab = tabs.find(t => t.type === 'page');
  const res = await cdp(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
    expression: `(async () => {
      function getInfo(src) {
        return new Promise(r => {
          const v = document.createElement('video');
          v.src = src;
          v.onloadedmetadata = () => r({ src, duration: v.duration, videoWidth: v.videoWidth, videoHeight: v.videoHeight });
          v.onerror = () => r({ src, error: 'failed' });
        });
      }
      return {
        mobile: await getInfo('/Intro/Final_intro_mobile.mp4'),
        window: await getInfo('/Intro/Final_intro_window.mp4'),
        mobileOrig: await getInfo('/Intro/Final_intro_mobile_original.mp4'),
        windowOrig: await getInfo('/Intro/Final_intro_window_original.mp4')
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log(JSON.stringify(res.result.value, null, 2));
}
run().catch(console.error);
