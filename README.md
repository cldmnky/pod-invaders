# Pod Invaders 🚀

A Kubernetes-themed web game inspired by Space Invaders, designed for chaos engineering and monitoring your Kubernetes clusters in a fun, interactive way. Destroy pods (both real and fake) while monitoring backend services and tracking high scores!

## 🎮 Game Features

- **Classic Space Invaders Gameplay**: Navigate your ship and shoot at pod invaders
- **Real Kubernetes Integration**: Destroy actual pods in your cluster or play with fake pods
- **Boss Battles**: Multi-phase boss enemies with unique attack patterns and summoned minions
- **Endless Mode**: Difficulty and enemy formations keep scaling after the campaign
- **Power-ups**: Rapid fire, triple shot, shield, extra life, and slow-mo dropped by invaders
- **Invader Variety**: Tanky and shooter pod types, plus mystery UFO bonus ships
- **Combo Multiplier**: Chain kills without getting hit to multiply your score
- **Progressive Difficulty**: Each level increases in speed, projectile frequency, and complexity
- **High Score Tracking**: Compete with others and track your best performances
- **Real-time Monitoring**: Monitor backend services while playing
- **Audio & Visual Effects**: Immersive sound effects, screen shake, and visual feedback
- **Responsive Design**: Keyboard, WASD, and touch controls for desktop and mobile

## 🛠 Technology Stack

- **Backend**: Go with Fiber web framework
- **Frontend**: Pure JavaScript with HTML5 Canvas
- **Kubernetes Integration**: Official Kubernetes Go client
- **Audio**: OGG audio files for sound effects and background music
- **Styling**: Bulma CSS framework with custom game styling

## 🏗 Architecture

### Backend Components

- **Pod Management**: Real-time interaction with Kubernetes API to list and delete pods
- **Monitoring Service**: Background health checking of external services
- **High Score System**: In-memory tracking of player achievements
- **Static Asset Serving**: Embedded assets using Go's embed package
- **RESTful API**: Clean endpoints for game data and actions

### Game Engine

- **Canvas-based Rendering**: Smooth 60fps gameplay
- **Collision Detection**: Precise collision handling for projectiles and entities
- **Sound Management**: Dynamic audio with mute/unmute functionality
- **Difficulty Scaling**: Configurable parameters for balanced progression

## 🚀 Quick Start

### Prerequisites

- Go 1.24+
- Access to a Kubernetes cluster (optional - can run in standalone mode)
- Modern web browser with HTML5 Canvas support

### Installation

1. **Clone the repository**:

```bash
git clone https://github.com/cldmnky/pod-invaders.git
cd pod-invaders
```

1. **Build the application**:

```bash
go mod download
go build -o pod-invaders .
```

1. **Run the game**:

**With Kubernetes integration**:

```bash
./pod-invaders --enable-kube --namespaces="default,kube-system"
```

**Standalone mode (no Kubernetes)**:

```bash
./pod-invaders --enable-kube=false
```

1. **Open your browser** and navigate to `http://localhost:3000`

## ⚙️ Configuration Options

### Command Line Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--kubeconfig` | Path to kubeconfig file | `~/.kube/config` |
| `--enable-kube` | Enable Kubernetes integration | `true` |
| `--namespaces` | List of namespaces to target | `["default"]` |

### Game Difficulty Parameters

The game includes several configurable difficulty parameters in `config.js`:

```javascript
// Projectile speeds
let invaderProjectileSpeed = 2;  // Easy: 2, Hard: 5
let bossProjectileSpeed = 4;     // Easy: 3, Hard: 6

// Boss characteristics
let bossMaxHits = 7;             // Easy: 5, Hard: 12
let bossVerticalAmplitude = 20;  // Easy: 10, Hard: 40

// Movement and timing
let invaderSpeed = 0.7;          // Easy: 0.7, Hard: 2
let invaderProjectileFrequency = 150; // Easy: 400, Hard: 100
```

Additional tunables in `config.js`: power-up drop rates and durations, combo scaling
(`COMBO_MULTIPLIER_STEP`), UFO spawn frequency, player fire cooldown, invulnerability
frames, and screen-shake intensity. Levels 1-10 are a fixed campaign; beyond that,
`getLevelConfig()` generates endless procedural formations.

