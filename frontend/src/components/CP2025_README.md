# CP2025 Data Structure Documentation

## Overview

This document explains how to use the CP2025 data structure in your React application. The system provides type-safe interfaces for managing educational modules and exercises following the French CP2025 curriculum.

## Data Structure

### Modules
```typescript
interface CP2025Module {
  id: number;
  titre: string;
  description: string;
  niveau: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2';
  matiere: 'FRANCAIS' | 'MATHEMATIQUES' | 'SCIENCES' | 'HISTOIRE_GEOGRAPHIE' | 'ANGLAIS';
  periode: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P1-P2' | 'P3-P4' | 'P1-P3' | 'P2-P4' | 'P2-P3';
  ordre: number;
  metadata: {
    competenceDomain: string;
    cp2025: boolean;
    [key: string]: unknown;
  };
}
```

### Exercises
```typescript
interface CP2025Exercise {
  titre: string;
  consigne: string;
  type: 'QCM' | 'CALCUL' | 'DRAG_DROP' | 'TEXT_INPUT' | 'LECTURE' | 'GEOMETRIE' | 'PROBLEME';
  difficulte: 'decouverte' | 'entrainement' | 'consolidation' | 'approfondissement';
  moduleId: number;
  configuration: ExerciseConfiguration;
  metadata: {
    competenceCode: string;
    [key: string]: unknown;
  };
}
```

### Image Objects
```typescript
interface ImageObject {
  url_placeholder: string;
  description: string;
}
```

## Usage Examples

### 1. Using the Hook

```typescript
import { useCP2025Data } from '../hooks/useCP2025Data';
import { getCompleteCP2025Service } from '../utils/cp2025DataLoader';

function MyComponent() {
  // Get complete data
  const completeData = getCompleteCP2025Service();
  const cp2025Data = useCP2025Data({ 
    initialData: JSON.parse(completeData.exportData()) 
  });

  // Access data
  const { modules, exercises, statistics } = cp2025Data;
  
  // Use service methods
  const moduleExercises = cp2025Data.getExercisesByModuleId(3);
  const qcmExercises = cp2025Data.getExercisesByType('QCM');
  const discoveryExercises = cp2025Data.getExercisesByDifficulty('decouverte');
}
```

### 2. Using the Service Directly

```typescript
import { getCompleteCP2025Service } from '../utils/cp2025DataLoader';

const service = getCompleteCP2025Service();

// Get modules
const allModules = service.getModules();
const cpModules = service.getModulesByLevelAndSubject('CP', 'FRANCAIS');

// Get exercises
const moduleExercises = service.getExercisesByModuleId(3);
const progression = service.getModuleExerciseProgression(3);

// Validate competence codes
const isValid = CP2025Service.validateCompetenceCode('CP.FR.L1.3');
const parsed = CP2025Service.parseCompetenceCode('CP.FR.L1.3');
```

### 3. Loading from JSON

```typescript
import { loadCP2025FromJSON } from '../utils/cp2025DataLoader';

// From string
const service = loadCP2025FromJSON(jsonString);

// From URL
const cp2025Data = useCP2025Data({ 
  autoLoad: true, 
  dataUrl: '/api/cp2025-data' 
});
```

## Exercise Types and Configurations

### QCM Configuration (with Images)
```typescript
{
  question: string;
  choix: string[] | Array<{
    id: string; 
    image?: ImageObject; 
    text?: string
  }>;
  bonneReponse: string;
  audioRequired?: boolean;
  image_url?: string;
  image?: ImageObject;
  phrase_template?: string;
}
```

Example:
```json
{
  "question": "Où entends-tu le son [ɔ̃] ?",
  "choix": [
    {
      "id": "c1", 
      "image": { 
        "url_placeholder": "/images/words/mouton.png", 
        "description": "Un mouton blanc dans un pré vert."
      }
    },
    {
      "id": "c2", 
      "image": { 
        "url_placeholder": "/images/words/sirene.png", 
        "description": "Une sirène assise sur un rocher."
      }
    }
  ],
  "bonneReponse": "c1"
}
```

### Drag & Drop Configuration
```typescript
{
  question: string;
  dragItems: Array<{id: string; content: string}>;
  zones: Array<{id: string; label: string; limit?: number}>;
  solution: string[] | Record<string, string[]>;
}
```

### Calcul Configuration
```typescript
{
  operation: string;
  resultat: number;
  question?: string;
  aide?: string;
}
```

### Text Input Configuration
```typescript
{
  question: string;
  inputType: 'keyboard' | 'clickable_letters';
  bonneReponse: string | string[];
  audioRequired?: boolean;
  lettres?: string[];
}
```

### Geometry Configuration (with Images)
```typescript
{
  question: string;
  image_url?: string;
  image?: ImageObject;
  bonneReponse: string;
}
```

## Complete Dataset Structure

Your complete CP2025 dataset includes:

