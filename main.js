// ✅ main.js — unified all-in-one engine
import { blake2b } from 'https://esm.sh/@noble/hashes/blake2b';

const zip = new JSZip();

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ------------------ Encryption Helpers ------------------
async function getKeyMaterial(password) {
  return crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
}

async function getKey(keyMaterial, salt) {
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encrypt(data, password = 'default') {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await getKeyMaterial(password);
  const key = await getKey(keyMaterial, salt);
  const encoded = data instanceof Uint8Array ? data : encoder.encode(data);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return new Uint8Array([...salt, ...iv, ...new Uint8Array(ciphertext)]);
}

async function decrypt(buffer, password = 'default') {
  const data = new Uint8Array(buffer);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  const keyMaterial = await getKeyMaterial(password);
  const key = await getKey(keyMaterial, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new Uint8Array(decrypted);
}

// ------------------ Keychain ------------------
const KEYCHAIN_KEY = 'chaincode_keychain';
function getKeychain() {
  return JSON.parse(localStorage.getItem(KEYCHAIN_KEY) || '{}');
}
function setKeychain(obj) {
  localStorage.setItem(KEYCHAIN_KEY, JSON.stringify(obj));
}
function saveKey(id, key, type = 'Unknown') {
  const kc = getKeychain();
  kc[id] = { value: key.trim(), type };
  setKeychain(kc);
}
function unlockWithKeychain(id) {
  const kc = getKeychain();
  return kc[id]?.value || null;
}

// ------------------ Wallet ------------------
const WALLET_KEY = 'chaincode_wallet';
function getWallet() {
  return JSON.parse(localStorage.getItem(WALLET_KEY) || '[]');
}
function setWallet(cards) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(cards));
}
function addCard(card) {
  if (card.metadata.encrypted_value instanceof Uint8Array) {
    card.metadata.encrypted_value = Array.from(card.metadata.encrypted_value);
  }

  const cards = getWallet();
  if (!cards.some(c => c.public_slug === card.public_slug)) {
    cards.push(card);
    setWallet(cards);
  }
}
function clearWallet() {
  localStorage.removeItem('chaincode_wallet');
  renderWallet(); // refresh the UI
}


// ------------------ Generator ------------------
function generateRandomPassword(len = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(len);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => chars[b % chars.length]).join('');
}

async function generateChaincodeId(raw) {
  const timestamp = Date.now();
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const input = `${navigator.userAgent}|${timestamp}|${Array.from(entropy).join('-')}|${raw}`;
  const hash = blake2b(encoder.encode(input), 32);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ------------------ UI Bindings ------------------
function switchTab(target) {
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.nav-tabs button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(target).classList.add('active');
  document.querySelector(`.nav-tabs button[data-tab="${target}"]`).classList.add('active');
}

document.querySelectorAll('.nav-tabs button').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('card-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('type').value;
  const value = document.getElementById('value').value.trim();
  const visibility = document.getElementById('visibility').value;
  const timestamp = new Date().toISOString();
  const chaincode_id = await generateChaincodeId(type + value);
  const public_slug = `${chaincode_id.slice(0, 4)}-${chaincode_id.slice(4, 8)}-${chaincode_id.slice(8, 12)}`;
  const expiration = document.getElementById('expiration').value || null;
  const notes = document.getElementById('notes').value.trim() || null;


  let encrypted_value = value;
  let key = null;
  if (visibility === 'private') {
    key = generateRandomPassword();
    const encrypted = await encrypt(value, key);

    // Store encrypted data safely for JSON
    encrypted_value = Array.from(encrypted);

    // Save key to keychain
    const id = public_slug.replace(/-/g, '').toLowerCase();
    saveKey(id, key, type);

    // Trigger .key.txt download
    const keyBlob = new Blob([key], { type: 'text/plain' });
    const keyUrl = URL.createObjectURL(keyBlob);
    const keyLink = document.createElement('a');
    keyLink.href = keyUrl;
    keyLink.download = `${type}-${public_slug}.key.txt`;
    keyLink.click();
    URL.revokeObjectURL(keyUrl);
  }


  const card = {
    chaincode_id,
    public_slug,
    generated_at: timestamp,
    metadata: {
      type,
      visibility,
      value: visibility === 'public' ? value : undefined,
      encrypted_value: visibility === 'private' ? encrypted_value : undefined,
      expiration,
      notes
    },
  };

  addCard(card);
  renderWallet();
  alert('✅ Chaincode created and saved.');
});

