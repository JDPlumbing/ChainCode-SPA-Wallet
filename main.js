// ✅ main.js — unified all-in-one engine
import { blake2b } from 'https://esm.sh/@noble/hashes/blake2b';
import JSZip from 'https://esm.sh/jszip@3.10.1';

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
async function importDecryptedKeychain(decryptedText) {
  try {
    const parsed = JSON.parse(typeof decryptedText === "string" ? decryptedText : new TextDecoder().decode(decryptedText));
    const current = getKeychain();
    const merged = { ...current, ...parsed };
    setKeychain(merged);
    alert(`✅ Imported ${Object.keys(parsed).length} key(s) into keychain.`);
  } catch (err) {
    console.error("Failed to import decrypted keychain:", err);
    alert("❌ Could not import keychain.");
  }
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
function renderKeychain() {
  const keys = getKeychain();
  const list = document.getElementById('key-list');
  if (!list) {
    console.error('key-list element not found');
    return;
  }
  list.innerHTML = '';

  Object.entries(keys).forEach(([id, data]) => {
    const card = document.createElement('div');
    card.className = 'card';
    const shortId = id.slice(0, 4) + '-' + id.slice(4, 8) + '-' + id.slice(8, 12);

    card.innerHTML = `
      <div class="keycard-top">
        <input type="checkbox" class="key-check" data-id="${id}" />
        <h3>🔑 ${data.type}</h3>
      </div>
      <p><strong>Slug:</strong> ${shortId}</p>
      <p><strong>Status:</strong> Locked</p>
      <input type="password" class="key-field" value="${data.value}" readonly />
    `;

    list.appendChild(card);
  });
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
  const view = document.getElementById('wallet-scroll');
  if (!view) {
    console.error('wallet-scroll element not found');
    return;
  }
  view.innerHTML = '';

  cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    const visibility = card.metadata.visibility;

    el.innerHTML = `
      <div class="keycard-top">
        <input type="checkbox" class="card-check" data-index="${i}" />
        <h3>🔒 ${card.metadata.type}</h3>
      </div>
      <p><strong>Status:</strong> ${visibility === 'public' ? 'Public' : 'Encrypted'}</p>
      <p><strong>Expires:</strong> ${card.metadata.expiration || 'Never'}</p>
      ${card.metadata.notes ? `<p><strong>Notes:</strong> ${card.metadata.notes}</p>` : ''}
      ${visibility === 'public'
        ? `<p><strong>Value:</strong> ${card.metadata.value}</p>`
        : `<p><strong>Masked:</strong> **** ****</p>`}
      ${visibility === 'private'
        ? `<button class="unlock-btn" data-index="${i}">🔓 Unlock</button>`
        : ''}
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
  saveLinkAfterExport(a.download, "encrypted-custom-chaincode-bundle");

  URL.revokeObjectURL(url);
});

document.getElementById('clear-wallet')?.addEventListener('click', () => {
  if (confirm('⚠️ This will delete all wallet cards from this device. Continue?')) {
    clearWallet();
  }
});

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
      showToast(`✅ Imported key for "${type}"`);

    };
    reader.readAsText(file);
  });
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
    a.download = `custom-keychain-${Date.now()}.enc`;
    a.click();
    saveLinkAfterExport(a.download, "encrypted-custom-keychain");

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to encrypt selected keys:', err);
    alert('❌ Failed to export selected keys.');
  }
});
document.getElementById('delete-selected-cards').addEventListener('click', () => {
  const cards = getWallet();
  const selectedIndexes = Array.from(document.querySelectorAll('.card-check:checked'))
    .map(cb => parseInt(cb.dataset.index));

  if (!selectedIndexes.length) return alert('No cards selected to delete.');

  if (!confirm('Are you sure you want to delete the selected cards?')) return;

  const updatedCards = cards.filter((_, i) => !selectedIndexes.includes(i));
  setWallet(updatedCards);
  renderWallet();
});
document.getElementById('delete-selected-keys').addEventListener('click', () => {
  const keys = getKeychain();
  const selectedIds = Array.from(document.querySelectorAll('.key-check:checked'))
    .map(cb => cb.dataset.id);

  if (!selectedIds.length) return alert('No keys selected to delete.');

  if (!confirm('Are you sure you want to delete the selected keys?')) return;

  selectedIds.forEach(id => delete keys[id]);

  setKeychain(keys);
  renderKeychain();
});
document.getElementById('import-bundle')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const pass = prompt('Enter passphrase to decrypt bundle:');
    if (!pass) return;

    const encrypted = new Uint8Array(await file.arrayBuffer());
    const decryptedZip = await decryptZipBundle(encrypted, pass);
    if (!decryptedZip) {
      showToast("❌ Failed to decrypt bundle.", "#ff4757");
      return;
    }

    await importDecryptedZip(decryptedZip);
    renderWallet();
    showToast("✅ Bundle imported successfully!");
  } catch (err) {
    console.error('Failed to import .zip.enc bundle:', err);
    showToast("❌ Unexpected error during import.", "#ff4757");
  } finally {
    e.target.value = ''; // reset input
  }
});

const selfCheckBtn = document.getElementById('selfCheck');
if (selfCheckBtn) {
  selfCheckBtn.addEventListener('click', () => {
    const wallet = getWallet();
    const keychain = getKeychain();
    const matches = wallet.filter(c => keychain[c.public_slug.replace(/-/g, '').toLowerCase()]);
    alert(`🧪 ${matches.length} of ${wallet.length} cards have matching keys.`);
  });
}

// === 🧷 My Links Logic ===

const linkStorageKey = 'chaincode_links';
const addLinkBtn = document.getElementById('add-link');
const clearLinksBtn = document.getElementById('clear-links');

function loadLinksFromStorage() {
  const raw = localStorage.getItem(linkStorageKey);
  return raw ? JSON.parse(raw) : {};
}

function saveLinksToStorage(links) {
  localStorage.setItem(linkStorageKey, JSON.stringify(links));
}

function renderLinksUI() {
  const links = loadLinksFromStorage();
  const linkListEl = document.getElementById('link-list');
  if (!linkListEl) {
    console.error('link-list element not found');
    return;
  }
  linkListEl.innerHTML = '';

  if (Object.keys(links).length === 0) {
    linkListEl.innerHTML = `<p style="color:#888;">No saved links yet.</p>`;
    return;
  }

  Object.entries(links).forEach(([id, link]) => {
    const card = document.createElement('div');
    card.className = 'card';

    const content = document.createElement('div');
    content.className = 'card-content';

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.innerHTML = `
      <h3>${link.label || '(Untitled Link)'}</h3>
      <p><strong>Filename:</strong> ${link.filename}</p>
      <p><strong>Notes:</strong> ${link.notes || '-'}</p>
      <p class="status">Saved: ${new Date(link.created).toLocaleString()}</p>
    `;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const previewBtn = document.createElement('button');
    previewBtn.textContent = '👁 Preview';
    previewBtn.addEventListener('click', () => {
      const links = loadLinksFromStorage();
      const l = links[id];
      alert(`Label: ${l.label}\nFilename: ${l.filename}\nNotes: ${l.notes}`);
    });

    const shareBtn = document.createElement('button');
    shareBtn.textContent = '📤 Share';
    shareBtn.addEventListener('click', () => {
      const links = loadLinksFromStorage();
      const l = links[id];
      const shareData = {
        title: `Chaincode Bundle: ${l.label}`,
        text: `Here's the bundle: ${l.filename}\nNotes: ${l.notes || ''}`,
      };

      if (navigator.share) {
        navigator.share(shareData).catch(err => console.warn("Share canceled or failed:", err));
      } else {
        navigator.clipboard.writeText(`${l.filename}`).then(() => {
          alert("📋 Filename copied to clipboard. Paste into text or email manually.");
        });
      }
    });

    actions.appendChild(previewBtn);
    actions.appendChild(shareBtn);
    content.appendChild(meta);
    content.appendChild(actions);
    card.appendChild(content);
    linkListEl.appendChild(card);
  });
}


