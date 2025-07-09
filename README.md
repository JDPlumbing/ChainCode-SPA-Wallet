# 🔐 Chaincode Wallet (v0.3.0)

A minimal, offline-first, single-page identity wallet built for secure storage and sharing of encrypted "chaincode cards" — small, structured bits of private or public data.

Built as a single HTML + JS + CSS bundle with zero dependencies and full ZIP encryption support.

---

## 🌐 Features (v0.3.0)

- 🔐 **Private & Public Chaincode Cards**
- 📋 **Label, Notes, Expiration** support per card
- 🧾 **Masked display** for encrypted values
- 🪪 **Wallet View** for managing and exporting cards
- 🔑 **Keychain Memory** with visual card-style layout
- 📦 **Encrypted Bundle Export/Import** with passphrase
- 📁 **Selected Key Export (Encrypted)**
- 📥 **Import `.key.txt` or `.enc` keychain backups**
- 🧪 **Self-check tool** for card-key match status
- 📘 **How to Use Tab** for onboarding & walkthroughs
- ✅ **Offline-first SPA** (just open in browser)

---

## 🚀 Usage

1. Open `index.html` in any browser.
2. Create new cards in the **Create** tab (public or private).
3. View and manage your cards in the **Wallet** tab.
4. Use the **Keychain** tab to manage decryption keys.
5. Export selected cards as `.zip.enc` bundles with encryption.
6. Import bundles or keychain backups in the **Import** tab.
7. Use the **How to Use** tab to learn the workflow.
8. Everything stays local to your device — no server, no sync.

---

## 🧭 Workflow Example

- Create an encrypted card for a secret (e.g. API key)
- Save or share the `.key.txt` file if needed
- Export selected cards as an encrypted `.zip.enc` bundle
- Import it later or send to a teammate with passphrase
- Re-import decryption keys using `.key.txt` or `.enc`
- Unlock cards with matching keys stored in the keychain

---

## 📁 Files

```
index.html       # Single-page UI
main.js          # All app logic (wallet, keychain, encryption)
style.css        # Theme and layout styling
manifest.json    # PWA support
service-worker.js# Offline cache handler
icon-*.png       # App icons
```

---

## 📜 License

MIT License — see [`LICENSE`](./LICENSE) for details.

---

## 👤 Author

Created with ✌️ by [@JDPlumbing](https://github.com/jdplumbing)

Feel free to fork, remix, or integrate into your own chain-of-trust or encrypted identity tools.

> 🔖 Version: v0.3.0 (Released July 2025)
