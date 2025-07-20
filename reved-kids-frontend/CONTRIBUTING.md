# 🤝 Contributing to RevEd Kids

Thank you for your interest in contributing to RevEd Kids! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**
- **VS Code** (recommended with our extensions)

### Setup

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/reved-kids-frontend.git
   cd reved-kids-frontend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Copy environment variables**:
   ```bash
   cp env.example .env.local
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Verify setup**:
   ```bash
   npm run check
   ```

---

## 🔄 Development Workflow

### Branch Strategy

We use a **Git Flow** approach:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Creating a Feature

1. **Create feature branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/amazing-feature
   ```

2. **Make changes** and commit:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```

4. **Create Pull Request** to `develop`

---

## 📝 Code Standards

### TypeScript

- **Strict mode** enabled
- **Explicit types** for function parameters and returns
- **Interface over type** for object shapes
- **Generic types** for reusable components
- **No `any`** - use `unknown` or proper types

```typescript
// ✅ Good
interface UserProps {
  id: string;
  name: string;
  email: string;
}

const UserComponent: React.FC<UserProps> = ({ id, name, email }) => {
  return <div>{name}</div>;
};

// ❌ Bad
const UserComponent = (props: any) => {
  return <div>{props.name}</div>;
};
```

### React Components

- **Functional components** with hooks
- **Props interface** for each component
- **Default props** using destructuring
- **Memoization** for expensive computations
- **Error boundaries** for error handling

```typescript
// ✅ Good
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}) => {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

### CSS/Styling

- **Tailwind CSS** for utility classes
- **CSS Modules** for component-specific styles
- **CSS Custom Properties** for theming
- **Mobile-first** responsive design
- **Accessibility** considerations

```css
/* ✅ Good - Using Tailwind */
.magical-button {
  @apply bg-gradient-to-r from-magical-violet to-magical-blue;
  @apply hover:from-magical-violet-light hover:to-magical-blue-light;
  @apply text-white shadow-magical hover:shadow-magical-lg;
  @apply transition-all duration-300;
}
```

### File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── exercise/        # Feature-specific components
├── hooks/               # Custom React hooks
├── context/             # React context providers
├── services/            # API and external services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── pages/               # Page components
```

### Naming Conventions

- **Components**: PascalCase (`Button.tsx`)
- **Hooks**: camelCase with `use` prefix (`useSound.ts`)
- **Types**: PascalCase (`ButtonProps`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)
- **Files**: kebab-case for utilities (`api-service.ts`)

---

## 🧪 Testing Guidelines

### Unit Tests

- **Jest** + **React Testing Library**
- **Coverage** minimum 80%
- **Test files** alongside source files
- **Descriptive test names**

```typescript
// ✅ Good
describe('Button Component', () => {
  it('should render with correct variant class', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

- **Playwright** for end-to-end testing
- **Critical user paths** covered
- **Cross-browser** testing
- **Visual regression** testing

### Accessibility Tests

- **axe-core** for accessibility testing
- **Keyboard navigation** testing
- **Screen reader** compatibility
- **Color contrast** validation

---

## 💬 Commit Guidelines

We follow **Conventional Commits**:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Examples

```bash
# ✅ Good
git commit -m "feat(button): add magical variant with particle effects"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(button): add comprehensive test coverage"

# ❌ Bad
git commit -m "fix stuff"
git commit -m "update"
git commit -m "wip"
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Run all tests**:
   ```bash
   npm run test:coverage
   npm run e2e:test
   npm run test:a11y
   ```

2. **Check code quality**:
   ```bash
   npm run lint
   npm run format:check
   npm run type-check
   ```

3. **Update documentation** if needed

4. **Squash commits** if necessary

### PR Template

```markdown
## 📝 Description
Brief description of changes

## 🎯 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## 🧪 Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Accessibility tests pass
- [ ] Manual testing completed

## 📸 Screenshots (if applicable)
Add screenshots for UI changes

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No console errors
- [ ] Performance impact considered
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Address feedback** and update PR
4. **Merge** when approved

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
## 🐛 Bug Description
Clear description of the bug

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## ✅ Expected Behavior
What should happen

## ❌ Actual Behavior
What actually happens

## 📸 Screenshots
If applicable

## 🖥️ Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

## 📱 Additional Context
Any other context about the problem
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
## 💡 Feature Description
Clear description of the feature

## 🎯 Problem Statement
What problem does this solve?

## 💭 Proposed Solution
How should this work?

## 🔄 Alternative Solutions
Other approaches considered

## 📊 Impact Assessment
- User impact
- Performance impact
- Development effort
- Maintenance cost
```

---

## 🏆 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Project documentation**

---

## 📞 Getting Help

- **Discussions**: GitHub Discussions
- **Issues**: GitHub Issues
- **Discord**: [Join our community](#)
- **Email**: contributors@revedkids.com

---

## 🙏 Thank You

Thank you for contributing to RevEd Kids! Your contributions help make education more magical and accessible for children worldwide.

---

<div align="center">

**Made with ❤️ for children's education**

[Back to top](#-contributing-to-reved-kids)

</div> 