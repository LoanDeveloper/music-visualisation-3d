# Music Visualisation 3D - Documentation Claude

## Vue d'ensemble du projet

Application web React de visualisation 3D musicale en temps réel. L'utilisateur upload un fichier audio et voit un système de particules dynamiques qui réagit aux fréquences audio (basses, médiums, aigus).

**Technologies principales :**
- React 18 avec Vite
- Three.js (pure, sans React Three Fiber)
- Web Audio API

**Fonctionnalités clés :**
- Système de 10 000 particules réactives aux fréquences
- 5 thèmes de couleurs (neon, sunset, ocean, fire, pastel)
- Contrôles de lecture audio complets
- Rotation de caméra interactive (souris/tactile)
- Mode plein écran
- Raccourcis clavier (Space, F, 1-5)

## Architecture technique

### Pipeline Audio → Visuel

```
Fichier Audio
    ↓
AudioContext + AnalyserNode (FFT 2048)
    ↓
Extraction fréquences (Uint8Array 0-255)
    ↓
Traitement par bandes (audioProcessor.js)
    ├─ Bass (20-250Hz)    → Scale des particules
    ├─ Mid (250-4kHz)     → Vélocité/rotation
    └─ High (4k-20kHz)    → Intensité couleurs
    ↓
Mise à jour ParticleSystem (BufferGeometry)
    ↓
Rendu Three.js (60 FPS)
```

### Structure des dossiers

```
src/
├── components/              # Composants React UI
│   ├── AudioUploader.jsx    # Upload fichier (drag-drop + validation)
│   ├── ControlPanel.jsx     # Play/pause, progress bar, volume
│   ├── ThemeSelector.jsx    # Boutons sélection thèmes
│   ├── FullscreenButton.jsx # Toggle fullscreen
│   └── VisualizerCanvas.jsx # Wrapper canvas Three.js
│
├── core/                    # Logique Three.js (classes pures)
│   ├── AudioAnalyzer.js     # Web Audio API wrapper
│   ├── ParticleSystem.js    # Gestion 10k particules
│   ├── CameraController.js  # Contrôles orbitaux souris
│   └── ThreeScene.js        # Orchestration scene/renderer/camera
│
├── hooks/                   # Hooks React personnalisés
│   ├── useThreeScene.js     # Lifecycle Three.js + resize
│   └── useAudioAnalysis.js  # Boucle analyse audio + sync scene
│
├── utils/                   # Utilitaires purs
│   ├── audioProcessor.js    # Traitement FFT → bass/mid/high
│   ├── colorPalettes.js     # Définitions 5 thèmes + interpolation
│   └── performanceMonitor.js# Suivi FPS + adaptive quality
│
├── App.jsx                  # Composant principal, state management
└── App.css                  # Styles globaux
```

## Concepts clés

### 1. Système de Particules (ParticleSystem.js)

**Initialisation :**
- 10 000 particules en distribution sphérique
- BufferGeometry avec attributs `position` et `color` (Float32Array)
- PointsMaterial avec vertexColors + additive blending

**Update logique :**
```javascript
// Dans ParticleSystem.update(frequencyBands)
for (each particle) {
  // Bass → expansion radiale
  radialOffset = bass * 50 * sin(time + index)

  // Mid → mouvement additionnel
  movement = mid * 20 * velocity[i]

  // High → intensité couleur
  color = lerpColor(primary, accent, intensity) * (1 + high * 0.5)
}
```

**Optimisations critiques :**
- Uniquement `position.needsUpdate` et `color.needsUpdate` (pas toute la geometry)
- Pas de création/destruction d'objets dans la boucle
- Vertex colors GPU-accelerated

### 2. Audio Analysis (AudioAnalyzer.js + audioProcessor.js)

**Web Audio API Setup :**
```javascript
AudioContext → AnalyserNode (fftSize: 2048, smoothing: 0.8)
               ↓
MediaElementSource (audio element)
               ↓
Destination (speakers)
```

**Bandes de fréquences (1024 bins) :**
- Bass: indices 0-85 (~20-250 Hz)
- Mid: indices 85-512 (~250-4000 Hz)
- High: indices 512-1024 (~4000-20000 Hz)

**Smoothing temporel :**
```javascript
smoothed = previous * 0.7 + current * 0.3
```

### 3. Contrôles Caméra (CameraController.js)

**Mode orbital :**
- Position caméra en coordonnées sphériques
- Damping (factor 0.1) pour mouvement fluide
- Rotation souris : deltaX → rotation.y, deltaY → rotation.x
- Zoom molette : ajuste distance (100-500)

**Touch support :**
- 1 doigt = rotation
- Pinch zoom à implémenter si besoin

### 4. Gestion des Thèmes (colorPalettes.js)

