import * as THREE from 'three';
import {
    G, AU, SOLAR_MASS, EARTH_MASS, SOLAR_RADIUS, EARTH_RADIUS,
    SCALE, BODY_TYPES, LIFE_STATUS, PLANET_COLORS,
    calculateOrbitalPeriod, calculateOrbitalVelocity
} from './constants.js';

class CelestialBody {
    constructor(config) {
        this.id = config.id || Math.random().toString(36).substr(2, 9);
        this.name = config.name;
        this.type = config.type;
        this.mass = config.mass;
        this.radius = config.radius;
        this.semiMajorAxis = config.semiMajorAxis || 0;
        this.eccentricity = config.eccentricity || 0;
        this.inclination = config.inclination || 0;
        this.centralBody = config.centralBody || null;
        this.lifeStatus = config.lifeStatus || LIFE_STATUS.NO;
        this.description = config.description || '';
        
        this.orbitalPeriod = 0;
        this.orbitalVelocity = 0;
        this.currentAngle = config.initialAngle || Math.random() * Math.PI * 2;
        this.satellites = [];
        
        this.mesh = null;
        this.orbitLine = null;
        this.glowMesh = null;
        
        if (this.centralBody && this.semiMajorAxis > 0) {
            this.orbitalPeriod = calculateOrbitalPeriod(this.semiMajorAxis, this.centralBody.mass);
            this.orbitalVelocity = calculateOrbitalVelocity(this.semiMajorAxis, this.centralBody.mass);
        }
        
        this.position = new THREE.Vector3(0, 0, 0);
    }
    
    createMesh() {
        let scaledRadius;
        
        if (this.type === BODY_TYPES.STAR) {
            scaledRadius = SCALE.starRadius;
        } else if (this.type === BODY_TYPES.MOON) {
            const massRatio = this.mass / EARTH_MASS;
            scaledRadius = SCALE.moonRadiusMin + 
                (SCALE.moonRadiusMax - SCALE.moonRadiusMin) * Math.min(massRatio / 0.02, 1);
        } else {
            const massRatio = this.mass / EARTH_MASS;
            scaledRadius = SCALE.planetRadiusMin + 
                (SCALE.planetRadiusMax - SCALE.planetRadiusMin) * Math.min(massRatio / 300, 1);
        }
        
        const geometry = new THREE.SphereGeometry(scaledRadius, 32, 32);
        
        let material;
        
        if (this.type === BODY_TYPES.STAR) {
            material = new THREE.MeshBasicMaterial({
                color: 0xffffaa,
            });
            this.createGlow(scaledRadius);
        } else {
            const color = this.getPlanetColor();
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color[0], color[1], color[2]),
                roughness: 0.8,
                metalness: 0.1
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = { body: this };
        
        this.updateInitialPosition();
        
        return this.mesh;
    }
    
    updateInitialPosition() {
        if (!this.centralBody || this.semiMajorAxis <= 0) {
            this.position.set(0, 0, 0);
        } else {
            const r = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity) / 
                     (1 + this.eccentricity * Math.cos(this.currentAngle));
            
            let x = r * Math.cos(this.currentAngle) * SCALE.distance;
            let z = r * Math.sin(this.currentAngle) * SCALE.distance;
            let y = r * Math.sin(this.currentAngle) * Math.sin(this.inclination) * SCALE.distance;
            
            if (this.type === BODY_TYPES.MOON && this.centralBody.position) {
                x += this.centralBody.position.x;
                y += this.centralBody.position.y;
                z += this.centralBody.position.z;
            }
            
            this.position.set(x, y, z);
        }
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    createGlow(radius) {
        const glowGeometry = new THREE.SphereGeometry(radius * 1.5, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xffdd44) },
                viewVector: { value: new THREE.Vector3() }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(glowColor, 1.0) * intensity;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);
    }
    
    getPlanetColor() {
        const massRatio = this.mass / EARTH_MASS;
        
        if (this.lifeStatus === LIFE_STATUS.YES) {
            return PLANET_COLORS.earthlike;
        } else if (massRatio < 2) {
            return PLANET_COLORS.rocky;
        } else if (massRatio < 50) {
            return PLANET_COLORS.earthlike;
        } else if (massRatio < 100) {
            return PLANET_COLORS.ice;
        } else {
            return PLANET_COLORS.gas;
        }
    }
    
    createOrbitLine() {
        if (!this.centralBody || this.semiMajorAxis <= 0) return null;
        
        const points = [];
        const segments = 128;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const r = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity) / 
                     (1 + this.eccentricity * Math.cos(angle));
            
            const x = r * Math.cos(angle) * SCALE.distance;
            const z = r * Math.sin(angle) * SCALE.distance;
            const y = r * Math.sin(angle) * Math.sin(this.inclination) * SCALE.distance;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x3366aa,
            transparent: true,
            opacity: 0.3
        });
        
        this.orbitLine = new THREE.Line(geometry, material);
        return this.orbitLine;
    }
    
    updatePosition(deltaTime, timeScale) {
        if (!this.centralBody || this.semiMajorAxis <= 0) {
            this.position.set(0, 0, 0);
        } else {
            const angularVelocity = (2 * Math.PI) / this.orbitalPeriod;
            this.currentAngle += angularVelocity * deltaTime * timeScale;
            
            const r = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity) / 
                     (1 + this.eccentricity * Math.cos(this.currentAngle));
            
            let x = r * Math.cos(this.currentAngle) * SCALE.distance;
            let z = r * Math.sin(this.currentAngle) * SCALE.distance;
            let y = r * Math.sin(this.currentAngle) * Math.sin(this.inclination) * SCALE.distance;
            
            if (this.type === BODY_TYPES.MOON && this.centralBody.position) {
                x += this.centralBody.position.x;
                y += this.centralBody.position.y;
                z += this.centralBody.position.z;
            }
            
            this.position.set(x, y, z);
        }
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    addSatellite(moon) {
        this.satellites.push(moon);
        moon.centralBody = this;
        moon.orbitalPeriod = calculateOrbitalPeriod(moon.semiMajorAxis, this.mass);
        moon.orbitalVelocity = calculateOrbitalVelocity(moon.semiMajorAxis, this.mass);
    }
    
    getInfo() {
        return {
            name: this.name,
            type: this.type,
            mass: this.mass,
            radius: this.radius,
            semiMajorAxis: this.semiMajorAxis,
            orbitalPeriod: this.orbitalPeriod,
            orbitalVelocity: this.orbitalVelocity,
            lifeStatus: this.lifeStatus,
            description: this.description,
            satellites: this.satellites.map(s => s.name)
        };
    }
}

export class Star extends CelestialBody {
    constructor(config) {
        super({
            ...config,
            type: BODY_TYPES.STAR,
            mass: config.mass || SOLAR_MASS,
            radius: config.radius || SOLAR_RADIUS
        });
    }
}

export class Planet extends CelestialBody {
    constructor(config) {
        super({
            ...config,
            type: BODY_TYPES.PLANET
        });
    }
}

export class Moon extends CelestialBody {
    constructor(config) {
        super({
            ...config,
            type: BODY_TYPES.MOON
        });
    }
}

export { CelestialBody };
