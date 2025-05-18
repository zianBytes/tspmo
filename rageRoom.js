import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Wait for window load to ensure all scripts are ready
window.addEventListener('load', function() {
    console.log('=== GAME INITIALIZATION START ===');
    try {
        console.log('Initializing game...');

        // Hide homepage elements and show game UI
        document.querySelectorAll('.header, .ticker-wrap, .rage-input, .rage-feed, #leaderboardPanel').forEach(el => {
            if (el) el.style.display = 'none';
        });
        
        // Show controls initially
        const controlsElement = document.getElementById('controls');
        controlsElement.style.display = 'block';
        
        // Initially hide the game UI until game starts
        document.getElementById('gameUI').style.display = 'none';
        
        console.log('Homepage elements hidden');

        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js not loaded! Check script dependencies.');
        }
        console.log('Three.js loaded successfully');

        // Basic Three.js setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);
        console.log('Scene created with background color: 0x111111');

        // Camera setup with better initial position
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 2, 10);
        camera.lookAt(0, 2, 0);
        console.log('Camera initialized at position:', camera.position);

        // Check if PointerLockControls is available
        if (typeof PointerLockControls === 'undefined') {
            throw new Error('PointerLockControls not loaded! Check script dependencies.');
        }
        console.log('PointerLockControls available');

        // Initialize controls
        const controls = new PointerLockControls(camera, document.body);
        console.log('Controls initialized');

        // Add event listeners for pointer lock
        controls.addEventListener('lock', () => {
            controlsElement.style.display = 'none';
            document.getElementById('gameUI').style.display = 'block';
        });

        controls.addEventListener('unlock', () => {
            controlsElement.style.display = 'block';
            document.getElementById('gameUI').style.display = 'none';
        });

        // Add test cube to verify rendering
        const testCube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        testCube.position.set(0, 2, 0);
        scene.add(testCube);
        console.log('Test cube added');

        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        console.log('Ambient light added');

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        console.log('Directional light added');

        // Texture loader and renderer setup
        const textureLoader = new THREE.TextureLoader();
        const container = document.getElementById('webglContainer');
        if (!container) {
            throw new Error('WebGL container not found! Check HTML structure.');
        }
        console.log('WebGL container found');

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });

        // Check if renderer was created successfully
        if (!renderer) {
            throw new Error('Failed to create WebGL renderer!');
        }
        console.log('Renderer created');

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 5.0;
        console.log('Renderer settings configured');

        container.appendChild(renderer.domElement);
        console.log('Renderer attached to container');

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Load textures with normal maps - using correct URLs
        const floorTexture = textureLoader.load('https://threejs.org/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg');
        const floorNormalMap = textureLoader.load('https://threejs.org/examples/textures/floors/FloorsCheckerboard_S_Normal.jpg');
        
        // Configure texture repeating
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorNormalMap.wrapS = floorNormalMap.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(4, 4);
        floorNormalMap.repeat.set(4, 4);

        // Add floor
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture,
            normalMap: floorNormalMap,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Movement state
        const moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shift: false
        };

        const moveSpeed = 0.15;

        // Add event listeners for movement
        document.addEventListener('keydown', (event) => {
            if (!controls.isLocked) {
                if (event.code === 'Space') {
                    controls.lock();
                }
                return;
            }
            
            switch (event.code) {
                case 'KeyW': moveState.forward = true; break;
                case 'KeyS': moveState.backward = true; break;
                case 'KeyA': moveState.left = true; break;
                case 'KeyD': moveState.right = true; break;
                case 'ShiftLeft': moveState.shift = true; break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': moveState.forward = false; break;
                case 'KeyS': moveState.backward = false; break;
                case 'KeyA': moveState.left = false; break;
                case 'KeyD': moveState.right = false; break;
                case 'ShiftLeft': moveState.shift = false; break;
            }
        });

        // Add collision detection
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3();
        
        function checkCollision() {
            if (!controls.isLocked) return;
            
            // Get current position and direction
            const position = camera.position.clone();
            position.y -= 1.8; // Adjust for camera height
            
            // Check floor collision
            raycaster.ray.origin.copy(position);
            direction.set(0, -1, 0);
            raycaster.ray.direction.copy(direction);
            
            const intersects = raycaster.intersectObject(floor);
            if (intersects.length > 0) {
                const distance = intersects[0].distance;
                if (distance < 1.8) {
                    camera.position.y = intersects[0].point.y + 1.8;
                }
            }
            
            // Check wall collisions
            const directions = [
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(0, 0, -1)
            ];
            
            directions.forEach(dir => {
                raycaster.ray.origin.copy(position);
                raycaster.ray.direction.copy(dir);
                const intersects = raycaster.intersectObjects(scene.children);
                
                if (intersects.length > 0 && intersects[0].distance < 0.5) {
                    const normal = intersects[0].face.normal;
                    camera.position.add(normal.multiplyScalar(0.1));
                }
            });
        }

        // Single dramatic flickering light
        const lights = [];
        const lightPositions = [
            { pos: new THREE.Vector3(-3, 6, 1), color: 0xffffff, intensity: 3.0 } // Increased intensity
        ];

        class FlickeringLight extends THREE.PointLight {
            constructor(color, intensity, distance) {
                super(color, intensity, distance);
                this.baseIntensity = intensity;
                this.flickerSpeed = 0.15;
                this.flickerIntensity = 1.2;
                this.strobeChance = 0.02;
                this.time = Math.random() * 1000;
                
                // Add visible light fixture
                const fixtureGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
                const fixtureMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.8 // Increased emissive
                });
                this.fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
                this.add(this.fixture);
                
                // Add light glow
                const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16); // Larger glow
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.4 // Increased opacity
                });
                this.glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
                this.add(this.glowSphere);

                // Strobe state
                this.isStrobing = false;
                this.strobeTime = 0;
            }

            update() {
                this.time += this.flickerSpeed;
                
                // Random chance to trigger strobe effect
                if (!this.isStrobing && Math.random() < this.strobeChance) {
                    this.isStrobing = true;
                    this.strobeTime = 0;
                }

                let flicker;
                if (this.isStrobing) {
                    // Strobe effect
                    this.strobeTime += 0.1;
                    if (this.strobeTime > 0.5) { // Strobe duration
                        this.isStrobing = false;
                    }
                    // Create sharp on/off pattern
                    flicker = Math.sin(this.strobeTime * 40) * 0.5 + 0.5;
                    this.intensity = this.baseIntensity * (3.0 + flicker * 2); // Increased strobe intensity
                } else {
                    // Normal flicker pattern
                    flicker = Math.sin(this.time) * 0.5 + 
                             Math.sin(this.time * 4.7) * 0.3 +
                             Math.sin(this.time * 9.3) * 0.2;
                    this.intensity = Math.max(0.8, this.baseIntensity + flicker * this.flickerIntensity); // Increased minimum
                }
                
                // Update glow and fixture
                const scale = 0.8 + Math.abs(flicker) * 0.6;
                this.glowSphere.scale.set(scale, scale, scale);
                this.fixture.material.emissiveIntensity = 0.2 + Math.abs(flicker) * 0.4;
            }
        }

        lightPositions.forEach(light => {
            const flickeringLight = new FlickeringLight(light.color, light.intensity, 15);
            flickeringLight.position.copy(light.pos);
            flickeringLight.castShadow = true;
            scene.add(flickeringLight);
            lights.push(flickeringLight);
        });

        // Create graffiti texture
        function createGraffitiTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 2048; // Increased resolution
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Create spray paint effect
            function sprayEffect(x, y, density, spread) {
                for (let i = 0; i < density; i++) {
                    const offsetX = (Math.random() - 0.5) * spread;
                    const offsetY = (Math.random() - 0.5) * spread;
                    const radius = Math.random() * 2;
                    const alpha = Math.random() * 0.3;
                    
                    ctx.beginPath();
                    ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
                    ctx.fill();
                }
            }

            // Add graffiti text with spray paint effect
            const text = "RAGE tf OUT";
            ctx.font = 'bold 200px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Create text path
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 8;
            ctx.strokeText(text, canvas.width/2, canvas.height/2);
            
            // Add spray effect along text path
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const textHeight = 200; // Approximate height based on font size
            
            // Dense spray around text
            for(let x = canvas.width/2 - textWidth/2; x < canvas.width/2 + textWidth/2; x += 10) {
                for(let y = canvas.height/2 - textHeight/2; y < canvas.height/2 + textHeight/2; y += 10) {
                    sprayEffect(x, y, 20, 30);
                }
            }

            // Add drips with spray effect
            ctx.lineWidth = 2;
            for(let i = 0; i < 15; i++) {
                const x = canvas.width/2 - textWidth/2 + Math.random() * textWidth;
                const startY = canvas.height/2 + textHeight/2;
                const height = 100 + Math.random() * 200;
                
                // Create drip path
                const dripWidth = 5 + Math.random() * 15;
                for(let y = startY; y < startY + height; y += 5) {
                    sprayEffect(x, y, 10, dripWidth);
                }
            }

            // Add glow effect
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ff0000';
            ctx.fillText(text, canvas.width/2, canvas.height/2);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        // Game state
        const gameState = {
            hasHammer: false,
            currentRoom: 'lobby',
            timer: null,
            isGameOver: false
        };

        // Room configurations
        const roomConfigs = {
            lobby: {
                width: 30,
                height: 10,
                depth: 20
            },
            rageRooms: [
                { number: 1, difficulty: 'Easy', timeLimit: 120, itemCount: 10 },
                { number: 2, difficulty: 'Medium', timeLimit: 90, itemCount: 15 },
                { number: 3, difficulty: 'Hard', timeLimit: 60, itemCount: 20 },
                { number: 4, difficulty: 'Expert', timeLimit: 45, itemCount: 25 }
            ]
        };

        // Create neon sign text
        function createNeonText(text, color) {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = 'bold 120px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Glow effect
            ctx.shadowBlur = 30;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeText(text, canvas.width/2, canvas.height/2);
            
            // Main text
            ctx.fillStyle = color;
            ctx.fillText(text, canvas.width/2, canvas.height/2);

            const texture = new THREE.CanvasTexture(canvas);
            return texture;
        }

        // Create lobby
        function createLobby() {
            const { width, height, depth } = roomConfigs.lobby;

            // Create reception desk
            const receptionDesk = new THREE.Group();
            
            // Main desk body
            const deskGeometry = new THREE.BoxGeometry(5, 1.2, 2);
            const deskMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                roughness: 0.8 
            });
            const desk = new THREE.Mesh(deskGeometry, deskMaterial);
            desk.position.set(0, 0.6, -depth/4);
            receptionDesk.add(desk);

            // Desk front panel
            const frontGeometry = new THREE.BoxGeometry(5, 1.2, 0.1);
            const front = new THREE.Mesh(frontGeometry, deskMaterial);
            front.position.set(0, 0.6, -depth/4 + 1);
            receptionDesk.add(front);

            scene.add(receptionDesk);

            // Create neon sign
            let neonColors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff];
            let currentColorIndex = 0;

            const neonSignGeometry = new THREE.PlaneGeometry(8, 2);
            const neonSignMaterial = new THREE.MeshBasicMaterial({
                map: createNeonText("TS PMO RAGE ROOM", `#${neonColors[0].toString(16)}`),
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const neonSign = new THREE.Mesh(neonSignGeometry, neonSignMaterial);
            neonSign.position.set(0, height - 2, -depth/2 + 0.1);
            scene.add(neonSign);

            // Animate neon sign
            setInterval(() => {
                currentColorIndex = (currentColorIndex + 1) % neonColors.length;
                neonSignMaterial.map = createNeonText(
                    "TS PMO RAGE ROOM", 
                    `#${neonColors[currentColorIndex].toString(16)}`
                );
                neonSignMaterial.needsUpdate = true;
            }, 1000);

            // Add sofas
            const sofaMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x404040,
                roughness: 0.7 
            });

            // Create waiting area sofas
            [-1, 1].forEach(side => {
                const sofa = new THREE.Group();
                
                // Seat
                const seatGeometry = new THREE.BoxGeometry(4, 0.5, 1.5);
                const seat = new THREE.Mesh(seatGeometry, sofaMaterial);
                seat.position.y = 0.25;
                sofa.add(seat);

                // Backrest
                const backGeometry = new THREE.BoxGeometry(4, 1.2, 0.3);
                const back = new THREE.Mesh(backGeometry, sofaMaterial);
                back.position.set(0, 0.85, -0.75);
                sofa.add(back);

                sofa.position.set(side * 8, 0, -depth/3);
                scene.add(sofa);
            });

            // Add decorative plants
            const plantGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
            const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x0a5c0a });
            const potMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

            [-1, 1].forEach(side => {
                const plant = new THREE.Group();

                // Pot
                const pot = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.3, 0.4, 8),
                    potMaterial
                );
                plant.add(pot);

                // Plant
                const plantMesh = new THREE.Mesh(plantGeometry, plantMaterial);
                plantMesh.position.y = 0.8;
                plant.add(plantMesh);

                plant.position.set(side * 12, 0, -depth/3);
                scene.add(plant);
            });

            // Add hammer pickup spot
            const hammerSpot = new THREE.Group();
            const pedestal = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.4, 1, 8),
                new THREE.MeshStandardMaterial({ color: 0x808080 })
            );
            pedestal.position.set(2, 0.5, -depth/4);
            scene.add(pedestal);

            // Create the hammer
            const hammer = createHammer();
            hammer.position.set(2, 1.2, -depth/4);
            hammer.scale.set(0.5, 0.5, 0.5);
            scene.add(hammer);
        }

        // Create hammer model
        function createHammer() {
            const hammer = new THREE.Group();

            // Handle
            const handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
            const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.rotation.x = Math.PI / 2;
            hammer.add(handle);

            // Head
            const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 1);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.z = 1;
            hammer.add(head);

            return hammer;
        }

        // Create message system
        function showMessage(message, duration = 3000) {
            const messageDiv = document.createElement('div');
            messageDiv.style.position = 'fixed';
            messageDiv.style.top = '20%';
            messageDiv.style.left = '50%';
            messageDiv.style.transform = 'translate(-50%, -50%)';
            messageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            messageDiv.style.color = 'white';
            messageDiv.style.padding = '20px';
            messageDiv.style.borderRadius = '10px';
            messageDiv.style.fontSize = '24px';
            messageDiv.style.fontFamily = 'Arial, sans-serif';
            messageDiv.style.zIndex = '1000';
            messageDiv.textContent = message;

            document.body.appendChild(messageDiv);

            setTimeout(() => {
                messageDiv.remove();
            }, duration);
        }

        // Add interaction handlers
        function setupInteractions() {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            let isDragging = false;

            // Handle mouse movement
            document.addEventListener('mousemove', (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                if (gameState.hasHammer && isDragging) {
                    // Update hammer position based on mouse movement
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects(scene.children, true);
                    
                    if (intersects.length > 0) {
                        const point = intersects[0].point;
                        gameState.hammer.position.copy(point);
                    }
                }
            });

            // Handle mouse click
            document.addEventListener('mousedown', (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);

                if (intersects.length > 0) {
                    const object = intersects[0].object;

                    // Hammer pickup
                    if (!gameState.hasHammer && object.userData.isHammer) {
                        pickupHammer(object);
                    }
                    // Door interaction
                    else if (object.userData.isDoor) {
                        handleDoorInteraction(object);
                    }
                    // Breaking objects
                    else if (gameState.hasHammer && object.userData.isBreakable) {
                        breakObject(object);
                    }
                }
            });

            // Handle hammer swinging
            document.addEventListener('mousedown', () => {
                if (gameState.hasHammer) isDragging = true;
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }

        function pickupHammer(hammer) {
            gameState.hasHammer = true;
            gameState.hammer = hammer;
            hammer.position.set(1, 1, -2); // Attach to camera view
            showMessage("Hammer acquired! You can now enter the rage rooms.");
        }

        function handleDoorInteraction(door) {
            if (!gameState.hasHammer) {
                showMessage("You need to pick up the hammer first!");
                return;
            }

            const roomNumber = door.userData.roomNumber;
            if (roomNumber !== gameState.currentRoom) {
                showMessage(`Complete Room ${gameState.currentRoom} first!`);
                return;
            }

            enterRoom(roomNumber);
        }

        function breakObject(object) {
            if (!gameState.hasHammer || !object.userData.isBreakable) return;

            // Create breaking effect
            createBreakEffect(object.position);
            
            // Remove object
            scene.remove(object);
            gameState.remainingObjects--;

            // Update score
            gameState.score += object.userData.points;
            updateScoreDisplay();

            // Check if room is complete
            if (gameState.remainingObjects <= 0) {
                completeRoom();
            }
        }

        function createBreakEffect(position) {
            // Create particle system for breaking effect
            const particleCount = 20;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = position.x;
                positions[i3 + 1] = position.y;
                positions[i3 + 2] = position.z;

                colors[i3] = Math.random();
                colors[i3 + 1] = Math.random();
                colors[i3 + 2] = Math.random();
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: 0.1,
                vertexColors: true
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            // Animate particles
            const velocities = positions.map(() => (Math.random() - 0.5) * 0.3);
            
            function animateParticles() {
                const positions = particles.geometry.attributes.position.array;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i];
                    positions[i + 1] += velocities[i + 1] - 0.01; // Add gravity
                    positions[i + 2] += velocities[i + 2];
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }

            // Remove particles after animation
            setTimeout(() => {
                scene.remove(particles);
            }, 1000);

            return animateParticles;
        }

        function completeRoom() {
            const currentRoom = roomConfigs.rageRooms[gameState.currentRoom - 1];
            showMessage(`Room ${gameState.currentRoom} Complete! Score: ${gameState.score}`);
            
            if (gameState.currentRoom < roomConfigs.rageRooms.length) {
                gameState.currentRoom++;
                showMessage(`Proceed to Room ${gameState.currentRoom}!`);
            } else {
                gameOver(true);
            }
        }

        function updateScoreDisplay() {
            const scoreElement = document.getElementById('score') || createScoreElement();
            scoreElement.textContent = `Score: ${gameState.score}`;
        }

        function createScoreElement() {
            const score = document.createElement('div');
            score.id = 'score';
            score.style.position = 'fixed';
            score.style.top = '5%';
            score.style.right = '5%';
            score.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            score.style.color = 'white';
            score.style.padding = '10px';
            score.style.borderRadius = '5px';
            score.style.fontSize = '20px';
            document.body.appendChild(score);
            return score;
        }

        // Initialize the game
        function initGame() {
            createLobby();
            createRageRooms();
            setupInteractions();
            
            // Show initial instructions
            showMessage("Welcome to TS PMO Rage Room!\nPress SPACE to start the game\nWASD to move, Mouse to look", 5000);
        }

        // Create rage rooms
        function createRageRooms() {
            const roomWidth = 8;
            const roomHeight = 8;
            const roomDepth = 10;
            
            roomConfigs.rageRooms.forEach((room, index) => {
                const isLeftSide = index < 2;
                const row = index % 2;
                
                // Position calculation
                const xPos = isLeftSide ? -15 + (row * 10) : 5 + (row * 10);
                const zPos = -roomConfigs.lobby.depth/2 - roomDepth/2;
                
                createRageRoom(xPos, zPos, roomWidth, roomHeight, roomDepth, room);
            });
        }

        function createRageRoom(x, z, width, height, depth, roomConfig) {
            const room = new THREE.Group();
            
            // Room walls
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0xd4d4d4,
                roughness: 1.0,
                metalness: 0.0
            });

            // Back wall
            const backWall = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                wallMaterial
            );
            backWall.position.set(x, height/2, z - depth/2);
            scene.add(backWall);

            // Side walls
            [-1, 1].forEach(side => {
                const sideWall = new THREE.Mesh(
                    new THREE.PlaneGeometry(depth, height),
                    wallMaterial
                );
                sideWall.rotation.y = Math.PI/2;
                sideWall.position.set(x + (side * width/2), height/2, z);
                scene.add(sideWall);
            });

            // Create door
            const doorWidth = 2;
            const doorHeight = 4;
            const door = new THREE.Mesh(
                new THREE.PlaneGeometry(doorWidth, doorHeight),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            door.position.set(x, doorHeight/2, z + depth/2);
            scene.add(door);

            // Add room number and difficulty sign
            const signGeometry = new THREE.PlaneGeometry(2, 1);
            const signTexture = createRoomSign(roomConfig.number, roomConfig.difficulty);
            const signMaterial = new THREE.MeshBasicMaterial({
                map: signTexture,
                transparent: true
            });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(x, height - 1, z + depth/2 + 0.1);
            scene.add(sign);

            // Add breakable objects based on difficulty
            addBreakableObjects(x, z, width, depth, roomConfig);
        }

        function createRoomSign(number, difficulty) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText(`Room ${number}`, canvas.width/2, 80);
            
            ctx.font = '40px Arial';
            ctx.fillStyle = getDifficultyColor(difficulty);
            ctx.fillText(difficulty, canvas.width/2, 160);

            return new THREE.CanvasTexture(canvas);
        }

        function getDifficultyColor(difficulty) {
            switch(difficulty) {
                case 'Easy': return '#00ff00';
                case 'Medium': return '#ffff00';
                case 'Hard': return '#ff8c00';
                case 'Expert': return '#ff0000';
                default: return '#ffffff';
            }
        }

        function addBreakableObjects(roomX, roomZ, roomWidth, roomDepth, roomConfig) {
            const objects = [];
            const objectTypes = [
                { 
                    geometry: new THREE.BoxGeometry(0.5, 0.5, 0.5),
                    material: new THREE.MeshStandardMaterial({ color: 0x808080 }),
                    points: 100
                },
                { 
                    geometry: new THREE.SphereGeometry(0.3, 8, 8),
                    material: new THREE.MeshStandardMaterial({ color: 0x8B4513 }),
                    points: 150
                },
                { 
                    geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.6),
                    material: new THREE.MeshStandardMaterial({ color: 0x4169E1 }),
                    points: 200
                }
            ];

            for(let i = 0; i < roomConfig.itemCount; i++) {
                const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];
                const object = new THREE.Mesh(type.geometry, type.material);
                
                // Random position within room bounds
                object.position.set(
                    roomX + (Math.random() - 0.5) * (roomWidth - 1),
                    0.5 + Math.random() * 2,
                    roomZ + (Math.random() - 0.5) * (roomDepth - 1)
                );
                
                object.userData.points = type.points;
                object.userData.isBreakable = true;
                
                scene.add(object);
                objects.push(object);
            }

            return objects;
        }

        // Game mechanics
        function startGame() {
            gameState.score = 0;
            gameState.currentRoom = 1;
            showMessage("Game Started! Enter Room 1 to begin.");
        }

        function enterRoom(roomNumber) {
            const room = roomConfigs.rageRooms[roomNumber - 1];
            gameState.timer = room.timeLimit;
            gameState.remainingObjects = room.itemCount;
            
            showMessage(`Room ${roomNumber}: ${room.difficulty}\nTime: ${room.timeLimit} seconds\nBreak all ${room.itemCount} objects!`);
            
            // Start timer
            const timerInterval = setInterval(() => {
                gameState.timer--;
                updateTimerDisplay();
                
                if(gameState.timer <= 0) {
                    clearInterval(timerInterval);
                    gameOver(false);
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            // Update timer UI
            const timerElement = document.getElementById('timer') || createTimerElement();
            timerElement.textContent = `Time: ${gameState.timer}s`;
        }

        function createTimerElement() {
            const timer = document.createElement('div');
            timer.id = 'timer';
            timer.style.position = 'fixed';
            timer.style.top = '10%';
            timer.style.right = '5%';
            timer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            timer.style.color = 'white';
            timer.style.padding = '10px';
            timer.style.borderRadius = '5px';
            timer.style.fontSize = '20px';
            document.body.appendChild(timer);
            return timer;
        }

        function gameOver(success) {
            clearInterval(gameState.timer);
            
            const message = success ? 
                "Congratulations! You've completed the room!" :
                "Game Over! Out of time!";
            
            showGameOverScreen(message);
        }

        function showGameOverScreen(message) {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '1000';

            const messageText = document.createElement('h1');
            messageText.textContent = message;
            messageText.style.color = 'white';
            messageText.style.marginBottom = '20px';
            overlay.appendChild(messageText);

            const buttonStyle = `
                padding: 10px 20px;
                margin: 10px;
                font-size: 18px;
                cursor: pointer;
                border: none;
                border-radius: 5px;
                background-color: #4CAF50;
                color: white;
            `;

            const restartButton = document.createElement('button');
            restartButton.textContent = 'Restart';
            restartButton.style.cssText = buttonStyle;
            restartButton.onclick = () => {
                document.body.removeChild(overlay);
                startGame();
            };
            overlay.appendChild(restartButton);

            const exitButton = document.createElement('button');
            exitButton.textContent = 'Exit to Homepage';
            exitButton.style.cssText = buttonStyle;
            exitButton.style.backgroundColor = '#f44336';
            exitButton.onclick = () => {
                window.location.href = '/';
            };
            overlay.appendChild(exitButton);

            document.body.appendChild(overlay);
        }

        // Animation loop with flickering lights
        function animate() {
            requestAnimationFrame(animate);

            // Handle movement if controls are locked
            if (controls.isLocked) {
                const actualMoveSpeed = moveSpeed * (moveState.shift ? 2 : 1);

                if (moveState.forward) controls.moveForward(actualMoveSpeed);
                if (moveState.backward) controls.moveForward(-actualMoveSpeed);
                if (moveState.left) controls.moveRight(-actualMoveSpeed);
                if (moveState.right) controls.moveRight(actualMoveSpeed);
            }

            // Update flickering lights
            lights.forEach(light => light.update());

            // Update break effects if any
            if (gameState.breakEffects) {
                gameState.breakEffects.forEach(effect => effect());
            }

            renderer.render(scene, camera);
        }

        // Exit button functionality
        document.getElementById('exitBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Initialize the game
        initGame();
        animate();

    } catch (error) {
        console.error('Three.js error:', error);
        alert('Failed to initialize 3D scene. Please check console for details.');
    }
});

// Add help button
const helpButton = document.createElement('button');
helpButton.textContent = 'Controls';
helpButton.style.position = 'fixed';
helpButton.style.bottom = '20px';
helpButton.style.left = '20px';
helpButton.style.padding = '10px 20px';
helpButton.style.fontSize = '16px';
helpButton.style.backgroundColor = '#4CAF50';
helpButton.style.color = 'white';
helpButton.style.border = 'none';
helpButton.style.borderRadius = '5px';
helpButton.style.cursor = 'pointer';
helpButton.onclick = () => {
    showMessage(
        "Controls:\n" +
        "WASD - Move\n" +
        "Mouse - Look around\n" +
        "Shift - Run\n" +
        "Space - Start/Pause game\n" +
        "Left Click - Break objects\n" +
        "ESC - Pause game",
        5000
    );
};
document.body.appendChild(helpButton);



