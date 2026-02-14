import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log('恒星系模拟器启动...');

const AU = 1.496e11;
const EARTH_MASS = 5.972e24;
const SOLAR_MASS = 1.989e30;
const G = 6.674e-11;

const SCALE_DISTANCE = 50 / AU;

const STAR_TYPES = [
    { name: '红矮星', temp: 3000, color: 0xff4500, glowColor: 0xff6633, massRange: [0.08, 0.5] },
    { name: '橙色恒星', temp: 4000, color: 0xff8c00, glowColor: 0xffaa44, massRange: [0.5, 0.8] },
    { name: '黄矮星', temp: 5500, color: 0xffdd44, glowColor: 0xffff88, massRange: [0.8, 1.2] },
    { name: '黄白恒星', temp: 7000, color: 0xffffcc, glowColor: 0xffffff, massRange: [1.2, 1.5] },
    { name: '白色恒星', temp: 10000, color: 0xf0f8ff, glowColor: 0xe0f0ff, massRange: [1.5, 2.5] },
    { name: '蓝白恒星', temp: 20000, color: 0xb0e0ff, glowColor: 0x88ccff, massRange: [2.5, 10] },
    { name: '蓝巨星', temp: 30000, color: 0x6495ed, glowColor: 0x4488ff, massRange: [10, 50] }
];

const PLANET_DATA = [
    { name: '水星型', type: '岩石行星', baseColor: 0x8c7853, detail: 'rocky', sizeRange: [1.5, 2.5] },
    { name: '金星型', type: '岩石行星', baseColor: 0xe6c87a, detail: 'cloudy', sizeRange: [2.0, 3.0] },
    { name: '地球型', type: '类地行星', baseColor: 0x4a90d9, detail: 'earth', sizeRange: [2.5, 3.5] },
    { name: '火星型', type: '岩石行星', baseColor: 0xcd5c5c, detail: 'desert', sizeRange: [1.8, 2.8] },
    { name: '木星型', type: '气态巨行星', baseColor: 0xdaa06d, detail: 'gas', sizeRange: [6.0, 9.0] },
    { name: '土星型', type: '气态巨行星', baseColor: 0xfad6a5, detail: 'gas', hasRings: true, sizeRange: [5.0, 8.0] },
    { name: '天王星型', type: '冰巨行星', baseColor: 0x87ceeb, detail: 'ice', sizeRange: [3.5, 5.0] },
    { name: '海王星型', type: '冰巨行星', baseColor: 0x4169e1, detail: 'ice', sizeRange: [3.5, 5.0] }
];

const REAL_SECONDS_PER_GAME_YEAR = 60;

class SolarSystemSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.bodies = [];
        this.star = null;
        this.planets = [];
        
        this.timeScale = 1;
        this.paused = false;
        this.gameYear = 1;
        this.galaxyNumber = this.generateGalaxyNumber();
        
        this.targetPosition = null;
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.lerpFactor = 0.05;
        
        this.clock = new THREE.Clock();
        
        this.init();
        this.createStarSystem();
        this.setupUI();
        this.animate();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000005);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 100, 200);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 2000;
        this.controls.target.set(0, 0, 0);
        
        this.createStarfield();
        
        window.addEventListener('resize', () => this.onResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        
        console.log('初始化完成');
    }
    
    createStarfield() {
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 3000 + Math.random() * 4000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            const brightness = 0.6 + Math.random() * 0.4;
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = brightness;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });
        
        this.scene.add(new THREE.Points(geometry, material));
    }
    
    createStarGlow(radius, glowColor) {
        const glowGroup = new THREE.Group();
        
        const color = new THREE.Color(glowColor);
        
        const layers = [
            { scale: 1.3, opacity: 0.4 },
            { scale: 1.6, opacity: 0.25 },
            { scale: 2.0, opacity: 0.15 },
            { scale: 2.5, opacity: 0.08 },
            { scale: 3.5, opacity: 0.04 }
        ];
        
        layers.forEach(layer => {
            const glowGeo = new THREE.SphereGeometry(radius * layer.scale, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: layer.opacity,
                side: THREE.BackSide
            });
            glowGroup.add(new THREE.Mesh(glowGeo, glowMat));
        });
        
        return glowGroup;
    }
    
    noise2D(x, y, seed) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
        return n - Math.floor(n);
    }
    
    fractalNoise(x, y, seed, octaves) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise2D(x * frequency, y * frequency, seed + i * 100);
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    }
    
    createStarTexture(starColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const color = new THREE.Color(starColor);
        const baseR = color.r;
        const baseG = color.g;
        const baseB = color.b;
        
        const imageData = ctx.createImageData(512, 256);
        const data = imageData.data;
        
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 512; x++) {
                const i = (y * 512 + x) * 4;
                
                const granule = this.fractalNoise(x * 0.05, y * 0.05, 42, 4);
                const spots = this.noise2D(x * 0.02, y * 0.02, 123);
                
                let brightness = 0.85 + granule * 0.15;
                
                if (spots > 0.7) {
                    brightness -= (spots - 0.7) * 1.2;
                }
                
                brightness = Math.max(0.3, Math.min(1, brightness));
                
                const r = Math.floor(baseR * 255 * brightness);
                const g = Math.floor(baseG * 255 * brightness);
                const b = Math.floor(baseB * 255 * brightness);
                
                data[i] = Math.min(255, r + 30);
                data[i + 1] = Math.min(255, g + 20);
                data[i + 2] = Math.min(255, b + 10);
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }
    
    createPlanetTexture(type, baseColor, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const color = new THREE.Color(baseColor);
        const r = Math.floor(color.r * 255);
        const g = Math.floor(color.g * 255);
        const b = Math.floor(color.b * 255);
        
        const imageData = ctx.createImageData(512, 256);
        const data = imageData.data;
        
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 512; x++) {
                const i = (y * 512 + x) * 4;
                
                const nx = x / 512;
                const ny = y / 256;
                
                let detail = 0;
                let colorMod = [1, 1, 1];
                
                switch (type.detail) {
                    case 'rocky':
                        detail = this.fractalNoise(x * 0.03, y * 0.03, seed, 5);
                        const craters = Math.max(0, 1 - this.noise2D(x * 0.01, y * 0.01, seed + 50) * 3);
                        detail = detail * 0.7 + craters * 0.3;
                        colorMod = [0.9 + detail * 0.2, 0.85 + detail * 0.15, 0.8 + detail * 0.1];
                        break;
                        
                    case 'cloudy':
                        detail = this.fractalNoise(x * 0.02, y * 0.015, seed, 4);
                        const swirl = Math.sin(nx * 20 + detail * 5) * 0.1;
                        detail += swirl;
                        colorMod = [1, 0.95 + detail * 0.1, 0.6 + detail * 0.3];
                        break;
                        
                    case 'earth':
                        const terrain = this.fractalNoise(x * 0.02, y * 0.02, seed, 6);
                        const clouds = this.fractalNoise(x * 0.015, y * 0.015, seed + 100, 4);
                        
                        if (terrain > 0.45) {
                            colorMod = [0.3 + terrain * 0.3, 0.5 + terrain * 0.4, 0.2 + terrain * 0.2];
                        } else {
                            colorMod = [0.1 + terrain * 0.2, 0.3 + terrain * 0.3, 0.6 + terrain * 0.3];
                        }
                        
                        if (clouds > 0.5) {
                            const cloudBlend = (clouds - 0.5) * 2;
                            colorMod[0] = colorMod[0] * (1 - cloudBlend) + 0.95 * cloudBlend;
                            colorMod[1] = colorMod[1] * (1 - cloudBlend) + 0.95 * cloudBlend;
                            colorMod[2] = colorMod[2] * (1 - cloudBlend) + 0.95 * cloudBlend;
                        }
                        break;
                        
                    case 'desert':
                        detail = this.fractalNoise(x * 0.025, y * 0.025, seed, 5);
                        const dunes = Math.sin(nx * 50 + detail * 10) * 0.15;
                        detail += dunes;
                        colorMod = [1 + detail * 0.1, 0.6 + detail * 0.2, 0.4 + detail * 0.1];
                        break;
                        
                    case 'gas':
                        const bands = Math.sin(ny * 30 + this.noise2D(nx * 5, ny * 5, seed) * 2);
                        detail = this.fractalNoise(x * 0.01, y * 0.02, seed, 3);
                        const storm = this.noise2D(x * 0.005, y * 0.01, seed + 200);
                        
                        let bandColor = bands > 0 ? 1 : 0.85;
                        if (storm > 0.8) {
                            bandColor = 1.2;
                        }
                        
                        colorMod = [bandColor, bandColor * 0.85 + detail * 0.1, bandColor * 0.6];
                        break;
                        
                    case 'ice':
                        detail = this.fractalNoise(x * 0.02, y * 0.02, seed, 4);
                        const ice = Math.sin(nx * 10 + detail * 3) * 0.2;
                        detail += ice;
                        colorMod = [0.9 + detail * 0.1, 0.95 + detail * 0.05, 1];
                        break;
                }
                
                const finalR = Math.floor(Math.max(0, Math.min(255, r * colorMod[0])));
                const finalG = Math.floor(Math.max(0, Math.min(255, g * colorMod[1])));
                const finalB = Math.floor(Math.max(0, Math.min(255, b * colorMod[2])));
                
                data[i] = finalR;
                data[i + 1] = finalG;
                data[i + 2] = finalB;
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    createMoonTexture(seed) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(256, 128);
        const data = imageData.data;
        
        for (let y = 0; y < 128; y++) {
            for (let x = 0; x < 256; x++) {
                const i = (y * 256 + x) * 4;
                
                const base = this.fractalNoise(x * 0.04, y * 0.04, seed, 4);
                
                let brightness = 100 + base * 80;
                
                const craterCount = 15;
                for (let c = 0; c < craterCount; c++) {
                    const cx = this.noise2D(c * 7.3, seed, 0) * 256;
                    const cy = this.noise2D(c * 7.3, seed, 1) * 128;
                    const cr = 5 + this.noise2D(c * 7.3, seed, 2) * 15;
                    
                    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    if (dist < cr) {
                        const rim = dist > cr * 0.7 ? 1.3 : 0.7;
                        brightness *= rim;
                    }
                }
                
                brightness = Math.max(60, Math.min(180, brightness));
                
                data[i] = Math.floor(brightness);
                data[i + 1] = Math.floor(brightness * 0.98);
                data[i + 2] = Math.floor(brightness * 0.95);
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }
    
    createRings(innerRadius, outerRadius, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(512, 64);
        const data = imageData.data;
        
        for (let y = 0; y < 64; y++) {
            for (let x = 0; x < 512; x++) {
                const i = (y * 512 + x) * 4;
                
                const ring = x / 512;
                const noise = this.noise2D(x * 0.1, y * 0.5, seed);
                
                let alpha = 0.3 + noise * 0.4;
                
                if (ring < 0.1 || ring > 0.9) {
                    alpha *= (ring < 0.1 ? ring * 10 : (1 - ring) * 10);
                }
                
                const gaps = [
                    { pos: 0.3, width: 0.02 },
                    { pos: 0.5, width: 0.01 },
                    { pos: 0.7, width: 0.015 }
                ];
                
                gaps.forEach(gap => {
                    if (Math.abs(ring - gap.pos) < gap.width) {
                        alpha *= 0.2;
                    }
                });
                
                const brightness = 180 + noise * 50;
                
                data[i] = Math.floor(brightness);
                data[i + 1] = Math.floor(brightness * 0.9);
                data[i + 2] = Math.floor(brightness * 0.7);
                data[i + 3] = Math.floor(alpha * 255);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const geo = new THREE.RingGeometry(innerRadius, outerRadius, 128);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            opacity: 0.9
        });
        
        const rings = new THREE.Mesh(geo, mat);
        rings.rotation.x = Math.PI / 2;
        return rings;
    }
    
    createStarSystem() {
        const starTypeIndex = Math.floor(Math.random() * STAR_TYPES.length);
        const starType = STAR_TYPES[starTypeIndex];
        const massMultiplier = starType.massRange[0] + Math.random() * (starType.massRange[1] - starType.massRange[0]);
        
        this.star = {
            name: starType.name,
            type: '恒星',
            mass: SOLAR_MASS * massMultiplier,
            temperature: starType.temp,
            starType: starType,
            mesh: null,
            glowGroup: null,
            position: new THREE.Vector3(0, 0, 0)
        };
        
        const starRadius = 12 + massMultiplier * 3;
        const starGeo = new THREE.SphereGeometry(starRadius, 64, 64);
        const starTexture = this.createStarTexture(starType.color);
        const starMat = new THREE.MeshBasicMaterial({ map: starTexture });
        
        this.star.mesh = new THREE.Mesh(starGeo, starMat);
        this.star.mesh.userData = { body: this.star };
        this.scene.add(this.star.mesh);
        
        this.star.glowGroup = this.createStarGlow(starRadius, starType.glowColor);
        this.scene.add(this.star.glowGroup);
        
        this.bodies.push(this.star);
        
        console.log(`恒星创建完成: ${starType.name}, 温度: ${starType.temp}K`);
        
        const planetCount = 3 + Math.floor(Math.random() * 8);
        let lastDistance = 0.6;
        
        for (let i = 0; i < planetCount; i++) {
            const minSpacing = 1.4;
            const maxSpacing = 2.0;
            const spacing = minSpacing + Math.random() * (maxSpacing - minSpacing);
            lastDistance *= spacing;
            
            const distance = lastDistance * AU * SCALE_DISTANCE;
            const mass = EARTH_MASS * (0.3 + Math.random() * 100);
            
            const planetTypeIndex = Math.floor(Math.random() * PLANET_DATA.length);
            const planetType = PLANET_DATA[planetTypeIndex];
            const seed = Math.random() * 10000;
            
            const sizeMin = planetType.sizeRange[0];
            const sizeMax = planetType.sizeRange[1];
            const radius = sizeMin + Math.random() * (sizeMax - sizeMin);
            
            const geo = new THREE.SphereGeometry(radius, 64, 64);
            const texture = this.createPlanetTexture(planetType, planetType.baseColor, seed);
            const mat = new THREE.MeshBasicMaterial({ map: texture });
            const mesh = new THREE.Mesh(geo, mat);
            
            const angle = Math.random() * Math.PI * 2;
            mesh.position.x = Math.cos(angle) * distance;
            mesh.position.z = Math.sin(angle) * distance;
            
            const orbitalPeriodYears = Math.pow(lastDistance, 1.5);
            
            const planetIndex = i + 1;
            const planet = {
                name: `行星 ${this.toRoman(planetIndex)}`,
                type: '行星',
                mass,
                radius: radius,
                distance,
                angle,
                orbitalPeriodYears,
                orbitalRadius: lastDistance,
                mesh,
                satellites: [],
                planetType,
                seed,
                index: planetIndex
            };
            
            mesh.userData = { body: planet };
            this.scene.add(mesh);
            this.planets.push(planet);
            this.bodies.push(planet);
            
            if (planetType.hasRings) {
                const rings = this.createRings(radius * 1.4, radius * 2.8, seed);
                mesh.add(rings);
            }
            
            const orbitGeo = new THREE.RingGeometry(distance - 0.3, distance + 0.3, 128);
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0x3366aa,
                transparent: true,
                opacity: 0.25,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.PI / 2;
            this.scene.add(orbit);
            
            const moonCount = (i >= 2 && mass > EARTH_MASS * 2) ? Math.floor(Math.random() * 4) + 1 : 0;
            for (let j = 0; j < moonCount; j++) {
                const moonRadius = 0.4 + Math.random() * 0.6;
                const moonDistance = radius * 1.5 + j * 1.5 + Math.random() * 1;
                const moonAngle = Math.random() * Math.PI * 2;
                const moonSeed = Math.random() * 10000;
                
                const moonGeo = new THREE.SphereGeometry(moonRadius, 32, 32);
                const moonTexture = this.createMoonTexture(moonSeed);
                const moonMat = new THREE.MeshBasicMaterial({ map: moonTexture });
                const moonMesh = new THREE.Mesh(moonGeo, moonMat);
                
                const moonOrbitalPeriodYears = 0.02 + Math.random() * 0.08;
                const moonIndex = j + 1;
                
                const moon = {
                    name: `${planet.name}-${this.toLowerRoman(moonIndex)}`,
                    type: '卫星',
                    mass: EARTH_MASS * 0.01,
                    radius: moonRadius,
                    distance: moonDistance,
                    orbitalRadius: moonDistance,
                    angle: moonAngle,
                    orbitalPeriodYears: moonOrbitalPeriodYears,
                    parentPlanet: planet,
                    mesh: moonMesh,
                    seed: moonSeed
                };
                
                moonMesh.userData = { body: moon };
                this.scene.add(moonMesh);
                planet.satellites.push(moon);
                this.bodies.push(moon);
            }
            
            console.log(`行星 ${planet.name} 创建完成，公转周期: ${orbitalPeriodYears.toFixed(2)}年, 卫星: ${moonCount}`);
        }
        
        console.log('星系创建完成，共', this.bodies.length, '个天体');
    }
    
    setupUI() {
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.paused = !this.paused;
            document.getElementById('btn-pause').textContent = this.paused ? '▶' : '⏸';
        });
        
        document.getElementById('btn-faster').addEventListener('click', () => {
            this.timeScale = Math.min(this.timeScale * 2, 10);
            document.getElementById('speed-display').textContent = `${this.timeScale}x`;
        });
        
        document.getElementById('btn-slower').addEventListener('click', () => {
            this.timeScale = Math.max(this.timeScale / 2, 0.1);
            document.getElementById('speed-display').textContent = `${this.timeScale.toFixed(1)}x`;
        });
        
        document.getElementById('btn-close').addEventListener('click', () => {
            document.getElementById('info-panel').classList.add('hidden');
        });
        
        document.getElementById('btn-destroy').addEventListener('click', () => {
            if (confirm('确定要毁灭这个星系吗？这将清除所有天体并生成新的星系。')) {
                this.destroyGalaxy();
            }
        });
        
        document.getElementById('btn-solar-system').addEventListener('click', () => {
            if (confirm('生成太阳系？当前星系将被替换。')) {
                this.createSolarSystem();
            }
        });
        
        this.uiVisible = true;
        document.getElementById('btn-toggle-ui').addEventListener('click', () => {
            this.uiVisible = !this.uiVisible;
            const btn = document.getElementById('btn-toggle-ui');
            const timePanel = document.getElementById('time-panel');
            const solarPanel = document.getElementById('solar-system-panel');
            const helpPanel = document.getElementById('help-panel');
            const hint = document.getElementById('hint');
            
            if (this.uiVisible) {
                timePanel.classList.remove('hidden');
                solarPanel.classList.remove('hidden');
                helpPanel.classList.remove('hidden');
                if (hint) hint.classList.remove('hidden');
                btn.textContent = '👁️';
                btn.classList.remove('active');
            } else {
                timePanel.classList.add('hidden');
                solarPanel.classList.add('hidden');
                helpPanel.classList.add('hidden');
                if (hint) hint.classList.add('hidden');
                btn.textContent = '👁️‍🗨️';
                btn.classList.add('active');
            }
        });
        
        this.setupAudio();
        this.setupHelp();
        this.updateGalaxyDisplay();
    }
    
    generateGalaxyNumber() {
        const prefixes = ['NGC', 'M', 'UGC', 'IC', 'PGC'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(Math.random() * 9000) + 1000;
        return `${prefix} ${number}`;
    }
    
    updateGalaxyDisplay() {
        document.getElementById('galaxy-label').textContent = this.galaxyNumber + '星系';
    }
    
    setupHelp() {
        const btnHelp = document.getElementById('btn-help');
        const btnCloseHelp = document.getElementById('btn-close-help');
        const helpModal = document.getElementById('help-modal');
        
        btnHelp.addEventListener('click', () => {
            helpModal.classList.remove('hidden');
        });
        
        btnCloseHelp.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });
        
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.add('hidden');
            }
        });
    }
    
    setupAudio() {
        this.audio = new Audio('assets/background.mp3');
        this.audio.loop = true;
        this.audio.volume = 0.3;
        this.isPlaying = false;
        this.hasAttemptedPlay = false;
        
        const btnMusic = document.getElementById('btn-music');
        const volumeSlider = document.getElementById('volume-slider');
        
        const startAudio = () => {
            if (!this.hasAttemptedPlay) {
                this.hasAttemptedPlay = true;
                this.isPlaying = true;
                btnMusic.classList.add('playing');
                btnMusic.textContent = '🔊';
                this.audio.play().catch(e => {
                    console.log('等待用户交互播放音乐:', e);
                });
            }
        };
        
        document.addEventListener('click', startAudio, { once: true });
        
        btnMusic.addEventListener('click', () => {
            if (this.isPlaying) {
                this.audio.pause();
                btnMusic.classList.remove('playing');
                btnMusic.textContent = '🎵';
            } else {
                this.audio.play().catch(e => {
                    console.log('音频播放失败:', e);
                });
                btnMusic.classList.add('playing');
                btnMusic.textContent = '🔊';
            }
            this.isPlaying = !this.isPlaying;
        });
        
        volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });
    }
    
    focusOnBody(body) {
        this.targetPosition = body.mesh.position.clone();
    }
    
    onClick(event) {
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        const meshes = this.bodies.filter(b => b.mesh).map(b => b.mesh);
        const intersects = raycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            let targetMesh = intersects[0].object;
            while (targetMesh && !targetMesh.userData.body) {
                targetMesh = targetMesh.parent;
            }
            if (targetMesh && targetMesh.userData.body) {
                const body = targetMesh.userData.body;
                this.showInfo(body);
                this.focusOnBody(body);
            }
        }
    }
    
    showInfo(body) {
        document.getElementById('info-panel').classList.remove('hidden');
        document.getElementById('body-name').textContent = body.name;
        document.getElementById('body-type').textContent = body.type;
        document.getElementById('body-mass').textContent = this.formatMass(body.mass);
        
        const planetTypeRow = document.getElementById('planet-type-row');
        const lifeRow = document.getElementById('life-row');
        const destroySection = document.getElementById('destroy-section');
        const radiusLabel = document.getElementById('radius-label');
        
        if (body.type === '恒星') {
            planetTypeRow.classList.add('hidden');
            lifeRow.classList.add('hidden');
            destroySection.classList.remove('hidden');
            radiusLabel.textContent = '表面温度';
            document.getElementById('body-radius').textContent = body.temperature ? `${body.temperature.toLocaleString()} K` : '-';
            document.getElementById('body-orbital-radius').textContent = '-';
            document.getElementById('body-orbital-period').textContent = '-';
        } else if (body.type === '卫星') {
            planetTypeRow.classList.add('hidden');
            lifeRow.classList.add('hidden');
            destroySection.classList.add('hidden');
            radiusLabel.textContent = '半径';
            document.getElementById('body-radius').textContent = `${body.radius.toFixed(1)} 单位`;
            document.getElementById('body-orbital-radius').textContent = `${body.orbitalRadius.toFixed(1)} 单位`;
            document.getElementById('body-orbital-period').textContent = 
                body.orbitalPeriodYears ? `${(body.orbitalPeriodYears * 365.25).toFixed(1)} 天` : '-';
        } else {
            destroySection.classList.add('hidden');
            planetTypeRow.classList.remove('hidden');
            lifeRow.classList.remove('hidden');
            radiusLabel.textContent = '半径';
            document.getElementById('body-radius').textContent = `${body.radius.toFixed(1)} 单位`;
            document.getElementById('body-planet-type').textContent = body.planetType ? body.planetType.type : '-';
            document.getElementById('body-orbital-radius').textContent = `${body.orbitalRadius.toFixed(2)} AU`;
            document.getElementById('body-orbital-period').textContent = 
                body.orbitalPeriodYears ? `${body.orbitalPeriodYears.toFixed(3)} 年` : '-';
            
            const lifeEl = document.getElementById('body-life');
            if (body.orbitalRadius >= 0.8 && body.orbitalRadius <= 1.5) {
                lifeEl.textContent = body.planetType && body.planetType.detail === 'earth' ? '可能存在生命' : '无生命迹象';
                lifeEl.className = 'info-value ' + (lifeEl.textContent.includes('可能') ? 'life-possible' : 'life-no');
            } else {
                lifeEl.textContent = '无生命迹象';
                lifeEl.className = 'info-value life-no';
            }
        }
        
        const satSection = document.getElementById('satellites-section');
        const satList = document.getElementById('satellites-list');
        satList.innerHTML = '';
        
        if (body.satellites && body.satellites.length > 0) {
            satSection.classList.remove('hidden');
            body.satellites.forEach(moon => {
                const li = document.createElement('li');
                li.textContent = moon.name;
                li.addEventListener('click', () => {
                    this.showInfo(moon);
                    this.focusOnBody(moon);
                });
                satList.appendChild(li);
            });
        } else {
            satSection.classList.add('hidden');
        }
    }
    
    toRoman(num) {
        const romanNumerals = [
            ['X', 10], ['IX', 9], ['VIII', 8], ['VII', 7], 
            ['VI', 6], ['V', 5], ['IV', 4], ['III', 3], 
            ['II', 2], ['I', 1]
        ];
        let result = '';
        for (const [roman, value] of romanNumerals) {
            while (num >= value) {
                result += roman;
                num -= value;
            }
        }
        return result;
    }
    
    toLowerRoman(num) {
        return this.toRoman(num).toLowerCase();
    }
    
    destroyGalaxy() {
        document.getElementById('info-panel').classList.add('hidden');
        
        this.bodies.forEach(body => {
            if (body.mesh) {
                this.scene.remove(body.mesh);
                if (body.mesh.geometry) body.mesh.geometry.dispose();
                if (body.mesh.material) {
                    if (body.mesh.material.map) body.mesh.material.map.dispose();
                    body.mesh.material.dispose();
                }
            }
            if (body.orbitLine) {
                this.scene.remove(body.orbitLine);
            }
        });
        
        if (this.star && this.star.glowGroup) {
            this.scene.remove(this.star.glowGroup);
        }
        
        const orbits = this.scene.children.filter(child => 
            child.geometry && child.geometry.type === 'RingGeometry'
        );
        orbits.forEach(orbit => {
            this.scene.remove(orbit);
            orbit.geometry.dispose();
            orbit.material.dispose();
        });
        
        this.bodies = [];
        this.planets = [];
        this.star = null;
        this.gameYear = 1;
        document.getElementById('year-value').textContent = '1';
        
        this.cameraTarget.set(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.camera.position.set(0, 100, 200);
        
        this.galaxyNumber = this.generateGalaxyNumber();
        this.updateGalaxyDisplay();
        
        this.createStarSystem();
        
        console.log('星系已毁灭并重新生成');
    }
    
    createSolarSystem() {
        document.getElementById('info-panel').classList.add('hidden');
        
        this.bodies.forEach(body => {
            if (body.mesh) {
                this.scene.remove(body.mesh);
                if (body.mesh.geometry) body.mesh.geometry.dispose();
                if (body.mesh.material) {
                    if (body.mesh.material.map) body.mesh.material.map.dispose();
                    body.mesh.material.dispose();
                }
            }
        });
        
        if (this.star && this.star.glowGroup) {
            this.scene.remove(this.star.glowGroup);
        }
        
        const orbits = this.scene.children.filter(child => 
            child.geometry && child.geometry.type === 'RingGeometry'
        );
        orbits.forEach(orbit => {
            this.scene.remove(orbit);
            orbit.geometry.dispose();
            orbit.material.dispose();
        });
        
        this.bodies = [];
        this.planets = [];
        this.star = null;
        this.gameYear = 1;
        document.getElementById('year-value').textContent = '1';
        
        this.cameraTarget.set(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.camera.position.set(0, 100, 200);
        
        this.galaxyNumber = '太阳系';
        this.updateGalaxyDisplay();
        
        const sunType = STAR_TYPES[2];
        this.star = {
            name: '太阳',
            type: '恒星',
            mass: SOLAR_MASS,
            temperature: 5778,
            starType: sunType,
            mesh: null,
            glowGroup: null,
            position: new THREE.Vector3(0, 0, 0)
        };
        
        const starRadius = 15;
        const starGeo = new THREE.SphereGeometry(starRadius, 64, 64);
        const starTexture = this.createStarTexture(sunType.color);
        const starMat = new THREE.MeshBasicMaterial({ map: starTexture });
        
        this.star.mesh = new THREE.Mesh(starGeo, starMat);
        this.star.mesh.userData = { body: this.star };
        this.scene.add(this.star.mesh);
        
        this.star.glowGroup = this.createStarGlow(starRadius, sunType.glowColor);
        this.scene.add(this.star.glowGroup);
        
        this.bodies.push(this.star);
        
        const solarSystemData = [
            { name: '水星', type: PLANET_DATA[0], distance: 0.39, radius: 1.8, mass: 0.055, moons: 0 },
            { name: '金星', type: PLANET_DATA[1], distance: 0.72, radius: 2.5, mass: 0.815, moons: 0 },
            { name: '地球', type: PLANET_DATA[2], distance: 1.0, radius: 2.8, mass: 1.0, moons: 1 },
            { name: '火星', type: PLANET_DATA[3], distance: 1.52, radius: 2.0, mass: 0.107, moons: 2 },
            { name: '木星', type: PLANET_DATA[4], distance: 5.2, radius: 7.5, mass: 317.8, moons: 4 },
            { name: '土星', type: PLANET_DATA[5], distance: 9.5, radius: 6.5, mass: 95.2, moons: 3 },
            { name: '天王星', type: PLANET_DATA[6], distance: 19.2, radius: 4.0, mass: 14.5, moons: 2 },
            { name: '海王星', type: PLANET_DATA[7], distance: 30.0, radius: 3.8, mass: 17.1, moons: 1 }
        ];
        
        solarSystemData.forEach((data, i) => {
            const distance = data.distance * AU * SCALE_DISTANCE;
            const seed = 1000 + i * 100;
            
            const geo = new THREE.SphereGeometry(data.radius, 64, 64);
            const texture = this.createPlanetTexture(data.type, data.type.baseColor, seed);
            const mat = new THREE.MeshBasicMaterial({ map: texture });
            const mesh = new THREE.Mesh(geo, mat);
            
            const angle = Math.random() * Math.PI * 2;
            mesh.position.x = Math.cos(angle) * distance;
            mesh.position.z = Math.sin(angle) * distance;
            
            const orbitalPeriodYears = Math.pow(data.distance, 1.5);
            
            const planet = {
                name: data.name,
                type: '行星',
                mass: EARTH_MASS * data.mass,
                radius: data.radius,
                distance,
                angle,
                orbitalPeriodYears,
                orbitalRadius: data.distance,
                mesh,
                satellites: [],
                planetType: data.type,
                seed,
                index: i + 1
            };
            
            mesh.userData = { body: planet };
            this.scene.add(mesh);
            this.planets.push(planet);
            this.bodies.push(planet);
            
            if (data.type.hasRings) {
                const rings = this.createRings(data.radius * 1.4, data.radius * 2.8, seed);
                mesh.add(rings);
            }
            
            const orbitGeo = new THREE.RingGeometry(distance - 0.3, distance + 0.3, 128);
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0x3366aa,
                transparent: true,
                opacity: 0.25,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.PI / 2;
            this.scene.add(orbit);
            
            for (let j = 0; j < data.moons; j++) {
                let moonName, moonRadius, moonOrbitalPeriodYears, moonMass;
                
                if (data.name === '地球' && j === 0) {
                    moonName = '月球';
                    moonRadius = 0.75;
                    moonOrbitalPeriodYears = 27.3 / 365.25;
                    moonMass = EARTH_MASS * 0.0123;
                } else {
                    moonName = `${data.name}-${this.toLowerRoman(j + 1)}`;
                    moonRadius = 0.4 + Math.random() * 0.4;
                    moonOrbitalPeriodYears = 0.02 + Math.random() * 0.06;
                    moonMass = EARTH_MASS * 0.01;
                }
                
                const moonDistance = data.radius * 1.5 + j * 1.5 + Math.random() * 1;
                const moonAngle = Math.random() * Math.PI * 2;
                const moonSeed = 2000 + i * 100 + j;
                
                const moonGeo = new THREE.SphereGeometry(moonRadius, 32, 32);
                const moonTexture = this.createMoonTexture(moonSeed);
                const moonMat = new THREE.MeshBasicMaterial({ map: moonTexture });
                const moonMesh = new THREE.Mesh(moonGeo, moonMat);
                
                const moon = {
                    name: moonName,
                    type: '卫星',
                    mass: moonMass,
                    radius: moonRadius,
                    distance: moonDistance,
                    orbitalRadius: moonDistance,
                    angle: moonAngle,
                    orbitalPeriodYears: moonOrbitalPeriodYears,
                    parentPlanet: planet,
                    mesh: moonMesh,
                    seed: moonSeed
                };
                
                moonMesh.userData = { body: moon };
                this.scene.add(moonMesh);
                planet.satellites.push(moon);
                this.bodies.push(moon);
            }
            
            console.log(`${data.name} 创建完成，公转周期: ${orbitalPeriodYears.toFixed(2)}年`);
        });
        
        console.log('太阳系创建完成，共', this.bodies.length, '个天体');
    }
    
    formatMass(mass) {
        if (mass >= SOLAR_MASS * 0.1) {
            return `${(mass / SOLAR_MASS).toFixed(2)} 太阳质量`;
        } else if (mass >= EARTH_MASS * 0.1) {
            return `${(mass / EARTH_MASS).toFixed(2)} 地球质量`;
        }
        return `${(mass / EARTH_MASS).toFixed(4)} 地球质量`;
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        const delta = this.clock.getDelta();
        
        if (!this.paused) {
            const gameYearsPerSecond = this.timeScale / REAL_SECONDS_PER_GAME_YEAR;
            const gameYearsPassed = delta * gameYearsPerSecond;
            
            this.gameYear += gameYearsPassed;
            document.getElementById('year-value').textContent = Math.floor(this.gameYear);
            
            this.planets.forEach(planet => {
                const angularSpeed = (2 * Math.PI) / planet.orbitalPeriodYears;
                planet.angle += angularSpeed * gameYearsPassed;
                
                planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
                planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
                planet.mesh.rotation.y += delta * 0.3;
                
                planet.satellites.forEach(moon => {
                    const moonAngularSpeed = (2 * Math.PI) / moon.orbitalPeriodYears;
                    moon.angle += moonAngularSpeed * gameYearsPassed;
                    
                    moon.mesh.position.x = planet.mesh.position.x + Math.cos(moon.angle) * moon.distance;
                    moon.mesh.position.z = planet.mesh.position.z + Math.sin(moon.angle) * moon.distance;
                    moon.mesh.position.y = Math.sin(moon.angle * 0.3) * 0.5;
                });
            });
        }
        
        if (this.targetPosition) {
            this.cameraTarget.lerp(this.targetPosition, this.lerpFactor);
            this.controls.target.copy(this.cameraTarget);
            
            if (this.cameraTarget.distanceTo(this.targetPosition) < 0.5) {
                this.targetPosition = null;
            }
        }
        
        this.controls.update();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new SolarSystemSimulator();
