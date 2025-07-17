# 🎓 RevEd Kids - Magical Educational App

<div align="center">

![RevEd Kids Logo](public/logo192.png)

**A magical, interactive educational platform designed for children with advanced sound, haptic feedback, and engaging animations.**

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-purple.svg)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11.0-green.svg)](https://www.framer.com/motion/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🚀 Live Demo](#) • [📖 Documentation](#) • [🐛 Report Bug](#) • [💡 Request Feature](#)

</div>

---

## ✨ Features

### 🎮 **Interactive Learning Experience**
- **Magical UI Components** with particle effects and animations
- **Sound Integration** with 50+ educational sound effects
- **Haptic Feedback** for mobile devices with 40+ patterns
- **Sparky Mascot** with contextual reactions and celebrations
- **XP System** with level progression and achievements

### 🎯 **Educational Content**
- **Exercise Engine** supporting multiple question types
- **Progress Tracking** with detailed analytics
- **Adaptive Learning** based on student performance
- **Gamification** with badges, streaks, and rewards
- **Accessibility** with screen reader support and keyboard navigation

### 🛠 **Technical Excellence**
- **React 19** with latest features and optimizations
- **TypeScript** for type safety and better development experience
- **Tailwind CSS** with custom magical theme
- **Framer Motion** for smooth animations
- **Responsive Design** for all devices
- **PWA Ready** with offline support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/reved-kids-frontend.git
cd reved-kids-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app in action!

---

## 📁 Project Structure

```
reved-kids-frontend/
├── public/                 # Static assets
│   ├── sounds/            # Audio files (Sparky, buttons, XP, etc.)
│   ├── images/            # Images and icons
│   └── favicon.ico        # App icon
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── layout/       # Layout components
│   │   └── exercise/     # Exercise-specific components
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React context providers
│   ├── services/         # API and external services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── scripts/              # Build and deployment scripts
└── docs/                 # Documentation
```

---

## 🎨 Magical Theme

Our custom Tailwind theme includes:

```css
/* Magical Colors */
--magical-violet: #8A2BE2;
--magical-blue: #4F46E5;
--magical-green: #10B981;
--magical-pink: #EC4899;
--magical-yellow: #F59E0B;

/* Magical Shadows */
--shadow-magical: 0 0 20px rgba(138, 43, 226, 0.3);
--shadow-sparkle: 0 0 30px rgba(255, 105, 180, 0.6);
```

---

## 🎵 Sound System

The app features a comprehensive sound system with:

- **50+ Sound Effects** across 8 categories
- **Event-driven Playback** synchronized with UI interactions
- **Volume Control** with master and per-sound settings
- **Cross-browser Support** with AudioContext and HTML5 fallback
- **Performance Optimized** with audio caching and preloading

### Sound Categories:
- 🎭 **Sparky Mascot** (happy, excited, thinking, celebrating)
- 🎮 **Buttons** (click, hover, success, error)
- ⭐ **XP System** (gain, levelup, bonus, achievement)
- 🎯 **Feedback** (success, error, streak, combo)
- 📚 **Exercises** (correct, incorrect, hint, complete)
- 🌟 **Portal** (open, levelup, badge unlock)

---

## 📳 Haptic Feedback

Advanced haptic feedback system with:

- **40+ Haptic Patterns** for different interactions
- **Intensity Control** with customizable multipliers
- **Queue System** to prevent haptic overload
- **Mobile Optimized** using Web Vibration API
- **Event Synchronization** with sound effects

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run e2e:test

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:performance
```

---

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production
```bash
npm run build        # Build the app
npm run deploy       # Deploy to production
```

### Docker
```bash
docker build -t reved-kids-frontend .
docker run -p 3000:3000 reved-kids-frontend
```

---

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: < 500KB gzipped
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **Conventional Commits** for commit messages

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **Howler.js** for audio management
- **All contributors** who make this project better

---

## 📞 Support

- **Email**: support@revedkids.com
- **Discord**: [Join our community](#)
- **Documentation**: [Full docs](#)
- **Issues**: [GitHub Issues](#)

---

<div align="center">

**Made with ❤️ for children's education**

[Back to top](#-reved-kids---magical-educational-app)

</div>
