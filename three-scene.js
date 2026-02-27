class NeuralEntity {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.entity = null;
        this.entityGroup = null;
        
        this.particleCount = 8000;
        this.nodeCount = 50;
        this.connectionDistance = 15;
        
        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);
        this.raycaster = new THREE.Raycaster();
        
        this.clock = new THREE.Clock();
        this.time = 0;
        
        this.currentSection = 'home';
        this.targetState = null;
        this.stateTransition = 0;
        
        this.entityMood = {
            energy: 0.5,
            focus: 0.5,
            chaos: 0.3,
            breathe: 0
        };
        
        this.positions = null;
        this.velocities = null;
        this.originalPositions = null;
        
        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
        
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 40;
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        this.createEntity();
        
        this.createField();
        
        this.addAmbientParticles();
        
        this.addEventListeners();
        
        this.animate();
    }
    
    createEntity() {
        this.entityGroup = new THREE.Group();
        
        const coreGeometry = new THREE.IcosahedronGeometry(2, 3);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uEnergy: { value: 0.5 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float uTime;
                uniform float uEnergy;
                
                void main() {
                    vNormal = normal;
                    vPosition = position;
                    
                    // Breathing effect
                    float breathe = sin(uTime * 0.5) * 0.1 * uEnergy;
                    float noise = sin(position.x * 3.0 + uTime) * sin(position.y * 3.0 + uTime) * 0.1;
                    
                    vec3 newPosition = position * (1.0 + breathe + noise);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float uTime;
                uniform float uEnergy;
                
                void main() {
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
                    float pulse = sin(uTime * 2.0) * 0.2 + 0.8;
                    
                    vec3 coreColor = vec3(1.0, 0.0, 0.0);
                    vec3 glowColor = vec3(1.0, 0.2, 0.2);
                    
                    vec3 finalColor = mix(coreColor, glowColor, fresnel) * pulse * uEnergy;
                    float alpha = 0.8 + fresnel * 0.2;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.entityGroup.add(this.core);
        
        const nodesGeometry = new THREE.BufferGeometry();
        const nodePositions = new Float32Array(this.nodeCount * 3);
        this.nodeVelocities = [];
        
        for (let i = 0; i < this.nodeCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 5 + Math.random() * 10;
            
            nodePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            nodePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            nodePositions[i * 3 + 2] = radius * Math.cos(phi);
            
            this.nodeVelocities.push({
                theta: theta,
                phi: phi,
                radius: radius,
                speed: 0.2 + Math.random() * 0.3,
                yOffset: Math.random() * Math.PI * 2
            });
        }
        
        nodesGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
        
        const nodesMaterial = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 0.8,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.nodes = new THREE.Points(nodesGeometry, nodesMaterial);
        this.entityGroup.add(this.nodes);
        
        const connectionsGeometry = new THREE.BufferGeometry();
        const connectionsPositions = new Float32Array(this.nodeCount * this.nodeCount * 6);
        connectionsGeometry.setAttribute('position', new THREE.BufferAttribute(connectionsPositions, 3));
        
        const connectionsMaterial = new THREE.LineBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        
        this.connections = new THREE.LineSegments(connectionsGeometry, connectionsMaterial);
        this.entityGroup.add(this.connections);
        
        const streamGeometry = new THREE.BufferGeometry();
        const streamPositions = new Float32Array(this.particleCount * 3);
        const streamSizes = new Float32Array(this.particleCount);
        const streamRandoms = new Float32Array(this.particleCount);
        
        this.particleVelocities = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 3 + Math.random() * 25;
            
            streamPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            streamPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            streamPositions[i3 + 2] = radius * Math.cos(phi);
            
            streamSizes[i] = Math.random() * 2 + 0.3;
            streamRandoms[i] = Math.random();
            
            this.particleVelocities.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                noiseOffset: Math.random() * 1000
            });
        }
        
        streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
        streamGeometry.setAttribute('size', new THREE.BufferAttribute(streamSizes, 1));
        streamGeometry.setAttribute('random', new THREE.BufferAttribute(streamRandoms, 1));
        
        this.originalPositions = streamPositions.slice();
        
        const streamMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uEnergy: { value: 0.5 },
                uChaos: { value: 0.3 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uFocus: { value: 0.5 }
            },
            vertexShader: `
                attribute float size;
                attribute float random;
                
                uniform float uTime;
                uniform float uEnergy;
                uniform float uChaos;
                uniform vec2 uMouse;
                uniform float uFocus;
                
                varying float vAlpha;
                varying float vRandom;
                
                void main() {
                    vRandom = random;
                    
                    vec3 pos = position;
                    
                    // Organic movement based on energy
                    float moveSpeed = uEnergy * 0.5;
                    float noiseScale = 0.1 + uChaos * 0.1;
                    
                    pos.x += sin(uTime * moveSpeed + random * 10.0) * uChaos * 2.0;
                    pos.y += cos(uTime * moveSpeed * 0.8 + random * 8.0) * uChaos * 1.5;
                    pos.z += sin(uTime * moveSpeed * 0.6 + random * 6.0) * uChaos * 1.0;
                    
                    // Mouse attraction/repulsion based on focus
                    vec2 mouseEffect = uMouse * uFocus * 10.0;
                    pos.x += mouseEffect.x * (1.0 - random);
                    pos.y += mouseEffect.y * (1.0 - random);
                    
                    // Spiral around center
                    float angle = uTime * 0.1 * uEnergy + random * 6.28;
                    float spiralRadius = 3.0 + random * 5.0;
                    pos.x += cos(angle) * spiralRadius * uEnergy * 0.1;
                    pos.y += sin(angle) * spiralRadius * uEnergy * 0.1;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    float sizeBase = size * (100.0 / -mvPosition.z);
                    gl_PointSize = sizeBase * (0.5 + uEnergy * 0.5);
                    
                    gl_Position = projectionMatrix * mvPosition;
                    
                    vAlpha = (0.3 + random * 0.7) * (0.5 + uEnergy * 0.5);
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                varying float vRandom;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
                    
                    // Core glow
                    vec3 color = vec3(1.0, 0.0, 0.0);
                    if (vRandom > 0.7) {
                        color = vec3(1.0, 0.5, 0.5);
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.streamParticles = new THREE.Points(streamGeometry, streamMaterial);
        this.entityGroup.add(this.streamParticles);
        
        this.scene.add(this.entityGroup);
        
        this.entity = this.entityGroup;
    }
    
    createField() {
        const gridGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        const gridMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float uTime;
                uniform vec2 uMouse;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Wave effect
                    float wave = sin(position.x * 0.1 + uTime * 0.5) * 
                                  cos(position.y * 0.1 + uTime * 0.3) * 2.0;
                    
                    vec3 newPosition = position;
                    newPosition.z += wave;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float uTime;
                uniform vec2 uMouse;
                
                void main() {
                    // Grid pattern
                    vec2 grid = abs(fract(vPosition.xy * 0.1) - 0.5);
                    float line = min(grid.x, grid.y);
                    float gridAlpha = 1.0 - smoothstep(0.0, 0.05, line);
                    
                    // Distance fade
                    float dist = length(vPosition.xy);
                    float fade = 1.0 - smoothstep(20.0, 50.0, dist);
                    
                    // Mouse influence
                    vec2 mouseEffect = uMouse * 0.5;
                    float mouseDist = length(vPosition.xy - mouseEffect * 30.0);
                    float mouseGlow = smoothstep(15.0, 0.0, mouseDist) * 0.3;
                    
                    vec3 color = vec3(1.0, 0.0, 0.0);
                    float alpha = (gridAlpha * 0.15 + mouseGlow) * fade;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.grid = new THREE.Mesh(gridGeometry, gridMaterial);
        this.grid.position.z = -20;
        this.scene.add(this.grid);
    }
    
    addAmbientParticles() {
        const dustCount = 2000;
        const dustGeometry = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        
        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 80;
            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        
        const dustMaterial = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 0.15,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        this.dustParticles = new THREE.Points(dustGeometry, dustMaterial);
        this.scene.add(this.dustParticles);
    }
    
    addEventListeners() {
        document.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                this.targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        });
        
        window.addEventListener('resize', () => this.onResize());
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setSection(section) {
        if (section === this.currentSection) return;
        
        this.currentSection = section;
        
        const states = {
            home: {
                energy: 0.7,
                focus: 0.6,
                chaos: 0.4,
                breathe: 1
            },
            about: {
                energy: 0.4,
                focus: 0.8,
                chaos: 0.2,
                breathe: 0.5
            },
            works: {
                energy: 0.6,
                focus: 0.9,
                chaos: 0.3,
                breathe: 0.8
            },
            contact: {
                energy: 0.5,
                focus: 0.5,
                chaos: 0.2,
                breathe: 0.6
            }
        };
        
        this.targetState = states[section] || states.home;
        this.stateTransition = 0;
        
        this.triggerReaction();
    }
    
    triggerReaction() {
        const originalEnergy = this.entityMood.energy;
        this.entityMood.energy = 1.5;
        
        setTimeout(() => {
            this.entityMood.energy = originalEnergy;
        }, 300);
    }
    
    updateState(deltaTime) {
        if (!this.targetState) return;
        
        this.stateTransition += deltaTime * 0.001;
        const t = Math.min(this.stateTransition, 1);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        this.entityMood.energy += (this.targetState.energy - this.entityMood.energy) * ease * 0.05;
        this.entityMood.focus += (this.targetState.focus - this.entityMood.focus) * ease * 0.05;
        this.entityMood.chaos += (this.targetState.chaos - this.entityMood.chaos) * ease * 0.05;
        this.entityMood.breathe += (this.targetState.breathe - this.entityMood.breathe) * ease * 0.05;
    }
    
    updateNodes(time) {
        if (!this.nodes) return;
        
        const positions = this.nodes.geometry.attributes.position.array;
        
        for (let i = 0; i < this.nodeCount; i++) {
            const vel = this.nodeVelocities[i];
            
            vel.theta += vel.speed * 0.01 * this.entityMood.energy;
            
            const yOffset = Math.sin(time * 0.5 + vel.yOffset) * 0.5 * this.entityMood.chaos;
            
            positions[i * 3] = vel.radius * Math.sin(vel.phi) * Math.cos(vel.theta);
            positions[i * 3 + 1] = vel.radius * Math.sin(vel.phi) * Math.sin(vel.theta) + yOffset;
            positions[i * 3 + 2] = vel.radius * Math.cos(vel.phi);
        }
        
        this.nodes.geometry.attributes.position.needsUpdate = true;
        
        this.updateConnections(positions);
    }
    
    updateConnections(positions) {
        if (!this.connections) return;
        
        const connPositions = this.connections.geometry.attributes.position.array;
        let idx = 0;
        
        for (let i = 0; i < this.nodeCount; i++) {
            for (let j = i + 1; j < this.nodeCount; j++) {
                const i3 = i * 3;
                const j3 = j * 3;
                
                const dx = positions[i3] - positions[j3];
                const dy = positions[i3 + 1] - positions[j3 + 1];
                const dz = positions[i3 + 2] - positions[j3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < this.connectionDistance * (2 - this.entityMood.focus)) {
                    connPositions[idx++] = positions[i3];
                    connPositions[idx++] = positions[i3 + 1];
                    connPositions[idx++] = positions[i3 + 2];
                    connPositions[idx++] = positions[j3];
                    connPositions[idx++] = positions[j3 + 1];
                    connPositions[idx++] = positions[j3 + 2];
                }
            }
        }
        
        for (let i = idx; i < connPositions.length; i++) {
            connPositions[i] = 0;
        }
        
        this.connections.geometry.attributes.position.needsUpdate = true;
        
        this.connections.material.opacity = 0.1 + this.entityMood.focus * 0.15;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta() * 1000;
        this.time += deltaTime * 0.001;
        
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;
        
        this.updateState(deltaTime);
        
        if (this.core) {
            this.core.material.uniforms.uTime.value = this.time;
            this.core.material.uniforms.uEnergy.value = this.entityMood.energy;
            this.core.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
            this.core.rotation.y += 0.002 * this.entityMood.energy;
            this.core.rotation.x += 0.001 * this.entityMood.energy;
        }
        
        if (this.streamParticles) {
            this.streamParticles.material.uniforms.uTime.value = this.time;
            this.streamParticles.material.uniforms.uEnergy.value = this.entityMood.energy;
            this.streamParticles.material.uniforms.uChaos.value = this.entityMood.chaos;
            this.streamParticles.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
            this.streamParticles.material.uniforms.uFocus.value = this.entityMood.focus;
        }
        
        this.updateNodes(this.time);
        
        if (this.grid) {
            this.grid.material.uniforms.uTime.value = this.time;
            this.grid.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
            this.grid.rotation.z = this.time * 0.02 * this.entityMood.chaos;
        }
        
        if (this.dustParticles) {
            this.dustParticles.rotation.y += 0.0002;
            this.dustParticles.rotation.x += 0.0001;
        }
        
        if (this.entityGroup) {
            this.entityGroup.position.x = this.mouse.x * 3;
            this.entityGroup.position.y = this.mouse.y * 2;
            this.entityGroup.rotation.z = this.time * 0.05 * this.entityMood.chaos;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.neuralEntity = new NeuralEntity();
});