function addLink(label = 'Sample Bundle', filename = 'bundle.zip.enc', notes = '') {
  const links = loadLinksFromStorage();
  const id = Date.now().toString(36);
  links[id] = {
    label,
    filename,
    notes,
    created: new Date().toISOString()
  };
  saveLinksToStorage(links);
  renderLinksUI();
}

window.previewLink = function (id) {
  const links = loadLinksFromStorage();
  const link = links[id];
  alert(`Label: ${link.label}\nFilename: ${link.filename}\nNotes: ${link.notes}`);
};

window.shareLink = function (id) {
  const links = loadLinksFromStorage();
  const link = links[id];

  const shareData = {
    title: `Chaincode Bundle: ${link.label}`,
    text: `Here's the bundle: ${link.filename}\nNotes: ${link.notes || ''}`,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(err => console.warn("Share canceled or failed:", err));
  } else {
    navigator.clipboard.writeText(`${link.filename}`).then(() => {
      alert("📋 Filename copied to clipboard. Paste into text or email manually.");
    });
  }
};



// Helper functions for zip bundle decryption and import
async function decryptZipBundle(encrypted, passphrase) {
  try {
    const decrypted = await decrypt(encrypted, passphrase);
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt zip bundle:', err);
    return null;
  }
}

async function importDecryptedZip(decryptedZip) {
  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(decryptedZip);
    
    // Process the zip contents
    const files = Object.keys(loadedZip.files);
    let importedCount = 0;
    
    for (const filename of files) {
      if (filename.startsWith('cards/') && filename.endsWith('.json')) {
        const content = await loadedZip.files[filename].async('text');
        const card = JSON.parse(content);
        addCard(card);
        importedCount++;
      }
    }
    
    renderWallet();
    alert(`✅ Imported ${importedCount} cards from bundle.`);
  } catch (err) {
    console.error('Failed to import decrypted zip:', err);
    alert('❌ Failed to import bundle contents.');
  }
}
function showToast(msg, color = "#00ffe1") {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.position = "fixed";
  toast.style.bottom = "2rem";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.padding = "1rem 2rem";
  toast.style.background = color;
  toast.style.color = "#000";
  toast.style.fontWeight = "bold";
  toast.style.borderRadius = "8px";
  toast.style.zIndex = 9999;
  toast.style.boxShadow = "0 0 12px rgba(0,255,225,0.4)";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ✅ This should be a standalone function, not nested inside another
function saveLinkAfterExport(filename, type = "wallet") {
  const links = loadLinksFromStorage();
  const id = Date.now().toString(36);
  const label = prompt("Name this export? (optional)") || `Unnamed Export – ${new Date().toLocaleString()}`;

  links[id] = {
    label,
    filename,
    type,
    notes: "Auto-added after export",
    created: new Date().toISOString()
  };

  saveLinksToStorage(links);
  renderLinksUI();
}

// ✅ This part belongs at top-level (not inside importLink)
let pendingLinkId = null;
const linkImportInput = document.getElementById('link-import-input');

function importLink(id) {
  pendingLinkId = id;
  linkImportInput.click();
}

if (linkImportInput) {
  linkImportInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingLinkId) return;

    try {
      const encrypted = new Uint8Array(await file.arrayBuffer());
      const passphrase = prompt("Enter passphrase to decrypt bundle:");
      if (!passphrase) return;

      const decryptedZip = await decryptZipBundle(encrypted, passphrase);
      if (!decryptedZip) return alert("❌ Decryption failed.");

      const link = loadLinksFromStorage()[pendingLinkId];
      if (!link) return alert("❌ Link not found.");

      if (link.type === 'wallet' || link.type === 'encrypted-custom-chaincode-bundle') {
        await importDecryptedZip(decryptedZip);
      } else if (link.type.includes('keychain')) {
        await importDecryptedKeychain(decryptedZip);
      } else {
        alert("❓ Unknown link type.");
      }
      if (link.type === 'wallet' || link.type === 'encrypted-custom-chaincode-bundle') {
        await importDecryptedZip(decryptedZip);
        renderWallet();
        showToast("✅ Wallet bundle imported!");
      } else if (link.type.includes('keychain')) {
        await importDecryptedKeychain(decryptedZip);
        renderKeychain();
        showToast("✅ Keychain imported!");
      } else {
        showToast("❓ Unknown link type", "#ff4757");
      }



    } catch (err) {
      console.error(err);
      alert("❌ Error during import.");
    } finally {
      linkImportInput.value = '';
      pendingLinkId = null;
    }
  });
}




if (addLinkBtn) addLinkBtn.onclick = () => {
  const label = prompt("Label for this saved export? (e.g., 'company login's bundle')") || 'Unnamed Export';
  const filename = prompt("Actual filename after Exporting from Wallet or Keychain (e.g., 'bundle-2025.enc')") || 'unknown.zip.enc';
  const notes = prompt("Add any notes or context (optional):") || 'Added manually';
  if (!label || !filename) return;

  addLink(label, filename, notes);
};



if (clearLinksBtn) clearLinksBtn.onclick = () => {
  if (confirm("Are you sure you want to clear all saved links?")) {
    localStorage.removeItem(linkStorageKey);
    renderLinksUI();
  }
};


// Initial render
renderWallet();
renderKeychain();
// Run on load
renderLinksUI();