## 🎯 API Endpoints

### Game Endpoints

- `GET /` - Serve the game interface
- `GET /names?count=N` - Get list of pods (real or fake)
- `POST /kill` - Log a killed pod
- `POST /highscore` - Submit a high score
- `GET /highscores` - Retrieve all high scores

### Management Endpoints

- `POST /namespaces` - Update target namespaces
- `POST /monitor` - Start monitoring a service
- `POST /monitor/stop` - Stop monitoring a service
- `GET /monitor/status?id=<id>` - Get monitor status

### Static Assets

- `GET /assets/*` - Game assets (images, sounds)
- `GET /*.js` - JavaScript files

## 🎮 How to Play

1. **Start the Game**: Open the web interface and click to begin
2. **Movement**: Use arrow keys, A/D, or on-screen touch buttons to move your ship
3. **Shooting**: Press and hold SPACE or W to autofire
4. **Objective**: Destroy all pod invaders to advance to the next level
5. **Boss Fights**: Every other level, face a powerful boss with phase-based attacks
6. **Combo**: Chain kills without getting hit to build a score multiplier (up to x5)
7. **Power-ups**: Grab falling drops - rapid fire, triple shot, shield, extra life, slow-mo
8. **UFOs**: Shoot down mystery UFOs for bonus points and guaranteed power-ups
9. **Pause**: Press P or ESC to pause, R to restart
10. **Scoring**:

   - Fake pods: 100 points (normal), 150 (shooter), 300 (tanky)
   - Real pods: 200 points (normal), 250 (shooter), 400 (tanky)
   - Boss enemies: 1000+ points (scales with multiplier)
   - Mystery UFO: 200-500 points
   - Monitor up bonus: 1000 points per level

## ⚡ Power-ups

| Power-up | Effect | Duration |
|----------|--------|----------|
| Rapid Fire | Much faster shooting | 10s |
| Triple Shot | Fire 3 projectiles in a spread | 10s |
| Shield | Absorbs one hit | until hit |
| Extra Life | +1 life (up to 5) | instant |
| Slow-Mo | Invader projectiles move at half speed | 6s |

Real pods drop power-ups almost twice as often as fake pods, and tanky pods always drop one.

## 🔧 Development

### Project Structure

```text
├── main.go              # Main application with API endpoints
├── embed.go             # Embedded asset configuration
├── assets/              # Game assets (images, sounds)
│   ├── *.ogg           # Sound effects
│   ├── *.mp3           # Background music
│   └── *.png           # Images
└── views/               # Frontend files
    ├── index.html      # Game interface
    └── main.js         # Game engine
```

### Key Components

**Backend (main.go)**:

- Kubernetes client integration
- Pod management and fake pod generation
- Monitoring service with health checks
- High score persistence
- RESTful API with proper error handling

**Frontend (main.js)**:

- HTML5 Canvas game engine
- Progressive difficulty system
- Real-time score tracking
- Audio management
- Responsive controls

### Building and Testing

```bash
# Run in development mode
go run .

# Build for production
go build -o pod-invaders .

# Run tests (if available)
go test ./...
```

## 🚨 Chaos Engineering Use Cases

Pod Invaders is designed for chaos engineering scenarios:

1. **Controlled Pod Deletion**: Safely test application resilience by destroying pods in a gamified way
2. **Service Monitoring**: Monitor critical services while performing chaos experiments
3. **Team Building**: Make chaos engineering fun and collaborative
4. **Training**: Teach Kubernetes concepts through interactive gameplay
5. **Incident Response**: Gamify incident response training

## 🛡️ Safety Considerations

- **Namespace Isolation**: Configure specific namespaces to limit blast radius
- **Standalone Mode**: Use fake pods for safe testing
- **Permission Controls**: Ensure proper RBAC configuration
- **Monitoring Integration**: Track service health during chaos experiments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic Space Invaders arcade game
- Built for the Kubernetes and chaos engineering community
- Sound effects and assets from various open-source resources

---

Have fun destroying pods! 🎯🚀
