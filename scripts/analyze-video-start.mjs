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
  const tab = tabs.find(t => t.type === 'page');
  if (!tab) return;

  const res = await cdp(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
    expression: `(async () => {
      async function inspectVideo(src) {
        return new Promise((resolve) => {
          const v = document.createElement('video');
          v.src = src;
          v.muted = true;
          v.playsInline = true;
          v.preload = 'auto';
          v.onloadeddata = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            
            const results = [];
            const times = [0, 0.02, 0.05, 0.1, 0.15, 0.2, 0.3];
            for (const t of times) {
              v.currentTime = t;
              await new Promise(r => {
                const onSeek = () => {
                  v.removeEventListener('seeked', onSeek);
                  r();
                };
                v.addEventListener('seeked', onSeek);
              });
              ctx.drawImage(v, 0, 0, 100, 100);
              const data = ctx.getImageData(50, 50, 1, 1).data;
              results.push({ time: t, r: data[0], g: data[1], b: data[2] });
            }
            resolve({ src, results });
          };
          v.onerror = (e) => resolve({ error: e.toString() });
        });
      }

      const mobile = await inspectVideo('/Intro/Final_intro_mobile.mp4');
      const windowVid = await inspectVideo('/Intro/Final_intro_window.mp4');
      return { mobile, windowVid };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Video Frames Sample Analysis:');
  console.log(JSON.stringify(res.result.value, null, 2));
}

main().catch(console.error);
