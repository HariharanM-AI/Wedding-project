import fs from 'fs';

async function main() {
  const tabs = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const clientTab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('/w/'));
  if (!clientTab) {
    console.error('No client tab found in Chrome at 9222!');
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

  console.log('=== TEST 1: DESKTOP VIEW ===');
  await send('Page.navigate', { url: 'http://localhost:5173/w/ananya-karthik?view=desktop' });
  await new Promise(r => setTimeout(r, 2000));

  // Check state before clicking seal
  let statePre = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.film-audio-toggle');
      const hint = document.querySelector('.film-audio-hint');
      const seal = document.querySelector('.wax-seal-hotspot');
      return {
        hasButton: !!btn,
        btnDisplay: btn ? window.getComputedStyle(btn).display : null,
        btnText: btn?.innerText,
        hasHint: !!hint,
        hasSeal: !!seal
      };
    })()`,
    returnByValue: true
  });
  console.log('Desktop Before Click:', statePre.result.value);
  const shotPre = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scripts/test_desktop_pre.png', Buffer.from(shotPre.data, 'base64'));

  // Click seal
  console.log('Clicking wax seal on desktop...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.wax-seal-hotspot')?.click()`
  });
  await new Promise(r => setTimeout(r, 600));

  let statePost = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.film-audio-toggle');
      const hint = document.querySelector('.film-audio-hint');
      const audio = document.getElementById('wedding-soundtrack');
      return {
        hasButton: !!btn,
        btnText: btn?.innerText,
        btnBottom: btn ? window.getComputedStyle(btn).bottom : null,
        btnRight: btn ? window.getComputedStyle(btn).right : null,
        btnZIndex: btn ? window.getComputedStyle(btn).zIndex : null,
        hasHint: !!hint,
        hintText: hint?.innerText,
        audioPaused: audio?.paused
      };
    })()`,
    returnByValue: true
  });
  console.log('Desktop After Click:', statePost.result.value);
  const shotPost = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scripts/test_desktop_post.png', Buffer.from(shotPost.data, 'base64'));

  // Click audio button to toggle mute
  console.log('Clicking audio button to toggle mute...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.film-audio-toggle')?.click()`
  });
  await new Promise(r => setTimeout(r, 400));

  let stateMute = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.film-audio-toggle');
      const audio = document.getElementById('wedding-soundtrack');
      return {
        btnText: btn?.innerText,
        audioPaused: audio?.paused
      };
    })()`,
    returnByValue: true
  });
  console.log('Desktop After Mute Click:', stateMute.result.value);

  console.log('=== TEST 2: MOBILE VIEW (iPhone portrait 390x844) ===');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await send('Page.navigate', { url: 'http://localhost:5173/w/ananya-karthik?view=mobile' });
  await new Promise(r => setTimeout(r, 2000));

  let stateMobPre = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.film-audio-toggle');
      const hint = document.querySelector('.film-audio-hint');
      const seal = document.querySelector('.wax-seal-hotspot');
      return {
        hasButton: !!btn,
        hasHint: !!hint,
        hasSeal: !!seal
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Before Click:', stateMobPre.result.value);
  const shotMobPre = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scripts/test_mobile_pre.png', Buffer.from(shotMobPre.data, 'base64'));

  console.log('Clicking wax seal on mobile...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.wax-seal-hotspot')?.click()`
  });
  await new Promise(r => setTimeout(r, 600));

  let stateMobPost = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.film-audio-toggle');
      const hint = document.querySelector('.film-audio-hint');
      const audio = document.getElementById('wedding-soundtrack');
      return {
        hasButton: !!btn,
        btnText: btn?.innerText,
        btnBottom: btn ? window.getComputedStyle(btn).bottom : null,
        btnRight: btn ? window.getComputedStyle(btn).right : null,
        btnZIndex: btn ? window.getComputedStyle(btn).zIndex : null,
        hasHint: !!hint,
        hintText: hint?.innerText,
        audioPaused: audio?.paused
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile After Click:', stateMobPost.result.value);
  const shotMobPost = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scripts/test_mobile_post.png', Buffer.from(shotMobPost.data, 'base64'));

  // Clear device override
  await send('Emulation.clearDeviceMetricsOverride');

  ws.close();
}

main().catch(console.error);
