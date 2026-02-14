import { Star, Planet, Moon } from './celestialBody.js';
import {
    AU, SOLAR_MASS, EARTH_MASS, SOLAR_RADIUS, EARTH_RADIUS,
    BODY_TYPES, LIFE_STATUS
} from './constants.js';

const PLANET_NAMES = [
    '赫利俄斯', '阿波罗', '阿瑞斯', '雅典娜', '波塞冬', 
    '哈迪斯', '赫拉', '赫尔墨斯', '阿芙洛狄忒', '德墨忒尔'
];

const MOON_NAMES = [
    '月影', '星尘', '幽光', '寒霜', '烈焰',
    '碧波', '苍穹', '晨曦', '暮色', '幻影'
];

export class GalaxyGenerator {
    constructor() {
        this.usedPlanetNames = [];
        this.usedMoonNames = [];
    }
    
    generateStarSystem() {
        const star = this.generateStar();
        const planetCount = 5 + Math.floor(Math.random() * 4);
        const planets = this.generatePlanets(star, planetCount);
        
        return {
            star,
            planets,
            allBodies: [star, ...planets, ...this.getAllMoons(planets)]
        };
    }
    
    generateStar() {
        const massVariation = 0.7 + Math.random() * 0.6;
        const mass = SOLAR_MASS * massVariation;
        const radius = SOLAR_RADIUS * Math.pow(massVariation, 0.8);
        
        return new Star({
            name: '主星',
            mass,
            radius,
            description: '这个恒星系的中心恒星'
        });
    }
    
    generatePlanets(star, count) {
        const planets = [];
        let lastOrbit = 0.3 + Math.random() * 0.2;
        
        for (let i = 0; i < count; i++) {
            const spacing = 1.4 + Math.random() * 0.8;
            lastOrbit *= spacing;
            
            const semiMajorAxis = lastOrbit * AU;
            const mass = this.generatePlanetMass(i, count);
            const radius = this.generatePlanetRadius(mass);
            const eccentricity = Math.random() * 0.15;
            const inclination = Math.random() * 0.1;
            
            const lifeStatus = this.determineLifeStatus(semiMajorAxis, mass);
            
            const planet = new Planet({
                name: this.getPlanetName(),
                mass,
                radius,
                semiMajorAxis,
                eccentricity,
                inclination,
                centralBody: star,
                lifeStatus,
                description: this.generatePlanetDescription(lifeStatus, mass)
            });
            
            const moonCount = this.determineMoonCount(mass);
            for (let j = 0; j < moonCount; j++) {
                const moon = this.generateMoon(planet, j);
                planet.addSatellite(moon);
            }
            
            planets.push(planet);
        }
        
        return planets;
    }
    
    generatePlanetMass(index, total) {
        const innerZone = total * 0.3;
        const outerZone = total * 0.7;
        
        if (index < innerZone) {
            return EARTH_MASS * (0.3 + Math.random() * 1.5);
        } else if (index < outerZone) {
            return EARTH_MASS * (0.5 + Math.random() * 10);
        } else {
            return EARTH_MASS * (10 + Math.random() * 300);
        }
    }
    
    generatePlanetRadius(mass) {
        const massRatio = mass / EARTH_MASS;
        let radiusRatio;
        
        if (massRatio < 1) {
            radiusRatio = Math.pow(massRatio, 0.3);
        } else if (massRatio < 10) {
            radiusRatio = Math.pow(massRatio, 0.5);
        } else {
            radiusRatio = Math.pow(massRatio, 0.3);
        }
        
        return EARTH_RADIUS * radiusRatio;
    }
    
    determineLifeStatus(orbitalRadius, mass) {
        const habitableInner = 0.8 * AU;
        const habitableOuter = 1.5 * AU;
        const massRatio = mass / EARTH_MASS;
        
        if (orbitalRadius >= habitableInner && orbitalRadius <= habitableOuter) {
            if (massRatio >= 0.5 && massRatio <= 5) {
                const lifeChance = Math.random();
                if (lifeChance < 0.3) {
                    return LIFE_STATUS.YES;
                } else if (lifeChance < 0.7) {
                    return LIFE_STATUS.POSSIBLE;
                }
            }
        }
        
        return LIFE_STATUS.NO;
    }
    
    determineMoonCount(planetMass) {
        const massRatio = planetMass / EARTH_MASS;
        
        if (massRatio < 0.5) return 0;
        if (massRatio < 2) return Math.floor(Math.random() * 2);
        if (massRatio < 20) return Math.floor(Math.random() * 3);
        return Math.floor(Math.random() * 5);
    }
    
    generateMoon(planet, index) {
        const moonMass = EARTH_MASS * (0.001 + Math.random() * 0.02);
        const moonRadius = EARTH_RADIUS * (0.1 + Math.random() * 0.2);
        const semiMajorAxis = (8 + index * 4 + Math.random() * 4) / SCALE.distance;
        
        return new Moon({
            name: this.getMoonName(),
            mass: moonMass,
            radius: moonRadius,
            semiMajorAxis,
            eccentricity: Math.random() * 0.05,
            centralBody: planet,
            initialAngle: Math.random() * Math.PI * 2
        });
    }
    
    generatePlanetDescription(lifeStatus, mass) {
        const massRatio = mass / EARTH_MASS;
        let type;
        
        if (massRatio < 0.5) type = '小型岩石行星';
        else if (massRatio < 2) type = '类地岩石行星';
        else if (massRatio < 10) type = '超级地球';
        else if (massRatio < 50) type = '冰巨星';
        else type = '气态巨星';
        
        if (lifeStatus === LIFE_STATUS.YES) {
            return `${type}，已发现生命迹象`;
        } else if (lifeStatus === LIFE_STATUS.POSSIBLE) {
            return `${type}，可能存在生命`;
        }
        return type;
    }
    
    getPlanetName() {
        const available = PLANET_NAMES.filter(n => !this.usedPlanetNames.includes(n));
        if (available.length === 0) {
            return `行星-${this.usedPlanetNames.length + 1}`;
        }
        const name = available[Math.floor(Math.random() * available.length)];
        this.usedPlanetNames.push(name);
        return name;
    }
    
    getMoonName() {
        const available = MOON_NAMES.filter(n => !this.usedMoonNames.includes(n));
        if (available.length === 0) {
            return `卫星-${this.usedMoonNames.length + 1}`;
        }
        const name = available[Math.floor(Math.random() * available.length)];
        this.usedMoonNames.push(name);
        return name;
    }
    
    getAllMoons(planets) {
        const moons = [];
        for (const planet of planets) {
            moons.push(...planet.satellites);
        }
        return moons;
    }
}
