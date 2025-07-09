# 📍 Chaincode Wallet Roadmap

This roadmap outlines planned features and directions for future releases of Chaincode Wallet.

---

## ✅ v0.2.1 (Current Stable)
- Offline-first PWA
- Encrypted card creation
- Keychain memory per device
- Bundle export and import (.zip.enc)
- Manual key unlock fallback
- Self-check for key matches

---

## 🛣️ v0.3.0 – Next Release

### 🔐 Encrypted Local Vault (Env-style Use Case)
- Allow custom `type` entry for card labels (e.g. "AWS_SECRET", "Garage code")
- Optional expiration date per card (e.g. `2025-12-31`)
- Store notes, API keys, and other sensitive data just like environment variables

### 📘 Onboarded Usage Guidance
- Add a new "How to Use" tab in the SPA itself
- Include:
  - What is a Chaincode Card
  - How to export/import
  - Use cases (env vault, identity locker, card-sharing)
  - Security notes

### 📱 Improved UX
- Mobile styling polish
- Better prompts for errors or expired cards
- Optional metadata preview before importing bundles

---

## 🧠 Future / v0.4+
- Chaincode signatures and verification (web of trust)
- Co-signing workflows (dual signoff)
- Visual card graph (linked cards)
- Multi-keychain support or backup
- QR code share + import
- Cloud sync (optional, encrypted)

---

## 🧪 Ideas Under Consideration
- Field templates (credit card, login, notes, etc.)
- Automatic biometric unlock fallback
- Multi-device sync
- Drag-and-drop bundle import / export
- Integrations with password managers or mobile keychains

---

Last updated: July 2025