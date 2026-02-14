import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log('Three.js test starting...');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000022);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 100, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

console.log('Renderer created');

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const starGeometry = new THREE.SphereGeometry(15, 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const star = new THREE.Mesh(starGeometry, starMaterial);
scene.add(star);
console.log('Star created at origin');

const planetColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdfe6e9, 0x74b9ff];
const planets = [];

for (let i = 0; i < 6; i++) {
    const radius = 2 + Math.random() * 3;
    const distance = 40 + i * 30;
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: planetColors[i],
        roughness: 0.7,
        metalness: 0.1
    });
    const planet = new THREE.Mesh(geometry, material);
    
    const angle = Math.random() * Math.PI * 2;
    planet.position.x = Math.cos(angle) * distance;
    planet.position.z = Math.sin(angle) * distance;
    
    scene.add(planet);
    planets.push({ mesh: planet, distance, angle, speed: 0.0005 + Math.random() * 0.001 });
    
    const orbitGeometry = new THREE.RingGeometry(distance - 0.2, distance + 0.2, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x3366aa, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    
    console.log(`Planet ${i + 1} created at distance ${distance}`);
}

console.log('Scene children:', scene.children.length);

function animate() {
    requestAnimationFrame(animate);
    
    planets.forEach(p => {
        p.angle += p.speed;
        p.mesh.position.x = Math.cos(p.angle) * p.distance;
        p.mesh.position.z = Math.sin(p.angle) * p.distance;
    });
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('Animation started');
