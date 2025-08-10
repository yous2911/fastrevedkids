// ==========================================
// GESTIONNAIRE AUDIO CP 2025
// ==========================================

export class CP2025AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private competenceAudios: Record<string, string[]> = {
    'CP.FR.L1.1': ['cgp_periode_1', 'voyelles_base', 'consonnes_simples'],
    'CP.FR.E1.1': ['cursive_reglure', 'formation_lettres', 'liaison_cursive'],
    'CP.MA.N1.1': ['nombres_0_10', 'denombrement', 'chiffres_formation']
  };
  
  constructor() {
    this.preloadCompetenceSounds();
  }

  private preloadCompetenceSounds() {
    // Sons génériques
    const GENERAL_SOUNDS = [
      'intro_seance', 'bravo_competence', 'validation_cp2025', 'encouragement',
      'pression_parfaite', 'pression_forte', 'pression_legere', 'stylet_detecte',
      'inclinaison_correcte', 'fluidite_excellente', 'precision_parfaite',
      'utilise_stylet', 'trace_plus_long', 'encore_effort'
    ];
    
    // Sons par compétence
    Object.values(this.competenceAudios).flat().forEach(audioKey => {
      GENERAL_SOUNDS.push(audioKey);
    });
    
    // Sons phonétiques
    const PHONEMES = ['a', 'i', 'o', 'u', 'e', 'l', 'm', 'n', 'r', 's', 't', 'p'];
    PHONEMES.forEach(phoneme => {
      GENERAL_SOUNDS.push(`phoneme_${phoneme}`);
    });
    
    GENERAL_SOUNDS.forEach(key => {
      const audio = new Audio(`/sounds/cp2025/${key}.mp3`);
      audio.preload = 'auto';
      this.audioCache.set(key, audio);
    });
  }

  async playCompetenceIntro(competenceCode: string): Promise<void> {
    const audios = this.competenceAudios[competenceCode] || [];
    if (audios.length > 0) {
      await this.playSound(audios[0]);
    }
  }

  async playValidationSequence(validee: boolean, competenceCode: string): Promise<void> {
    if (validee) {
      await this.playSequence(['bravo_competence', 'validation_cp2025'], 800);
    } else {
      await this.playSequence(['encouragement', 'encore_effort'], 600);
    }
  }

  async playSound(key: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = this.audioCache.get(key);
      if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => {
          audio.addEventListener('ended', () => resolve(), { once: true });
        }).catch(() => {
          console.log(`Audio CP2025 non disponible: ${key}`);
          resolve();
        });
      } else {
        console.log(`Son CP2025 non trouvé: ${key}`);
        resolve();
      }
    });
  }

  async playSequence(keys: string[], delay: number = 500): Promise<void> {
    for (const key of keys) {
      await this.playSound(key);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
} 