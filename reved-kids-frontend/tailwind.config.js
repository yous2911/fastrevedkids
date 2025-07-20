/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🌈 PALETTE MAGIQUE POUR LES 6-12 ANS
        
        // Couleurs principales - Arc-en-ciel magique
        magical: {
          // Violet mystique
          violet: '#8A2BE2',        // Violet électrique principal
          'violet-light': '#B57EDC',  // Violet doux
          'violet-glow': '#E6D8FF',   // Lueur violette
          
          // Bleu enchantement
          blue: '#00BFFF',          // Bleu ciel électrique
          'blue-light': '#87CEEB',    // Bleu ciel doux
          'blue-glow': '#E0F6FF',     // Lueur bleue
          
          // Vert nature magique
          green: '#00FF7F',          // Vert lime néon
          'green-light': '#98FB98',    // Vert menthe
          'green-glow': '#F0FFF0',    // Lueur verte
          
          // Jaune soleil
          yellow: '#FFD700',          // Or brillant
          'yellow-light': '#FFFF99',  // Jaune pastel
          'yellow-glow': '#FFFACD',   // Lueur dorée
          
          // Orange énergie
          orange: '#FF8C00',          // Orange mandarine
          'orange-light': '#FFA500',  // Orange doux
          'orange-glow': '#FFF8DC',   // Lueur orangée
          
          // Rose bonheur
          pink: '#FF69B4',            // Rose bonbon
          'pink-light': '#FFB6C1',    // Rose doux
          'pink-glow': '#FFF0F5',     // Lueur rose
          
          // Cyan étincelle
          cyan: '#00FFFF',            // Cyan néon
          'cyan-light': '#AFEEEE',    // Cyan doux
          'cyan-glow': '#F0FFFF',     // Lueur cyan
        },

        // Couleurs de feedback amplifiées (basées sur la palette magique)
        success: {
          50: '#F0FFF4',   // Vert très clair
          100: '#C6F6D5',  // Vert clair
          200: '#9AE6B4',  // Vert léger
          300: '#68D391',  // Vert moyen
          400: '#48BB78',  // Vert vif
          500: '#00FF7F',  // VERT LIME NÉON ⭐ SUCCESS
          600: '#38A169',  // Vert foncé
          700: '#2F855A',  // Vert profond
          800: '#276749',  // Vert sombre
          900: '#22543D',  // Vert très sombre
          'glow': '#00FF7F', // Pour les effets de lueur
        },

        fun: {
          50: '#FFF5F5',   // Rose très clair
          100: '#FED7D7',  // Rose clair
          200: '#FBB6CE',  // Rose léger
          300: '#F687B3',  // Rose moyen
          400: '#ED64A6',  // Rose vif
          500: '#FF69B4',  // ROSE BONBON ⭐ FUN
          600: '#D53F8C',  // Rose foncé
          700: '#B83280',  // Rose profond
          800: '#97266D',  // Rose sombre
          900: '#702459',  // Rose très sombre
        },

        energy: {
          50: '#FFFAF0',   // Orange très clair
          100: '#FEEBC8',  // Orange clair
          200: '#FBD38D',  // Orange léger
          300: '#F6AD55',  // Orange moyen
          400: '#ED8936',  // Orange vif
          500: '#FF8C00',  // ORANGE MANDARINE ⭐ ENERGY
          600: '#C05621',  // Orange foncé
          700: '#9C4221',  // Orange profond
          800: '#7B341E',  // Orange sombre
          900: '#652B19',  // Orange très sombre
        },
        
        // Couleurs spéciales pour éléments magiques
        crystal: {
          light: '#E6E6FA',    // Lavande claire pour cristaux
          medium: '#DDA0DD',   // Prune pour cristaux moyens
          dark: '#9370DB',     // Violet moyen pour cristaux sombres
          glow: '#F8F8FF',     // Blanc fantôme pour lueurs
        },

        sparkle: {
          gold: '#FFD700',     // Or pour étincelles
          silver: '#C0C0C0',   // Argent pour étincelles
          rainbow: '#FF69B4',  // Base pour étincelles arc-en-ciel
        },

        // Neutres doux (pour ne pas écraser les couleurs vives)
        neutral: {
          50: '#FAFAFA',   // Blanc très doux
          100: '#F5F5F5',  // Gris très clair
          200: '#EEEEEE',  // Gris clair
          300: '#E0E0E0',  // Gris léger
          400: '#BDBDBD',  // Gris moyen
          500: '#9E9E9E',  // Gris principal
          600: '#757575',  // Gris foncé
          700: '#616161',  // Gris profond
          800: '#424242',  // Gris sombre
          900: '#212121',  // Gris très sombre
        },
      },

      // 🎭 ANIMATIONS MAGIQUES SPÉCIALES
      animation: {
        // Cristaux et XP magiques
        'crystal-float': 'crystalFloat 3s ease-in-out infinite',
        'crystal-collect': 'crystalCollect 0.8s ease-out forwards',
        'xp-sparkle': 'xpSparkle 1.2s ease-out forwards',
        'level-up-magic': 'levelUpMagic 2s ease-out forwards',
        
        // Mascotte Sparky
        'sparky-idle': 'sparkyIdle 4s ease-in-out infinite',
        'sparky-happy': 'sparkyHappy 1s ease-out',
        'sparky-think': 'sparkyThink 2s ease-in-out infinite',
        'sparky-oops': 'sparkyOops 0.8s ease-out',
        
        // Effets magiques généraux
        'rainbow-pulse': 'rainbowPulse 3s ease-in-out infinite',
        'magical-glow': 'magicalGlow 2s ease-in-out infinite alternate',
        'twinkle': 'twinkle 1.5s ease-in-out infinite',
        'bounce-happy': 'bounceHappy 0.6s ease-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
        
        // Feedback utilisateur
        'success-explosion': 'successExplosion 1s ease-out',
        'error-shake': 'errorShake 0.5s ease-in-out',
        'button-magical': 'buttonMagical 0.3s ease-out',
        
        // Transitions de page
        'portal-in': 'portalIn 0.8s ease-out',
        'portal-out': 'portalOut 0.6s ease-in',
        'slide-magical': 'slideMagical 0.5s ease-out',
        
        // Effets speciaux
        'confetti-fall': 'confettiFall 3s ease-out infinite',
        'star-twinkle': 'starTwinkle 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
      },

      // 🔮 KEYFRAMES MAGIQUES
      keyframes: {
        // Cristaux et XP
        crystalFloat: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)',
            filter: 'brightness(1)'
          },
          '50%': { 
            transform: 'translateY(-10px) rotate(180deg)',
            filter: 'brightness(1.2)'
          },
        },
        crystalCollect: {
          '0%': { 
            transform: 'translateY(0) scale(1)',
            opacity: '1'
          },
          '50%': {
            transform: 'translateY(-50px) scale(1.2)',
            opacity: '0.8'
          },
          '100%': {
            transform: 'translateY(-100px) scale(0.5)',
            opacity: '0'
          },
        },
        xpSparkle: {
          '0%': { 
            transform: 'scale(0) rotate(0deg)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.5) rotate(180deg)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(1) rotate(360deg)',
            opacity: '1'
          },
        },
        levelUpMagic: {
          '0%': { 
            transform: 'scale(1)',
            filter: 'brightness(1) saturate(1)'
          },
          '25%': {
            transform: 'scale(1.1)',
            filter: 'brightness(1.5) saturate(1.5)'
          },
          '50%': {
            transform: 'scale(1.05)',
            filter: 'brightness(1.8) saturate(2)'
          },
          '100%': {
            transform: 'scale(1)',
            filter: 'brightness(1) saturate(1)'
          },
        },

        // Animations Sparky
        sparkyIdle: {
          '0%, 100%': { 
            transform: 'translateY(0px) scale(1)',
            rotate: '0deg'
          },
          '25%': {
            transform: 'translateY(-5px) scale(1.02)',
          },
          '75%': {
            transform: 'translateY(-3px) scale(0.98)',
            rotate: '2deg'
          },
        },
        sparkyHappy: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.2) rotate(-5deg)' },
          '50%': { transform: 'scale(1.1) rotate(5deg)' },
          '75%': { transform: 'scale(1.15) rotate(-3deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        sparkyThink: {
          '0%, 100%': { 
            transform: 'rotate(0deg)',
            filter: 'brightness(1)'
          },
          '50%': { 
            transform: 'rotate(5deg)',
            filter: 'brightness(1.1)'
          },
        },
        sparkyOops: {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px) rotate(-2deg)' },
          '75%': { transform: 'translateX(5px) rotate(2deg)' },
          '100%': { transform: 'translateX(0) rotate(0deg)' },
        },

        // Effets magiques
        rainbowPulse: {
          '0%': { 
            background: 'linear-gradient(45deg, #8A2BE2, #00BFFF)',
            transform: 'scale(1)'
          },
          '25%': { 
            background: 'linear-gradient(45deg, #00BFFF, #00FF7F)',
            transform: 'scale(1.05)'
          },
          '50%': { 
            background: 'linear-gradient(45deg, #00FF7F, #FFD700)',
            transform: 'scale(1.1)'
          },
          '75%': { 
            background: 'linear-gradient(45deg, #FFD700, #FF8C00)',
            transform: 'scale(1.05)'
          },
          '100%': { 
            background: 'linear-gradient(45deg, #FF8C00, #8A2BE2)',
            transform: 'scale(1)'
          },
        },
        magicalGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(138, 43, 226, 0.5)',
            filter: 'brightness(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(138, 43, 226, 0.8)',
            filter: 'brightness(1.2)'
          },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        bounceHappy: {
          '0%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-15px)' },
          '50%': { transform: 'translateY(0)' },
          '75%': { transform: 'translateY(-8px)' },
          '100%': { transform: 'translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },

        // Feedback
        successExplosion: {
          '0%': { 
            transform: 'scale(1)',
            opacity: '1',
            filter: 'brightness(1)'
          },
          '50%': {
            transform: 'scale(1.3)',
            opacity: '0.8',
            filter: 'brightness(1.5)'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
            filter: 'brightness(1)'
          },
        },
        errorShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px)' },
        },
        buttonMagical: {
          '0%': { 
            transform: 'scale(1)',
            boxShadow: '0 4px 15px rgba(138, 43, 226, 0.2)'
          },
          '100%': { 
            transform: 'scale(1.05)',
            boxShadow: '0 8px 25px rgba(138, 43, 226, 0.4)'
          },
        },

        // Transitions
        portalIn: {
          '0%': { 
            transform: 'scale(0) rotate(180deg)',
            opacity: '0',
            filter: 'blur(10px)'
          },
          '50%': {
            transform: 'scale(1.1) rotate(90deg)',
            opacity: '0.7',
            filter: 'blur(5px)'
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: '1',
            filter: 'blur(0px)'
          },
        },
        portalOut: {
          '0%': { 
            transform: 'scale(1) rotate(0deg)',
            opacity: '1',
            filter: 'blur(0px)'
          },
          '100%': {
            transform: 'scale(0) rotate(-180deg)',
            opacity: '0',
            filter: 'blur(10px)'
          },
        },
        slideMagical: {
          '0%': { 
            transform: 'translateX(-100%) scale(0.8)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1'
          },
        },

        // Effets speciaux
        confettiFall: {
          '0%': { 
            transform: 'translateY(-100vh) rotate(0deg)',
            opacity: '1'
          },
          '100%': {
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0'
          },
        },
        starTwinkle: {
          '0%, 100%': { 
            transform: 'scale(1) rotate(0deg)',
            opacity: '0.8'
          },
          '50%': {
            transform: 'scale(1.3) rotate(180deg)',
            opacity: '1'
          },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },

      // 🎨 TYPOGRAPHIE ENFANTINE
      fontFamily: {
        'magical': ['Comic Neue', 'Comic Sans MS', 'cursive'], // Police principale enfantine
        'display': ['Fredoka One', 'Comic Neue', 'cursive'],    // Titres magiques
        'sans': ['Nunito', 'system-ui', 'sans-serif'],          // Texte lisible
        'mono': ['JetBrains Mono', 'monospace'],                // Code (si nécessaire)
      },

      // 🌟 ESPACEMENT MAGIQUE
      spacing: {
        '18': '4.5rem',    // 72px
        '22': '5.5rem',    // 88px
        '88': '22rem',     // 352px
        '128': '32rem',    // 512px
        'magical': '1.5rem', // Espacement spécial magique
      },

      // ✨ OMBRES MAGIQUES
      boxShadow: {
        'magical': '0 8px 32px rgba(138, 43, 226, 0.3), 0 4px 16px rgba(0, 191, 255, 0.2)',
        'magical-lg': '0 16px 48px rgba(138, 43, 226, 0.4), 0 8px 24px rgba(0, 255, 127, 0.3)',
        'crystal': '0 4px 20px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
        'sparkle': '0 0 20px rgba(255, 105, 180, 0.6), 0 0 40px rgba(255, 105, 180, 0.3)',
        'success-glow': '0 0 30px rgba(0, 255, 127, 0.5)',
        'fun-glow': '0 0 30px rgba(255, 105, 180, 0.5)',
        'energy-glow': '0 0 30px rgba(255, 140, 0, 0.5)',
      },

      // 🔮 RAYONS DE COURBURE MAGIQUES
      borderRadius: {
        'magical': '1.5rem',    // Coins arrondis magiques
        'crystal': '0.75rem',   // Coins cristallins
        'bubble': '50%',        // Bulles parfaites
      },

      // 📱 BREAKPOINTS ADAPTÉS ENFANTS
      screens: {
        'xs': '475px',      // Petits téléphones
        'sm': '640px',      // Tablettes portrait
        'md': '768px',      // Tablettes paysage
        'lg': '1024px',     // Écrans moyens
        'xl': '1280px',     // Grands écrans
        '2xl': '1536px',    // Très grands écrans
      },

      // 🎪 TAILLES SPÉCIALES
      width: {
        'magical': '20rem',     // Largeur magique standard
        'sparky': '8rem',       // Taille de Sparky
        'crystal': '3rem',      // Taille des cristaux
      },
      height: {
        'magical': '12rem',     // Hauteur magique standard
        'sparky': '8rem',       // Taille de Sparky
        'crystal': '3rem',      // Taille des cristaux
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}; 