**Structure palette :**
```javascript
{
  name: 'Neon',
  primary: [0.0, 1.0, 1.0],    // RGB normalisé 0-1
  secondary: [1.0, 0.0, 1.0],
  accent: [0.0, 1.0, 0.0],
  background: 0x000000          // Hex pour Three.js
}
```

**Interpolation couleurs :**
```javascript
getIntensityColor(palette, intensity)
  // intensity 0-0.5 : primary → secondary
  // intensity 0.5-1 : secondary → accent
```

## Flux de données React

```
App.jsx (state)
  ├─ audioUrl, audioName, currentTheme
  ├─ audioRef (HTMLAudioElement)
  └─ sceneRef (ThreeScene instance)
      ↓
VisualizerCanvas → useThreeScene → ThreeScene
      ↓
useAudioAnalysis → AudioAnalyzer → sceneRef.updateFrequencyBands()
      ↓
ThreeScene.animate() → ParticleSystem.update(frequencyBands)
```

**Événements clés :**
1. User upload fichier → `handleFileSelect` → audioUrl state
2. AudioRef ready → `useAudioAnalysis.initialize()`
3. User click play → audio.play event → `startAnalysis()`
4. RAF loop → `AudioAnalyzer.getFrequencyBands()` → `ThreeScene.updateFrequencyBands()`
5. ThreeScene RAF loop → `ParticleSystem.update()` → render

## Conventions de code

### Naming
- **Classes Three.js** : PascalCase (ParticleSystem, ThreeScene)
- **Hooks React** : camelCase avec préfixe "use" (useThreeScene)
- **Composants React** : PascalCase (AudioUploader)
- **Utilitaires** : camelCase (audioProcessor)

### Structure fichiers
- **Classes** : Export default de la classe
- **Hooks** : Export named + export default
- **Utils** : Export named functions
- **Components** : Export default + CSS séparé

### Gestion mémoire
**TOUJOURS cleanup dans les classes :**
```javascript
destroy() {
  // Disconnect audio nodes
  // Dispose Three.js geometries/materials
  // Remove event listeners
  // Clear references (= null)
}
```

**TOUJOURS cleanup dans useEffect :**
```javascript
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
  }
}, [deps])
```

## Comment modifier le projet

### Ajouter un nouveau thème

1. **Éditer `src/utils/colorPalettes.js` :**
```javascript
export const palettes = {
  // ... thèmes existants
  myTheme: {
    name: 'My Theme',
    primary: [r, g, b],      // 0-1
    secondary: [r, g, b],
    accent: [r, g, b],
    background: 0xHEXCOLOR,
  },
}
```

2. **Mettre à jour raccourcis clavier dans `App.jsx` :**
```javascript
const themeMap = {
  // ... existants
  Digit6: 'myTheme',
}
```

### Modifier le comportement des particules

**Éditer `src/core/ParticleSystem.js`, méthode `update()` :**

```javascript
update(frequencyBands) {
  const { bass, mid, high } = frequencyBands;

  // Modifier les formules ici :
  const bassEffect = bass * 50;  // Augmenter = plus d'expansion
  const midEffect = mid * 20;    // Augmenter = plus de mouvement
  const brightness = 1.0 + high * 0.5;  // Augmenter = plus de luminosité
}
```

### Ajuster le nombre de particules

**Méthode 1 : Statique**
Dans `ThreeScene.js` constructeur :
```javascript
this.particleSystem = new ParticleSystem(this.scene, 15000, this.palette);
//                                                     ^^^^^ changer ici
```

**Méthode 2 : Dynamique avec performance**
Activer le monitoring dans `App.jsx` :
```javascript
import performanceMonitor from './utils/performanceMonitor';

useEffect(() => {
  performanceMonitor.start();

  const callback = (fps) => {
    if (fps < 45 && sceneRef.current) {
      sceneRef.current.setParticleCount(5000);
    }
  };

  performanceMonitor.onUpdate(callback);

  return () => performanceMonitor.offUpdate(callback);
}, []);
```

### Ajouter un nouveau contrôle audio

1. **Créer composant dans `src/components/` :**
```javascript
const MyControl = ({ audioRef }) => {
  // Logique
  return <div>...</div>
}
```

2. **Importer et utiliser dans `App.jsx` :**
```javascript
{audioUrl && (
  <>
    <ControlPanel ... />
    <MyControl audioRef={audioRef} />
  </>
)}
```

## Problèmes courants et solutions

### ❌ "AudioContext was not allowed to start"
**Cause :** Autoplay policy des navigateurs
**Solution :** L'audio doit être initialisé après une interaction utilisateur (déjà implémenté dans `AudioAnalyzer.resumeContext()`)

### ❌ Particules ne bougent pas
**Diagnostics :**
1. Vérifier console : `AudioAnalyzer initialized` doit apparaître
2. Vérifier `useAudioAnalysis.startAnalysis()` est appelé au play
3. Logger `frequencyBands` dans `ThreeScene.updateFrequencyBands()`

