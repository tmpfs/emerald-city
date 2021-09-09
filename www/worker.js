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
      } else if (data.type === 'generate_sign_key') {
        const {index, key, sharedKey, vssScheme} = data;
        const signingKey = wasm.generate_party_sign_key(index, key, sharedKey, vssScheme);
        postMessage({type: 'generate_sign_key_done', index, signingKey});
      } else if (data.type === 'sign_message') {
        /*
        console.log('original multi keys');
        console.log(keys);
        console.log(JSON.stringify(keys));
        console.log('END original multi keys');
        */
        const {message, threshold, parties, signKeys} = data;

        /*
        console.log('split multi keys');
        console.log(signKeys);
        console.log(JSON.stringify(signKeys));
        console.log('END split multi keys');
        */

        signed = wasm.sign_message(threshold, parties, signKeys, message);
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

