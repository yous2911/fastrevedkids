# Frontend Public Directory Structure

This directory contains all static assets for the RevEd Kids frontend application.

## 📁 Directory Structure

```
frontend/public/
├── index.html              # Main HTML template
├── manifest.json           # PWA manifest
├── favicon.ico             # App favicon
├── logo192.png             # App logo (192x192)
├── logo512.png             # App logo (512x512)
├── robots.txt              # Search engine directives
├── sounds/                 # Sound effects directory
│   ├── sparky/            # Sparky mascot sounds
│   │   ├── sparky_happy.mp3
│   │   ├── sparky_excited.mp3
│   │   ├── sparky_thinking.mp3
│   │   ├── sparky_celebrating.mp3
│   │   ├── sparky_encouraging.mp3
│   │   ├── sparky_surprised.mp3
│   │   └── sparky_giggle.mp3
│   ├── buttons/           # Button interaction sounds
│   │   ├── button_click.mp3
│   │   ├── button_hover.mp3
│   │   ├── button_success.mp3
│   │   ├── button_error.mp3
│   │   ├── button_magical.mp3
│   │   └── button_soft.mp3
│   ├── xp/                # XP and achievement sounds
│   │   ├── xp_gain.mp3
│   │   ├── level_up.mp3
│   │   ├── achievement_unlock.mp3
│   │   ├── bonus_points.mp3
│   │   ├── streak_bonus.mp3
│   │   └── badge_earned.mp3
│   ├── feedback/          # Learning feedback sounds
│   │   ├── correct_answer.mp3
│   │   ├── incorrect_answer.mp3
│   │   ├── perfect_score.mp3
│   │   ├── good_job.mp3
│   │   ├── try_again.mp3
│   │   └── excellent.mp3
│   ├── exercises/         # Exercise-specific sounds
│   │   ├── exercise_start.mp3
│   │   ├── exercise_complete.mp3
│   │   ├── hint_available.mp3
│   │   ├── timer_warning.mp3
│   │   ├── question_appear.mp3
│   │   └── answer_submit.mp3
│   ├── portal/            # Navigation and magical effects
│   │   ├── portal_open.mp3
│   │   ├── portal_close.mp3
│   │   ├── page_transition.mp3
│   │   ├── section_unlock.mp3
│   │   └── magic_sparkle.mp3
│   ├── ambient/           # Background ambience
│   │   ├── forest.mp3
│   │   ├── ocean.mp3
│   │   └── magical.mp3
│   └── ui/                # UI interaction sounds
│       ├── notification.mp3
│       ├── popup_open.mp3
│       ├── popup_close.mp3
│       ├── typing.mp3
│       ├── swipe.mp3
│       ├── toggle_on.mp3
│       └── toggle_off.mp3
├── images/                # Image assets
│   ├── sparky/            # Sparky mascot images
│   │   ├── sparky-happy.png
│   │   ├── sparky-excited.png
│   │   ├── sparky-thinking.png
│   │   ├── sparky-celebrating.png
│   │   ├── sparky-waving.png
│   │   └── sparky-sleeping.png
│   ├── backgrounds/       # Background images
│   │   ├── magical-forest.jpg
│   │   ├── underwater-world.jpg
│   │   ├── space-adventure.jpg
│   │   └── rainbow-land.jpg
│   ├── ui/                # UI elements
│   │   ├── buttons/
│   │   ├── icons/
│   │   ├── badges/
│   │   └── decorations/
│   └── exercises/         # Exercise-related images
│       ├── math/
│       ├── science/
│       ├── reading/
│       └── general/
├── icons/                 # PWA and app icons
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── sparky-icon-192.png
│   ├── sparky-icon-512.png
│   ├── learn-shortcut.png
│   ├── progress-shortcut.png
│   └── games-shortcut.png
├── screenshots/           # PWA screenshots
│   ├── home-screen.png
│   └── exercise-screen.png
└── fonts/                 # Custom fonts (if any)
    └── magical-fonts/
```

## 🎵 Sound Requirements

### File Format Guidelines
- **Format**: MP3 (preferred) or OGG for web compatibility
- **Quality**: 128-192 kbps for smaller file sizes
- **Duration**: 
  - UI sounds: 0.1-0.5 seconds
  - Sparky sounds: 0.5-2 seconds
  - Ambient sounds: 30+ seconds (looped)
- **Volume**: Normalized to prevent clipping

### Sound Categories

#### 🎭 Sparky Mascot (7 sounds)
Character-driven sounds that give personality to the mascot.

#### 🎮 Button Interactions (6 sounds)
Short, crisp sounds for user interface interactions.

#### ⭐ XP & Achievements (6 sounds)
Celebratory sounds for progression and accomplishments.

#### 🎯 Learning Feedback (6 sounds)
Educational feedback sounds that are encouraging and supportive.

#### 📚 Exercise Events (6 sounds)
Context-specific sounds for learning activities.

#### 🌟 Portal & Navigation (5 sounds)
Magical transition and navigation sounds.

#### 🎵 Ambient Sounds (3 sounds)
Background atmosphere for different themes.

#### 🔊 UI Interactions (7 sounds)
General interface interaction sounds.

## 🖼️ Image Requirements

### Image Format Guidelines
- **Format**: PNG for icons and graphics with transparency
- **Format**: JPG for photographs and backgrounds
- **Format**: SVG for scalable icons (when possible)
- **Resolution**: Multiple sizes for responsive design
- **Compression**: Optimized for web without quality loss

### Sparky Mascot Images
High-quality character illustrations showing different emotions and states.

### Background Images
Themed background images for different learning environments.

## 📱 PWA Assets

### Required Icons
- Favicon: 16x16, 32x32, 48x48
- App Icons: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Maskable Icons: 192x192, 512x512

### Screenshots
- Home screen showcase
- Exercise interface examples
- Different device orientations

## 🚀 Performance Considerations

### Sound Optimization
- Preload critical sounds (buttons, feedback)
- Lazy load ambient and optional sounds
- Use audio sprites for small sounds when possible
- Implement audio caching strategy

### Image Optimization
- Use responsive images with srcset
- Implement lazy loading for non-critical images
- Use WebP format where supported
- Optimize images with tools like imagemin

## 📂 File Naming Conventions

### Sounds
- Use lowercase with underscores: `sparky_happy.mp3`
- Include category prefix when needed
- Keep names descriptive but concise

### Images
- Use lowercase with hyphens: `sparky-happy.png`
- Include size suffix when needed: `logo-192.png`
- Use descriptive names for content

## 🔧 Development Notes

### Adding New Sounds
1. Add audio file to appropriate category folder
2. Update `soundConfig.ts` with new sound definition
3. Test on different devices and browsers
4. Ensure proper volume levels

### Adding New Images
1. Optimize image before adding
2. Consider multiple formats/sizes if needed
3. Update relevant React components
4. Test responsive behavior

### Testing Checklist
- [ ] All sounds play correctly across browsers
- [ ] Images load properly and are optimized
- [ ] PWA icons display correctly
- [ ] Manifest is valid
- [ ] Service worker caches assets properly

## 📝 License and Attribution

Remember to ensure all audio and image assets have proper licensing for commercial use if applicable. Document any third-party assets and their license requirements. 