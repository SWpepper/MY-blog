export class TimeSystem {
    constructor() {
        this.elapsedTime = 0;
        this.timeScale = 1;
        this.paused = false;
        this.speedLevels = [0.1, 0.5, 1, 2, 5, 10, 50, 100];
        this.speedIndex = 2;
        this.timeScale = this.speedLevels[this.speedIndex];
    }
    
    update(deltaTime) {
        if (this.paused) return 0;
        
        const scaledDelta = deltaTime * this.timeScale;
        this.elapsedTime += scaledDelta;
        return scaledDelta;
    }
    
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
    }
    
    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }
    
    speedUp() {
        if (this.speedIndex < this.speedLevels.length - 1) {
            this.speedIndex++;
            this.timeScale = this.speedLevels[this.speedIndex];
        }
        return this.timeScale;
    }
    
    slowDown() {
        if (this.speedIndex > 0) {
            this.speedIndex--;
            this.timeScale = this.speedLevels[this.speedIndex];
        }
        return this.timeScale;
    }
    
    getElapsedYears() {
        return this.elapsedTime / (365.25 * 24 * 3600);
    }
    
    getFormattedYear() {
        const years = this.getElapsedYears();
        return Math.floor(years) + 1;
    }
    
    getSpeedDisplay() {
        if (this.timeScale < 1) {
            return `${this.timeScale}x`;
        }
        return `${this.timeScale}x`;
    }
    
    isPaused() {
        return this.paused;
    }
    
    reset() {
        this.elapsedTime = 0;
        this.speedIndex = 2;
        this.timeScale = this.speedLevels[this.speedIndex];
        this.paused = false;
    }
}
