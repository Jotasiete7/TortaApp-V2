export class SoundService {
    private static audioContext: AudioContext | null = null;
    private static volume: number = 0.5;
    private static muted: boolean = false;
    private static STORAGE_KEY = 'app_volume';
    private static MUTED_KEY = 'app_muted';

    // Lazy-loaded audio instances
    private static loadedSounds = new Map<string, HTMLAudioElement>();
    private static activeAudios: HTMLAudioElement[] = [];

    // Real sound files from public/sounds folder
    private static filePaths: Record<string, string> = {
        // Mapped to meaningful names
        click: '/sounds/mixkit-page-turn-chime-1106.wav',          // Light chime for clicks
        notification: '/sounds/mixkit-toy-drums-and-bell-ding-560.wav', // Bell ding for notifications
        coin: '/sounds/mixkit-clinking-coins-1993.wav',           // Coin clink
        coins: '/sounds/mixkit-coins-handling-1939.wav',          // Multiple coins
        alarm: '/sounds/mixkit-tribal-dry-drum-558.wav',          // Drum for alarms
        magic: '/sounds/mixkit-page-turn-chime-1106.wav',         // Chime for magic
        success: '/sounds/mixkit-toy-drums-and-bell-ding-560.wav', // Bell for success
        drumroll: '/sounds/mixkit-drum-roll-566.wav',             // Drum roll
        unlock: '/sounds/mixkit-door-key-in-door-lock-2842.wav',  // Key unlock sound
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

            if (!path) {
                console.warn(`Sound not found: ${soundName}`);
                return;
            }

            let audio: HTMLAudioElement;

            // Check if already loaded
            if (this.loadedSounds.has(soundName as string)) {
                audio = this.loadedSounds.get(soundName as string)!;
                audio.currentTime = 0; // Reset to play again
            } else {
                // Load for first time
                audio = new Audio(path);

                audio.onerror = (e) => {
                    console.error(`Failed to load sound: ${soundName} from ${path}`, e);
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

    /**
     * Get list of available sounds
     */
    static getAvailableSounds() {
        return Object.keys(this.filePaths);
    }

    /**
     * Get sound info for UI display
     */
    static getSoundInfo() {
        return {
            click: { name: 'Click', description: 'Light chime' },
            notification: { name: 'Notification', description: 'Bell ding' },
            coin: { name: 'Coin', description: 'Single coin' },
            coins: { name: 'Coins', description: 'Multiple coins' },
            alarm: { name: 'Alarm', description: 'Tribal drum' },
            magic: { name: 'Magic', description: 'Chime' },
            success: { name: 'Success', description: 'Bell' },
            drumroll: { name: 'Drumroll', description: 'Drum roll' },
            unlock: { name: 'Unlock', description: 'Key unlock' },
        };
    }
}

// Auto-initialize
SoundService.initialize();
