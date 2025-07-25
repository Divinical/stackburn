# StackBurn - Post-AI Survival Weapon

Burn the bloat before it burns you. StackBurn is an AI-powered desktop app that scans your digital stack and detects bloat across Google Drive, local folders, and GitHub repositories.

## 🔥 Features

- **Google Drive Scanner**: OAuth 2.0 integration for scanning and analyzing Drive files
- **Local Folder Scanner**: Recursive scanning with duplicate detection and SHA-256 hashing
- **GitHub Repository Scanner**: Token-based authentication to find stale repos and branches
- **Burn Score Engine**: Intelligent scoring system (0-100) with actionable recommendations
- **Real-time Analysis**: Get instant insights into your digital clutter

## 🚀 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for blazing fast builds
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- Recharts for data visualization

### Backend (Tauri)
- Rust-powered desktop app
- Native file system access
- Secure OAuth handling
- Cross-platform support (Windows, macOS, Linux)

## 📋 Prerequisites

- Node.js 18+ & npm
- Rust toolchain (for Tauri)
- Tauri CLI: `cargo install tauri-cli`

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd stackburn

# Install frontend dependencies
npm install

# Build Rust dependencies
cd src-tauri
cargo build
cd ..
```

## 🔧 Configuration

### Google Drive OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8080/oauth/callback`
5. Update credentials in `src-tauri/src/scanners/drive_scanner.rs`:
   ```rust
   const CLIENT_ID: &str = "YOUR_CLIENT_ID";
   const CLIENT_SECRET: &str = "YOUR_CLIENT_SECRET";
   ```

### GitHub Token

Generate a personal access token with `repo` scope at https://github.com/settings/tokens

## 💻 Development

```bash
# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## 🏗️ Project Structure

```
stackburn/
├── src/                    # React frontend
│   ├── api/               # API integration
│   ├── components/        # UI components
│   ├── hooks/            # Custom React hooks
│   └── pages/            # Page components
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── main.rs      # Tauri entry point
│   │   ├── scanners/    # Scanner modules
│   │   └── burn_score.rs # Scoring engine
│   └── Cargo.toml       # Rust dependencies
└── public/              # Static assets
```

## 🎯 Usage

1. **Launch StackBurn** - Start the application
2. **Connect Integrations** - Authenticate with Google Drive, GitHub, or select local folders
3. **Run Scan** - Initiate the bloat detection process
4. **Review Results** - Analyze your Burn Score and recommendations
5. **Take Action** - Follow suggestions to clean up your digital stack

## 📊 Burn Score Interpretation

- **0-30**: Minimal bloat - Your stack is clean
- **31-60**: Moderate bloat - Some cleanup recommended
- **61-80**: High bloat - Significant cleanup needed
- **81-100**: Critical bloat - Immediate action required

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Build smaller, faster, and more secure desktop applications
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Vite](https://vitejs.dev/) - Next generation frontend tooling