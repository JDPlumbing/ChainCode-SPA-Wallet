# 🤝 Contributing to Chaincode Wallet

Thank you for your interest in contributing to Chaincode Wallet — a minimal, offline-first, encrypted identity and variable storage tool.

We welcome PRs, ideas, fixes, and feature proposals.

---

## 📦 Repo Structure

```
/               # Root
├── index.html         # Single-page app
├── main.js            # All app logic
├── style.css          # UI theme
├── manifest.json      # PWA manifest
├── service-worker.js  # Caches files for offline
├── icon-*.png         # App icons
├── README.md
├── ROADMAP.md
└── CONTRIBUTING.md
```

---

## ✅ How to Contribute

1. **Fork the repo**
2. **Clone your fork** locally
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Make your changes
5. Test it locally in the browser
6. Commit and push:
   ```bash
   git commit -m "Add: your change"
   git push origin feature/your-feature-name
   ```
7. Open a pull request (PR) back to `main`

---

## 🧪 Contribution Guidelines

- Keep everything offline-first
- Do not add frameworks or bundlers
- Use only native JS, CSS, and HTML
- Maintain SPA structure (no routing or multiple pages)
- Prefer clarity and maintainability over complexity

If you're unsure — open an issue or ask first!

---

## 💡 Suggested Contributions

- Additional use-case examples
- Visual polish
- Improved mobile support
- New tab for documentation
- Signature/cosign logic
- Card relationship mapping or linking

---

## 🛡️ Security & Privacy

We do not store or transmit user data. Please keep that design principle in mind for all contributions.

---

Thanks for helping make Chaincode better! 🙌
