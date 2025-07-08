# 🚪 Chaincode Wallet (v0.2.0)

A minimal, offline-first, single-page identity wallet built for secure storage and sharing of encrypted "chaincode cards" — small, structured bits of private or public data.

Built as a single HTML + JS + CSS bundle with zero dependencies and full ZIP encryption support.

---

## 🌐 Features

- 🔐 **Private & Public Chaincode Cards**
- 🦪 **Wallet Storage** (local, offline)
- 🔑 **Keychain Memory** for encrypted values
- 📦 **ZIP Bundle Export** with encryption
- 📅 **Bundle Import** (only imports new cards)
- 🧪 **Self-check tool** for key-card matching
- ✅ **Offline SPA** (just open in browser)

---

## 🚀 Usage

1. Open `index.html` in any browser.
2. Create cards in the **Create** tab.
3. View and export cards in the **Wallet** tab.
4. Import `.enc` bundles or `.key.txt` files as needed.
5. Everything stays local to your device.

---

## 📁 Files

```
index.html       # Single-page UI
main.js          # All logic: encryption, wallet, keychain, UI
style.css        # Theme and layout
```

---

## 📜 License

MIT License — see [`LICENSE`](./LICENSE) for details.

---

## 👤 Author

Created with ✌️ by [@JDPlumbing](https://github.com/jdplumbing)

Feel free to fork, remix, or integrate into your own chain-of-trust or encrypted identity tools.
