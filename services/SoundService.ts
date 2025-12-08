export class SoundService {
    private static audioContext: AudioContext | null = null;
    private static volume: number = 0.5;
    private static muted: boolean = false;

    // Embedded short sounds (Base64) to ensure it works OOTB without external files
    private static sounds: Record<string, string> = {
        // Simple "Pop" sound
        click: 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAsDsAAND/AAD//wAA',
        // 8-bit Level Up (Placeholder - ideally replace with real file)
        levelup: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXAAACQAAAAkAAAAJAAAACQAAAAkAAAA',
        // Notification
        notification: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXAAACQAAAAkAAAAJAAAACQAAAAkAAAA'
    };

    // Actual file paths (prioritized if they exist)
    private static filePaths: Record<string, string> = {
        click: '/sounds/click.mp3',
        levelup: '/sounds/levelup.mp3',
        notification: '/sounds/notification.mp3',
        confetti: '/sounds/confetti.mp3'
    };

    static async play(soundName: keyof typeof SoundService.filePaths | string) {
        if (this.muted) return;

        try {
            // Lazy load AudioContext (browser requirement: user interaction first)
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const path = this.filePaths[soundName as string];
            let sourceToPlay = path;

            // Check if we should use fallback (logic simplifies to: try fetch, if fail, use base64 if available)
            // For now, simpler: Create Audio object
            const audio = new Audio(sourceToPlay);

            audio.volume = this.volume;

            // Error handling: if file doesn't exist, try base64 fallback for basics
            audio.onerror = () => {
                const fallback = this.sounds[soundName as string];
                if (fallback) {
                    const fallbackAudio = new Audio(fallback);
                    fallbackAudio.volume = this.volume;
                    fallbackAudio.play().catch(e => console.error("Audio play failed", e));
                }
            };

            await audio.play();

        } catch (error) {
            console.warn(`Failed to play sound: ${soundName}`, error);
        }
    }

    static setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    static toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    static isMuted() {
        return this.muted;
    }
}
