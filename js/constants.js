export const G = 6.674e-11;
export const AU = 1.496e11;
export const SOLAR_MASS = 1.989e30;
export const EARTH_MASS = 5.972e24;
export const SOLAR_RADIUS = 6.96e8;
export const EARTH_RADIUS = 6.371e6;
export const EARTH_YEAR_SECONDS = 365.25 * 24 * 3600;

export const SCALE = {
    distance: 50 / AU,
    starRadius: 10,
    planetRadiusMin: 1.5,
    planetRadiusMax: 5,
    moonRadiusMin: 0.3,
    moonRadiusMax: 0.8,
    time: 1
};

export const BODY_TYPES = {
    STAR: '恒星',
    PLANET: '行星',
    MOON: '卫星'
};

export const LIFE_STATUS = {
    YES: '已确认生命',
    POSSIBLE: '可能存在生命',
    NO: '无生命迹象'
};

export const PLANET_COLORS = {
    rocky: [0.6, 0.4, 0.3],
    gas: [0.8, 0.6, 0.4],
    ice: [0.7, 0.8, 0.9],
    earthlike: [0.2, 0.5, 0.3]
};

export function calculateOrbitalPeriod(semiMajorAxis, centralMass) {
    const a = semiMajorAxis;
    return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (G * centralMass));
}

export function calculateOrbitalVelocity(semiMajorAxis, centralMass) {
    return Math.sqrt(G * centralMass / semiMajorAxis);
}

export function formatMass(mass) {
    if (mass >= SOLAR_MASS * 0.1) {
        return `${(mass / SOLAR_MASS).toFixed(2)} 太阳质量`;
    } else if (mass >= EARTH_MASS * 0.1) {
        return `${(mass / EARTH_MASS).toFixed(2)} 地球质量`;
    } else {
        return `${mass.toExponential(2)} kg`;
    }
}

export function formatRadius(radius) {
    if (radius >= SOLAR_RADIUS * 0.1) {
        return `${(radius / SOLAR_RADIUS).toFixed(2)} 太阳半径`;
    } else if (radius >= EARTH_RADIUS * 0.1) {
        return `${(radius / EARTH_RADIUS).toFixed(2)} 地球半径`;
    } else {
        return `${(radius / 1000).toFixed(0)} km`;
    }
}

export function formatDistance(distance) {
    if (distance >= AU * 0.1) {
        return `${(distance / AU).toFixed(2)} AU`;
    } else {
        return `${(distance / 1000).toFixed(0)} km`;
    }
}

export function formatTime(seconds) {
    const years = seconds / EARTH_YEAR_SECONDS;
    if (years >= 1) {
        return `${years.toFixed(2)} 年`;
    } else {
        const days = seconds / (24 * 3600);
        if (days >= 1) {
            return `${days.toFixed(1)} 天`;
        } else {
            const hours = seconds / 3600;
            return `${hours.toFixed(1)} 小时`;
        }
    }
}

export function formatVelocity(velocity) {
    return `${(velocity / 1000).toFixed(2)} km/s`;
}
