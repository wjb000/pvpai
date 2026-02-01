# 3D World Explorer

An interactive 3D world built with Three.js featuring a futuristic platform, animated character, and collectible loot items.

## Features

- **3D Environment**: Circular platform with hexagonal cyberpunk texture and glowing edge
- **Animated Character**: Robot character with idle, walk, and run animations
- **Movement**: WASD controls, Shift to sprint, Spacebar to jump
- **Mobile Support**: Touch-based joystick controls
- **Loot System**: 3 collectible items with unique colors and effects:
  - 🌟 Legendary Treasure (Gold)
  - 💎 Epic Artifact (Purple)
  - ⭐ Rare Crystal (Green)
- **Atmospheric Effects**: Particle system, dynamic lighting, bloom effects
- **Responsive**: Works on desktop and mobile devices

## Technologies

- Three.js (3D rendering)
- WebGL (graphics)
- JavaScript ES6+ modules
- Post-processing effects (Bloom, FXAA)

## Deployment

This project is ready to deploy on Vercel:

1. Import this repository to Vercel
2. No build configuration needed - it's a static site
3. Deploy!

Vercel will automatically serve the `index.html` file.

## Local Development

Simply open `index.html` in a modern web browser. For best results, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve
```

Then open `http://localhost:8000` in your browser.

## Controls

### Desktop
- **WASD**: Move around
- **Shift**: Sprint
- **Space**: Jump
- Walk near loot items to see popup, click "COLLECT" to interact

### Mobile
- **Joystick**: Move around
- Walk near loot items to see popup, tap "COLLECT" to interact

## License

MIT
