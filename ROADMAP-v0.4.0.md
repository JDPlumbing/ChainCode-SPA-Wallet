# 🧭 Chaincode Wallet Roadmap – v0.4.0

## 🆕 Major Features – Target v0.4.0

### 🧷 My Links Tab (Local Bundle Organizer)
Add a new tab: **"My Links"** that acts as a local "bookmark manager" or "folder view" for known .zip.enc bundles.

- Allow users to:
  - 💾 Save a known bundle with a custom name (e.g., "Bank Info", "Medical Records")
  - 🗂 Organize links visually like a folder list
  - 🖇 Rename or remove saved links
  - 🔓 Re-import bundles via UI action

- Metadata stored in `localStorage['chaincode_links']`:
  ```json
  {
    "my_personal_vault": {
      "label": "My Personal Vault",
      "filename": "chaincode-bundle-169102999.enc",
      "notes": "Saved July 2025"
    }
  }
  ```

- UI: 
  - Visual "folder card" per saved link
  - Buttons: `🔓 Import`, `🖇 Rename`, `🗑 Remove`

---

## 🧪 Experimental / Stretch

### 🔐 Multi-Signer Unlock (Nuclear Football Mode)
(Consider for v0.5.0)

- Chaincode cards that require **2+ private unlock codes** to decrypt
- Codes must be entered in sequence or within session/time constraints
- Designed for:
  - Shared vaults
  - Executor scenarios
  - Mutual trust workflows

- Possible implementations:
  - Local XOR or Shamir Secret Sharing of decryption key
  - Unlock screen prompts both parties
  - Offline co-signing handshake via QR or code

---

## ✅ Additional QoL Enhancements

- Add version string to footer or About section
- Allow labels/tags on exported bundles
- Import file preview: show bundle name before decrypt
- Auto-detect iOS and add UI note about downloading → saving to Files
- Drag-and-drop support for import zones
- Optional file type filter in import picker

---

> Version: Planning for v0.4.0  
> Status: In Progress (Post-v0.3.0 Release)