### Modules (10 modules)
1. **Français CP - Lecture Période 1 & 2** (ID: 1)
2. **Mathématiques CP - Nombres et Calculs Période 1 & 2** (ID: 2)
3. **Français CP - Graphèmes et Sons Complexes** (ID: 3)
4. **Mathématiques CP - Nombres > 60 et Mesures** (ID: 4)
5. **Français CP - Maîtrise et Automatisation** (ID: 5)
6. **Mathématiques CP - Vers la Multiplication et les Données** (ID: 6)
7. **Français CP - Logique et Raisonnement** (ID: 7)
8. **Mathématiques CP - Stratégies de Résolution** (ID: 8)
9. **Français - Pont vers le CE1** (ID: 9) ⭐ **BRIDGE**
10. **Mathématiques - Pont vers le CE1** (ID: 10) ⭐ **BRIDGE**

### Exercise Types
- **QCM**: Multiple choice questions with text, images, audio, or combinations
- **CALCUL**: Mathematical operations and problem solving
- **DRAG_DROP**: Drag and drop exercises for word/syllable assembly
- **TEXT_INPUT**: Text input exercises for writing numbers/words

### Advanced Features
- **Audio Support**: QCM choices can include audio files for pronunciation
- **Help Text**: All exercise types support `aide` field for guidance
- **Complex Images**: Rich image descriptions and multiple image choices
- **True/False Logic**: Advanced reasoning exercises with true/false questions
- **Multi-step Problems**: Complex mathematical problems requiring multiple operations
- **Inference Exercises**: Advanced comprehension requiring logical deduction
- **Grammar Analysis**: Drag-and-drop exercises for grammatical categorization
- **Multiline Text Input**: Support for story writing and complex text responses
- **Bridge Modules**: Transition modules connecting CP to CE1 curriculum
- **Conjugation Exercises**: Introduction to verb conjugation patterns
- **Homophone Mastery**: Advanced spelling with grammatical homophones
- **Written Operations**: Introduction to column addition and subtraction
- **Time Reading**: Advanced clock reading (half-hours, quarter-hours)
- **Symmetry Concepts**: Introduction to geometric symmetry

### Difficulty Levels
- **decouverte**: Discovery level (basic concepts)
- **entrainement**: Training level (practice)
- **consolidation**: Consolidation level (mastery)

## Competence Codes

Competence codes follow the format: `[NIVEAU].[MATIERE].[DOMAINE][NUMERO].[COMPETENCE]`

Examples from your data:
- `CP.FR.L1.1` - CP Français Lecture Période 1 Compétence 1
- `CP.FR.L1.3` - CP Français Lecture Période 1 Compétence 3 (sons complexes)
- `CP.MA.N1.4` - CP Mathématiques Nombres Période 1 Compétence 4 (grands nombres)
- `CP.FR.G1.3` - CP Français Grammaire Période 1 Compétence 3 (singulier/pluriel)

## Statistics

The service provides comprehensive statistics:

```typescript
const stats = service.getStatistics();
// Returns:
{
  totalModules: number;           // 10
  totalExercises: number;         // 70+
  exercisesByDifficulty: Record<Difficulte, number>;
  exercisesByType: Record<TypeExercice, number>;
  modulesByLevel: Record<NiveauScolaire, number>;
  modulesBySubject: Record<Matiere, number>;
}
```

## Integration with Your JSON Data

Your complete JSON structure is fully compatible with this system. The system includes:

### Enhanced Features
- **Image Support**: Full support for image objects with descriptions
- **Multiple Periods**: Support for combined periods (P1-P2, P2-P3, P3-P4)
- **Rich Configurations**: Support for phrase templates, audio requirements, and complex choice structures
- **Type Safety**: Complete TypeScript support for all data structures

### Quick Start
```typescript
import { getCompleteCP2025Service } from '../utils/cp2025DataLoader';

// Get the complete service with all your data
const service = getCompleteCP2025Service();

// Access modules and exercises
const modules = service.getModules();
const exercises = service.getExercises();

// Filter by specific criteria
const frenchExercises = service.getExercisesByCompetenceCode('CP.FR.L1.3');
const mathExercises = service.getExercisesByType('CALCUL');
const discoveryExercises = service.getExercisesByDifficulty('decouverte');
```

## Type Safety

All interfaces are fully typed, providing:
- Autocomplete in your IDE
- Compile-time error checking
- Runtime validation
- Type guards for safe data handling

## Best Practices

1. **Always validate data** before using it
2. **Use the hook** for React components
3. **Use the service** for utility functions
4. **Leverage TypeScript** for type safety
5. **Follow the competence code format** for consistency
6. **Use image objects** for rich visual content
7. **Include descriptions** for accessibility

## File Structure

```
frontend/src/
├── types/index.ts                    # Type definitions
├── services/cp2025.service.ts        # Service class
├── hooks/useCP2025Data.tsx          # React hook
├── utils/cp2025DataLoader.ts        # Data loading utilities
├── components/
│   ├── CP2025Demo.tsx               # Basic demo
│   ├── CP2025ExtendedDemo.tsx       # Extended demo with images
│   └── CP2025_README.md             # This documentation
``` 