**Solution courante :** S'assurer que l'audio joue réellement (check `audio.paused`)

### ❌ Performance faible (< 30 FPS)
**Solutions :**
1. Réduire nombre de particules : `setParticleCount(5000)`
2. Réduire `smoothingTimeConstant` de l'AnalyserNode (moins de calcul)
3. Désactiver anti-aliasing : `new THREE.WebGLRenderer({ antialias: false })`
4. Réduire `pixelRatio` : `renderer.setPixelRatio(1)`

### ❌ Couleurs ne changent pas avec le thème
**Vérifier :**
1. `useEffect` dans `useThreeScene.js` est bien déclenché (deps: `[palette]`)
2. `ThreeScene.updatePalette()` appelle bien `particleSystem.updateTheme()`
3. Dans `ParticleSystem.updateTheme()`, `geometry.attributes.color.needsUpdate = true`

### ❌ Caméra ne tourne pas
**Diagnostics :**
1. Vérifier que `CameraController` est bien créé dans `ThreeScene`
2. Vérifier que `cameraController.update()` est appelé dans RAF loop
3. Logger les events `mousedown`, `mousemove` dans `CameraController`

**Solution courante :** Canvas doit avoir `pointer-events: auto` (pas `none`)

## Décisions techniques importantes

### Pourquoi Three.js pur au lieu de React Three Fiber ?
- **Contrôle total** du render loop pour sync parfaite audio-visuel
- **Performance critique** : pas de couche d'abstraction React
- **Simplicité** : logique Three.js isolée dans des classes

### Pourquoi BufferGeometry ?
- **3-5x plus rapide** que Geometry
- **GPU-friendly** : attributs directement en Float32Array
- **Scalabilité** : supporte 10k+ particules à 60 FPS

### Pourquoi smoothing audio ?
Sans smoothing : particules "sautent" à chaque frame (effet strobe)
Avec smoothing (0.7) : transitions fluides, mouvement organique

### Pourquoi AnalyserNode.smoothingTimeConstant = 0.8 ?
- Valeur 0.8 = bon équilibre réactivité/fluidité
- Plus bas (0.5) = plus réactif mais saccadé
- Plus haut (0.9) = très fluide mais lag perceptible

### Pourquoi fftSize = 2048 ?
- 1024 bins de fréquence (fftSize / 2)
- Bonne résolution pour séparer bass/mid/high
- Plus grand (4096) = plus précis mais plus lourd CPU

## Performance targets

- **60 FPS constant** sur desktop moderne (2020+)
- **45+ FPS** sur laptop mid-range
- **30+ FPS** sur mobile haut de gamme

**Mesures actuelles (10k particules) :**
- Desktop (RTX 3060) : 60 FPS stable
- Laptop (Intel Iris) : 50-60 FPS
- Mobile (iPhone 12) : 40-50 FPS (réduire à 5k particules)

## Extensions possibles

### Court terme (facile)
- [ ] Bouton upload nouveau fichier sans refresh
- [ ] Afficher nom du thème actif
- [ ] Volume par défaut à 0.7 (moins fort)
- [ ] Favicon + title personnalisé

### Moyen terme
- [ ] Plusieurs formes de distribution (cube, tore, spirale)
- [ ] Mode "beat detection" avec pics de basse
- [ ] Export vidéo de la visualisation
- [ ] Playlist avec autoplay

### Long terme (complexe)
- [ ] Shaders GLSL personnalisés pour particules
- [ ] Post-processing effects (bloom, motion blur)
- [ ] Sync avec lyrics (API Genius)
- [ ] Mode VR (WebXR)

## Commandes utiles

```bash
# Développement
npm run dev              # Lance le dev server (port 5173)

# Production
npm run build            # Build optimisé dans /dist
npm run preview          # Test du build de production

# Debugging
# Dans le navigateur console :
# - ThreeScene accessible via window (si exposé)
# - performanceMonitor.getFPS() pour voir les FPS
```

## Fichiers critiques à ne pas casser

1. **src/core/ParticleSystem.js** : Cœur de la visualisation
2. **src/core/AudioAnalyzer.js** : Analyse audio
3. **src/hooks/useThreeScene.js** : Pont React-Three.js
4. **src/utils/audioProcessor.js** : Calcul bandes fréquences

**Si ces fichiers sont modifiés, tester IMMÉDIATEMENT avec un fichier audio.**

## Notes pour Claude

- Toujours lire les fichiers avant de les modifier
- Privilégier édits ciblés sur rewrites complets
- Tester après chaque modification majeure
- Respecter la séparation React (UI) / Three.js (core)
- Cleanup mémoire = CRITIQUE (memory leaks sur change de page)

## Ressources

- [Three.js Docs](https://threejs.org/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [BufferGeometry Guide](https://threejs.org/docs/#api/en/core/BufferGeometry)
- [Vite Config](https://vitejs.dev/config/)
