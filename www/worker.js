// NOTE: must be an asynchronous import
import('emerald-city')
  .then((wasm) => {
    // Store WASM response values here for now
    let keys, signed;

    onmessage = (e) => {
      const {data} = e;
      if (data.type === 'keygen') {
        const {threshold, parties} = data;
        keys = wasm.keygen(threshold, parties);
        postMessage({type: 'keygen_done', keys});
      } else if (data.type === 'sign_message') {
        const {message, threshold, parties} = data;
        signed = wasm.sign_message(threshold, parties, keys, message);
        postMessage({type: 'sign_message_done', signed});
      } else if (data.type === 'verify_signature') {
        const {parties} = data;
        wasm.verify_signature(parties, signed);
        postMessage({type: 'verify_signature_done', keys});
      }
    }
    postMessage({type: 'ready'});
  })
  .catch(e => console.error('Error importing wasm module `emerald-city`:', e));

