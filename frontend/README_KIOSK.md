# 🔒 Kiosk Mode - Quick Start Guide

## 🚀 Getting Started

The kiosk mode feature is already integrated into your RevEd Kids app! Here's how to use it:

### **For Parents/Teachers:**

1. **Activate Kiosk Mode**: Click the "🔒 Mode Concentration" button on the dashboard
2. **Exit Kiosk Mode**: 
   - Press `Ctrl + Shift + X` three times, then enter the code
   - Or type "PARENT123" anywhere in the app

### **For Students:**

- The app works normally until kiosk mode is activated
- Once active, students can focus on learning without distractions
- Session progress and time remaining are clearly displayed

## ⚙️ Configuration

### **Environment Variables** (optional):
Create a `.env.local` file in the frontend directory:

```env
REACT_APP_KIOSK_EXIT_CODE=YOUR_CUSTOM_CODE
REACT_APP_KIOSK_SESSION_TIMEOUT=45
REACT_APP_KIOSK_AUTO_ACTIVATE=false
```

### **Customizing in Code**:
```typescript
<KioskModeProvider
  exitCode="YOUR_CODE"
  sessionTimeout={30 * 60 * 1000} // 30 minutes
  autoActivate={false}
>
```

## 📁 Files Added

- `src/hooks/useKioskMode.ts` - Main kiosk mode functionality
- `src/context/KioskModeContext.tsx` - Context provider
- `src/components/layout/FocusedLayout.tsx` - Kiosk mode UI
- `src/components/KioskModeActivator.tsx` - Activation button
- `docs/KIOSK_MODE_GUIDE.md` - Complete documentation

## 🎯 Features

- ✅ Full-screen distraction-free mode
- ✅ Keyboard and navigation blocking
- ✅ Screen wake lock (keeps screen on)
- ✅ Parental exit code protection
- ✅ Session progress tracking
- ✅ Pause/resume functionality
- ✅ Mobile and desktop support

## 🔧 Browser Support

- ✅ Chrome 69+
- ✅ Firefox 64+
- ✅ Safari 13+
- ✅ Edge 79+
- ⚠️ Mobile browsers (limited fullscreen)

## 📖 Full Documentation

See `docs/KIOSK_MODE_GUIDE.md` for complete implementation details, troubleshooting, and customization options.

---

**Ready to use!** The kiosk mode is fully integrated and ready for your educational app. 🎓 