function renderWallet() {
  const cards = getWallet();
  const view = document.getElementById('wallet-view');
  view.innerHTML = '';
  cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-content">
        <div class="card-meta">
          <p><strong>Type:</strong> ${card.metadata.type}</p>
          <p><strong>Status:</strong> ${card.metadata.visibility === 'public' ? 'Public' : 'Encrypted'}</p>
          <p><strong>Expires:</strong> ${card.metadata.expiration || 'Never'}</p>
          ${card.metadata.notes ? `<p><strong>Notes:</strong> ${card.metadata.notes}</p>` : ''}
          ${card.metadata.visibility === 'public'
            ? `<p><strong>Value:</strong> ${card.metadata.value}</p>`
            : `<p><strong>Masked:</strong> **** ****</p>`}
        </div>
        <div class="card-actions">
          <label>
            <input type="checkbox" class="card-check" data-index="${i}" />
          </label>
          ${card.metadata.visibility === 'private'
            ? `<button class="unlock-btn" data-index="${i}">Unlock</button>`
            : ''}
        </div>
      </div>
    `;

    view.appendChild(el);
  });
}

document.addEventListener('click', async (e) => {
if (e.target.classList.contains('unlock-btn')) {
  const index = e.target.dataset.index;
  const card = getWallet()[index];
  if (!card) return;

  const slug = card.public_slug || '';
  const id = slug.replace(/-/g, '').toLowerCase();

  let key = unlockWithKeychain(id);
  if (!key) {
    key = prompt(`No key found for "${card.metadata.type}". Enter decryption key:`);
  }
  if (!key) return;

  try {
    let encrypted = card.metadata.encrypted_value;

    if (typeof encrypted === 'string') {
      encrypted = JSON.parse(encrypted);
    }
    if (Array.isArray(encrypted)) {
      encrypted = new Uint8Array(encrypted);
    }

    const decrypted = await decrypt(encrypted, key);
    alert(`🔓 Value: ${new TextDecoder().decode(decrypted)}`);
  } catch (err) {
    console.warn('Failed to decrypt with key:', key, err);
    alert('❌ Failed to decrypt.');
  }
}

});


document.getElementById('export-selected').addEventListener('click', async () => {
  const cards = getWallet();
  const selected = Array.from(document.querySelectorAll('.card-check:checked')).map(cb => cards[cb.dataset.index]);
  if (!selected.length) return alert('No cards selected');

  const zip = new JSZip();
  const meta = {
    exported_at: new Date().toISOString(),
    expires_at: prompt('Expiration date (YYYY-MM-DD)?') || null,
    shared_with: prompt('Who is this bundle for?') || null,
    card_count: selected.length
  };

  selected.forEach(card => {
    const name = `${card.metadata.type}-${card.public_slug}.json`;
    zip.file(`cards/${name}`, JSON.stringify(card, null, 2));
  });
  zip.file('meta.json', JSON.stringify(meta, null, 2));
  zip.file('manifest.txt', selected.map(c => c.public_slug).join('\n'));

  const zipBytes = await zip.generateAsync({ type: 'uint8array' });
  const pass = prompt('Enter passphrase to encrypt bundle:');
  if (!pass) return;
  const encrypted = await encrypt(zipBytes, pass);

  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chaincode-bundle-${Date.now()}.zip.enc`;
  a.click();
  URL.revokeObjectURL(url);
});

//document.getElementById('import-wallet').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('clear-wallet')?.addEventListener('click', () => {
  if (confirm('⚠️ This will delete all wallet cards from this device. Continue?')) {
    clearWallet();
  }
});

//document.getElementById('fileInput').addEventListener('change', (e) => {
//  Array.from(e.target.files).forEach(file => {
//    const reader = new FileReader();
//    reader.onload = evt => {
 //     try {
//        const card = JSON.parse(evt.target.result);
//        addCard(card);
//        renderWallet();
//      } catch {
//        alert('Invalid card file.');
//      }
//    };
//    reader.readAsText(file);
//  });
//});

document.getElementById('import-keys').addEventListener('change', (e) => {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const key = reader.result.trim();
      const parts = file.name.replace('.key.txt', '').split('-');
      const id = parts.slice(-3).join('').toLowerCase();
      const type = parts[0] || 'Unknown';
      saveKey(id, key, type);
      renderKeychain();
    };
    reader.readAsText(file);
  });
});

