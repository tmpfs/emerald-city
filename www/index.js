import Worker from 'worker-loader!./worker.js';

const button = document.getElementById('keygen'),
  payload = document.getElementById('payload'),
  progress = document.getElementById('progress'),
  label = document.getElementById('label'),
  data = document.getElementById('data'),
  json = document.getElementById('json'),
  complete = document.getElementById('complete');

function show(el) {
  el.style.display = 'flex';
}

function hide(el) {
  el.style.display = 'none';
}

function randomMessage() {
  return (Array.apply(null, Array(32))).map(() => {
    return Math.floor(Math.random() * 256);
  });
}

function hex(bytes) {
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
  return bytes.reduce((acc, u8) => {
    acc += chars[Math.floor(u8 / 16)] + chars[u8 % 16];
    return acc
  }, '');
}

let actionType = 'keygen';
let actionData = {};
// Message must be Vec<u8>, do not use Uint8Array as that
// gets serialized to a JSON object.
const message = randomMessage();

if (window.Worker) {
  const worker = new Worker('worker.js');
  worker.onmessage = (e) => {
    if (e.data.type === 'ready') {
      payload.innerText = hex(message);
      show(button);
      button.addEventListener('click', (_) => {
        show(progress);
        if (actionType === 'sign_message') {
          hide(data);
          label.innerText = 'Signing message...';
        } else if (actionType === 'verify_signature') {
          hide(progress);
          hide(button);
          hide(data);
        }
        // Tell the web worker to call WASM
        worker.postMessage({type: actionType, ...actionData})
      });
    } else if (e.data.type === 'keygen_done') {
      hide(progress);
      // Key generation is completed
      show(data);
      json.innerText = JSON.stringify(e.data.keys, undefined, 2);

      // Prepare for next phase
      button.innerText = 'Sign message';
      actionType = 'sign_message';
      actionData = {message};

    } else if (e.data.type === 'sign_message_done') {
      hide(progress);

      show(data);
      data.querySelector('summary').innerText = "Signed data";
      json.innerText = JSON.stringify(e.data.signed, undefined, 2);

      button.innerText = 'Verify signature';
      actionType = 'verify_signature';

    } else if (e.data.type === 'verify_signature_done') {
      show(complete);
    }
  }
} else {
  console.log('Your browser doesn\'t support web workers.');
}
