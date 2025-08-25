# GitHub CRM Frontend

A modern, feature-rich GitHub repository management dashboard built with React and TypeScript. Track, manage, and analyze your GitHub repositories with real-time synchronization and comprehensive statistics.

## ✨ Features

### 📊 **Repository Management**
- **Dashboard Overview**: Comprehensive statistics and insights for all tracked repositories
- **Repository Tracking**: Add and monitor GitHub repositories by path (owner/repository)
- **Real-time Synchronization**: Automatic sync with GitHub API for latest stats
- **Manual Updates**: Edit repository data manually when needed
- **Statistics Tracking**: Monitor stars, forks, open issues, and more

### 🎨 **Modern UI/UX**
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes with system preference support
- **Smooth Animations**: Framer Motion powered animations and transitions
- **Modern Components**: Built with Ant Design, shadcn/ui and Tailwind CSS

### 🌐 **Internationalization**
- **Multi-language Support**: English and Ukrainian translations
- **RTL Support**: Right-to-left language compatibility
- **Dynamic Language Switching**: Change language on-the-fly

### 🔐 **User Management**
- **Authentication System**: Secure user login and registration
- **User Profiles**: Manage user accounts and preferences
- **Permission Management**: Role-based access control

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Ant Design, shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Internationalization**: i18next
- **Icons**: Iconify, Lucide React

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20.x or higher
- **Package Manager**: pnpm (recommended), npm, or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CROSP/github-public-crm.git
   cd github-public-crm
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # API Configuration
   VITE_APP_API_BASE_URL=http://localhost:3001/api
   
   # Application Configuration
   VITE_APP_DEFAULT_ROUTE=/dashboard
   VITE_APP_PUBLIC_PATH=/
   ```

4. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm preinstall` | Setup git hooks |

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── animate/        # Animation components (Framer Motion)
│   ├── ui/             # shadcn/ui components
│   └── ...
├── pages/              # Application pages
│   ├── dashboard/      # Dashboard with statistics
│   ├── repositories/   # Repository management
│   └── ...
├── store/              # State management (Zustand)
├── locales/            # Internationalization files
├── theme/              # Theme configuration
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

## 🎯 Key Components

### Dashboard
- Repository statistics overview
- Data insights and metrics
- Quick actions and management tools

### Repository Management
- Add repositories by GitHub path
- View repository details and statistics
- Sync with GitHub API
- Manual data updates
- Search and filter repositories

### Animation System
- `MotionContainer`: General animation wrapper
- `MotionLazy`: Lazy-loaded animations
- `MotionViewport`: Scroll-triggered animations

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_API_BASE_URL` | Backend API endpoint | `/api` |
| `VITE_APP_DEFAULT_ROUTE` | Default route after login | `/workbench` |
| `VITE_APP_PUBLIC_PATH` | Public asset path | `/` |

### Theme Configuration
The application supports extensive theming through CSS variables and Tailwind configuration. Themes can be customized in the settings panel.

## 📱 Usage

### Adding a Repository
1. Navigate to the **Repositories** page
2. Click **"Add Repository"**
3. Enter the GitHub path (e.g., `facebook/react`)
4. Click **"Add"** to start tracking

### Syncing Repository Data
- **Automatic**: Repositories sync periodically
- **Manual**: Click the sync button on any repository
- **Bulk**: Use the bulk sync option for multiple repositories

### Viewing Statistics
- **Dashboard**: Overview of all tracked repositories
- **Individual**: Detailed stats for each repository
- **Insights**: Data trends and repository analytics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation when needed

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Oleksandr Molochko**
- GitHub: [@CROSP](https://github.com/CROSP)
- Project: [github-public-crm](https://github.com/CROSP/github-public-crm)

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Lucide](https://lucide.dev/) for the icon set
- [Tailwind CSS](https://tailwindcss.com/) for the styling system

## 📞 Support

If you find this project helpful, please give it a ⭐ on GitHub!

For questions, issues, or feature requests, please [create an issue](https://github.com/CROSP/github-public-crm/issues).

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/CROSP">CROSP</a></p>
</div>
