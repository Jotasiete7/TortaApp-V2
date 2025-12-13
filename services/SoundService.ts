export class SoundService {
    private static audioContext: AudioContext | null = null;
    private static volume: number = 0.5;
    private static muted: boolean = false;
    private static STORAGE_KEY = 'app_volume';
    private static MUTED_KEY = 'app_muted';

    // Lazy-loaded audio instances
    private static loadedSounds = new Map<string, HTMLAudioElement>();
    private static activeAudios: HTMLAudioElement[] = [];

    // Embedded short sounds (Base64) to ensure it works OOTB without external files
    private static sounds: Record<string, string> = {
        // Simple "Pop" sound
        click: 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAsDsAAND/AAD//wAA',
        // Default Notification
        notification: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXAAACQAAAAkAAAAJAAAACQAAAAkAAAA',
        // Retro Coin
        coin: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXAAACQAAAAkAAAAJAAAACQAAAAkAAAA',
        // Magical chime
        magic: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXAAACQAAAAkAAAAJAAAACQAAAAkAAAA',
        // Alarm/Alert
        alarm: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXAAACQAAAAkAAAAJAAAACQAAAAkAAAA'
    };

    // Actual file paths (prioritized if they exist)
    private static filePaths: Record<string, string> = {
        click: '/sounds/click.mp3',
        levelup: '/sounds/levelup.mp3',
        notification: '/sounds/notification.mp3',
        confetti: '/sounds/confetti.mp3',
        coin: '/sounds/coin.mp3',
        magic: '/sounds/magic.mp3',
        alarm: '/sounds/alarm.mp3'
    };

    static initialize() {
        if (typeof window !== 'undefined') {
            const savedVol = localStorage.getItem(this.STORAGE_KEY);
            const savedMute = localStorage.getItem(this.MUTED_KEY);

            if (savedVol !== null) {
                this.volume = parseFloat(savedVol);
            }
            if (savedMute !== null) {
                this.muted = savedMute === 'true';
            }
        }
    }

    static async play(soundName: keyof typeof SoundService.filePaths | string) {
        if (this.muted) return;

        try {
            // Lazy load AudioContext (browser requirement: user interaction first)
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const path = this.filePaths[soundName as string];
            let audio: HTMLAudioElement;

            // Check if already loaded
            if (this.loadedSounds.has(soundName as string)) {
                audio = this.loadedSounds.get(soundName as string)!;
                audio.currentTime = 0; // Reset to play again
            } else {
                // Load for first time
                audio = new Audio(path);
                
                audio.onerror = () => {
                    const fallback = this.sounds[soundName as string];
                    if (fallback) {
                        const fallbackAudio = new Audio(fallback);
                        fallbackAudio.volume = this.volume;
                        fallbackAudio.play().catch(e => console.error("Audio play failed", e));
                    }
                };

                this.loadedSounds.set(soundName as string, audio);
            }

            audio.volume = this.volume;

            // Track active audio for cleanup
            this.activeAudios.push(audio);

            // Clean up after playback
            audio.onended = () => {
                const index = this.activeAudios.indexOf(audio);
                if (index > -1) this.activeAudios.splice(index, 1);
            };

            await audio.play();

        } catch (error) {
            console.warn(`Failed to play sound: ${soundName}`, error);
        }
    }

    static setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, this.volume.toString());
        }
    }
    
    static getVolume() {
        return this.volume;
    }

    static toggleMute() {
        this.muted = !this.muted;
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.MUTED_KEY, this.muted.toString());
        }
        return this.muted;
    }

    static isMuted() {
        return this.muted;
    }

    static getAvailableSounds() {
        return Object.keys(this.sounds);
    }
}

// Auto-initialize
SoundService.initialize();
