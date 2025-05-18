// Wait for window load to ensure all scripts are ready
window.addEventListener('load', function() {
    try {
        // Basic Three.js setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.6, 5); // Position camera at average human height
        
        // Renderer setup
        const container = document.getElementById('webglContainer');
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        scene.add(mainLight);

        // Add some point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
        pointLight1.position.set(-3, 3, 0);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
        pointLight2.position.set(3, 3, 0);
        scene.add(pointLight2);

        // Create room
        function createRoom() {
            const roomGeometry = {
                width: 10,
                height: 8,
                depth: 10
            };

            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080,
                roughness: 0.8,
                metalness: 0.2,
                side: THREE.DoubleSide
            });

            // Floor
            const floorGeometry = new THREE.PlaneGeometry(roomGeometry.width, roomGeometry.depth);
            const floor = new THREE.Mesh(floorGeometry, wallMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = 0;
            floor.receiveShadow = true;
            scene.add(floor);

            // Ceiling
            const ceiling = new THREE.Mesh(floorGeometry, wallMaterial);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.y = roomGeometry.height;
            ceiling.receiveShadow = true;
            scene.add(ceiling);

            // Back wall
            const backWallGeometry = new THREE.PlaneGeometry(roomGeometry.width, roomGeometry.height);
            const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
            backWall.position.z = -roomGeometry.depth / 2;
            backWall.position.y = roomGeometry.height / 2;
            backWall.receiveShadow = true;
            scene.add(backWall);

            // Side walls
            const sideWallGeometry = new THREE.PlaneGeometry(roomGeometry.depth, roomGeometry.height);
            
            // Left wall
            const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
            leftWall.position.x = -roomGeometry.width / 2;
            leftWall.position.y = roomGeometry.height / 2;
            leftWall.rotation.y = Math.PI / 2;
            leftWall.receiveShadow = true;
            scene.add(leftWall);

            // Right wall
            const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
            rightWall.position.x = roomGeometry.width / 2;
            rightWall.position.y = roomGeometry.height / 2;
            rightWall.rotation.y = -Math.PI / 2;
            rightWall.receiveShadow = true;
            scene.add(rightWall);
        }

        createRoom();

        // Handle window resize
        function onWindowResize() {
            const container = document.getElementById('webglContainer');
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        
        window.addEventListener('resize', onWindowResize);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        // Start animation
        animate();
        
    } catch (error) {
        console.error('Three.js error:', error);
    }
});