document.getElementById('export-keys').addEventListener('click', () => {
  const keys = getKeychain();
  const blob = new Blob([JSON.stringify(keys, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `keychain-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('export-encrypted-keys').addEventListener('click', async () => {
  const keys = getKeychain();
  if (!Object.keys(keys).length) {
    return alert('🔑 No keys to export.');
  }

  const pass = prompt('Enter passphrase to encrypt your keychain:');
  if (!pass) return;

  try {
    const encrypted = await encrypt(JSON.stringify(keys), pass);
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keychain-encrypted-${Date.now()}.enc`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to encrypt keychain:', err);
    alert('❌ Failed to export encrypted keychain.');
  }
});

document.getElementById('clear-keys').addEventListener('click', () => {
  if (confirm('Clear all keys?')) {
    localStorage.removeItem(KEYCHAIN_KEY);
    renderKeychain();
  }
});
document.getElementById('import-encrypted-keys').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const pass = prompt('Enter decryption passphrase:');
      if (!pass) return;

      const decrypted = await decrypt(reader.result, pass);
      const text = new TextDecoder().decode(decrypted);
      const importedKeys = JSON.parse(text);

      const current = getKeychain();
      const merged = { ...current, ...importedKeys };
      setKeychain(merged);
      renderKeychain();
      alert(`✅ Imported ${Object.keys(importedKeys).length} keys.`);
    } catch (err) {
      console.error('Failed to import encrypted keychain:', err);
      alert('❌ Failed to decrypt or parse keychain.');
    }
  };

  reader.readAsArrayBuffer(file);
});
document.getElementById('export-selected-keys').addEventListener('click', async () => {
  const keys = getKeychain();
  const selectedIds = Array.from(document.querySelectorAll('.key-check:checked'))
    .map(cb => cb.dataset.id);
  
  if (!selectedIds.length) return alert('No keys selected.');

  const selected = {};
  selectedIds.forEach(id => {
    if (keys[id]) selected[id] = keys[id];
  });

  const pass = prompt('Enter passphrase to encrypt selected keys:');
  if (!pass) return;

  try {
    const encrypted = await encrypt(JSON.stringify(selected), pass);
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keychain-selected-${Date.now()}.enc`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to encrypt selected keys:', err);
    alert('❌ Failed to export selected keys.');
  }
});

function renderKeychain() {
  const keys = getKeychain();
  const list = document.getElementById('key-list');
  list.innerHTML = '';
  Object.entries(keys).forEach(([id, data]) => {
    const card = document.createElement('div');
    card.className = 'card';
    const shortId = id.slice(0, 4) + '-' + id.slice(4, 8) + '-' + id.slice(8, 12);
    card.innerHTML = `
      <div class="keycard-top">
        <input type="checkbox" class="key-check" data-id="${id}" />
        <h3>🔖 ${data.type}</h3>
      </div>
      <p><strong>Slug:</strong> ${shortId}</p>
      <p><strong>Status:</strong> Locked</p>
      <input type="password" class="key-field" value="${data.value}" readonly />
    `;

    list.appendChild(card);
  });
}

document.getElementById('bundleImportBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('bundleInput');
  const file = fileInput.files[0];
  if (!file) return alert('No file selected');

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const pass = prompt('Enter decryption key:');
      const decrypted = await decrypt(reader.result, pass);
      const zip = await JSZip.loadAsync(decrypted);
      const folder = zip.folder('cards');
      const wallet = getWallet();
      let count = 0;
      for (const file of Object.values(folder.files)) {
        try {
          const text = await file.async('string');
          if (!text.trim()) {
            console.warn(`⚠️ Skipping empty file: ${file.name}`);
            continue;
          }

          const card = JSON.parse(text);

          if (!card.chaincode_id || !card.public_slug) {
            console.warn(`⚠️ Invalid card skipped: ${file.name}`);
            continue;
          }

          if (!wallet.some(w => w.chaincode_id === card.chaincode_id)) {
            wallet.push(card);
            count++;
          }
        } catch (err) {
          console.warn(`⚠️ Could not process ${file.name}:`, err);
        }
      }

      setWallet(wallet);
      renderWallet();
      alert(`✅ Imported ${count} new cards.`);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to import bundle: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById('selfCheck').addEventListener('click', () => {
  const wallet = getWallet();
  const keychain = getKeychain();
  const matches = wallet.filter(c => keychain[c.public_slug.replace(/-/g, '').toLowerCase()]);
  alert(`🧪 ${matches.length} of ${wallet.length} cards have matching keys.`);
});

// Initial render
renderWallet();
renderKeychain();