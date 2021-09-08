import Worker from 'worker-loader!./worker.js';

const button = document.getElementById('keygen'),
  thresholdInput = document.getElementById('threshold'),
  partiesInput = document.getElementById('parties'),
  partiesList = document.getElementById('parties-list'),
  payload = document.getElementById('payload'),
  progress = document.getElementById('progress'),
  label = document.getElementById('label'),
  data = document.getElementById('data'),
  json = document.getElementById('json'),
  complete = document.getElementById('complete');

let actionType = 'keygen';
let threshold = 1;
let parties = 3;
let actionData = { threshold, parties };
let signingKeys = [];
// Message must be Vec<u8>, do not use Uint8Array as that
// gets serialized to a JSON object.
const message = randomMessage();

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

thresholdInput.addEventListener('change', (e) => {
  threshold = Math.min(parseInt(e.target.value), parties - 1);
});

partiesInput.addEventListener('change', (e) => {
  parties = parseInt(e.target.value);
});

function hex(bytes) {
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
  return bytes.reduce((acc, u8) => {
    acc += chars[Math.floor(u8 / 16)] + chars[u8 % 16];
    return acc
  }, '');
}

function showPartyKeys(multiKey) {
  show(partiesList);
  const keys = multiKey[0];
  const sharedKeys = multiKey[1];
  const ge = multiKey[2];
  const partyKeys = [];

  for (let i = 0; i < parties;i++) {
    partyKeys.push({
      index: i,
      key: keys[i],
      sharedKey: keys[i],
      ge: ge[i],
    })
  }

  const tpl = document.getElementById('party-item');

  for (const partyKey of partyKeys) {
    const template = tpl.content.cloneNode(true);
    const heading = template.querySelector('h3');
    const button = template.querySelector('button');
    heading.innerText = `Party ${partyKey.index + 1}`;
    const pre = template.querySelector('details > pre');
    pre.innerText = JSON.stringify(partyKey, undefined, 2);

    button.addEventListener('click', (e) => {
      signingKeys.push(partyKey);
      if (signingKeys.length === threshold + 1) {
        console.log('Got enough signing keys to proceed...');
      }

      e.currentTarget.setAttribute('disabled', '1');
    });

    partiesList.appendChild(template);
  }
}

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

      showPartyKeys(e.data.keys);

      // Prepare for next phase
      button.innerText = 'Sign message';
      actionType = 'sign_message';
      actionData = {...actionData, message};

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
