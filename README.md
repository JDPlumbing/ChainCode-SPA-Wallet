# 🔐 Chaincode Wallet (v0.4.0)

A minimal, offline-first, single-page identity wallet built for secure storage and sharing of encrypted "chaincode cards" — small, structured bits of private or public data.

Built as a single HTML + JS + CSS bundle with zero dependencies and full ZIP encryption support.

---

## 🌐 Features (v0.4.0)

* 🔐 **Private & Public Chaincode Cards**
* 🧾 **Labels, Notes, Expiration** for every card
* 🪪 **Wallet View** with selection + export tools
* 🔑 **Keychain Memory** (auto-matches decryption keys)
* 📦 **Encrypted Bundle Export (.zip.enc)**
* 📁 **Encrypted Key Export (.enc)**
* 📥 **Import `.key.txt`, `.enc`, or `.zip.enc` securely**
* 🥷 **My Links Tab** to organize exported bundles
* 👁 **Preview + Share buttons** for quick access
* 📌 **Passphrase Nesting Strategy** built-in
* 🧪 **Self-check tool** to match keys to cards
* 📘 **How to Use Tab** with onboarding and recovery tips
* ✅ **Offline-first SPA** — no cloud, no sync, just open in browser

---

## 🚀 Usage

1. Open `index.html` in any browser (mobile or desktop).
2. Create new cards in the **Create** tab.
3. Manage and export cards in the **Wallet** tab.
4. Manage and export keys in the **Keychain** tab.
5. All exports appear in **My Links** for reference and sharing.
6. Use the **Import** tab to restore from `.key.txt`, `.enc`, or `.zip.enc`.
7. Learn strategy and examples in the **How to Use** tab.
8. Everything stays 100% local to your device.

---

## 🧭 Workflow Example

* Create a Chaincode card (e.g. for your API key or login)
* Choose **Private** to encrypt it — a `.key.txt` will be downloaded
* Export selected cards as a `.zip.enc` bundle with a passphrase
* You can later:

  * Re-import that bundle
  * Use your saved passphrase
  * Restore all contents with matching keys
* Optionally store your passphrase inside a private card too — enabling a self-healing vault

---

## 📁 Files

```
index.html         # Single-page UI
main.js            # App logic (encryption, wallet, keychain)
style.css          # Full UI theme and layout
manifest.json      # PWA install support
service-worker.js  # Offline cache handler
icon-*.png         # App icons
```

---

## 📜 License

MIT License — see [`LICENSE`](./LICENSE) for details.

---

## 👤 Author

Created with ✌️ by [@JDPlumbing](https://github.com/jdplumbing)

Feel free to fork, remix, or integrate into your own chain-of-trust or encrypted identity tools.

> 🔖 Version: v0.4.0 (Released July 2025)
