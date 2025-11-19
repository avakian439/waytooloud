
export class AudioController {
  private static instance: AudioController;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private isMonitoring: boolean = false;
  private minDb: number = -60; // Default minimum dB for mapping
  private maxDb: number = 0;  // Default maximum dB for mapping

  private constructor() {}

  public static getInstance(): AudioController {
    if (!AudioController.instance) {
      AudioController.instance = new AudioController();
    }
    return AudioController.instance;
  }

  public async startMonitoring(): Promise<boolean> {
    if (this.isMonitoring) return true;

    try {
      console.log('Starting audio monitoring...');
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');

      // Create audio context
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      
      this.isMonitoring = true;
      console.log('Audio context created and connected');

      return true;
    } catch (error) {
      console.error('Error starting audio monitoring:', error);
      return false;
    }
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.analyser = null;
    this.dataArray = null;
    this.isMonitoring = false;
  }

  public getAudioLevel(): number {
    if (!this.isMonitoring || !this.analyser || !this.dataArray) {
      return 0;
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);

    // Calculate A-weighted RMS
    let sumOfSquares = 0;
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binSize = sampleRate / this.analyser.fftSize;

    for (let i = 0; i < this.dataArray.length; i++) {
      const frequency = i * binSize;
      
      // A-weighting formula
      // https://en.wikipedia.org/wiki/A-weighting
      const f2 = frequency * frequency;
      const f4 = f2 * f2;
      
      // Constants for A-weighting
      const c1 = 12194.217 * 12194.217;
      const c2 = 20.598997 * 20.598997;
      const c3 = 107.65265 * 107.65265;
      const c4 = 737.86223 * 737.86223;
      
      const num = 1.2588966 * 148840000 * f4;
      const den = (f2 + c2) * Math.sqrt((f2 + c3) * (f2 + c4)) * (f2 + c1);
      
      const weight = den > 0 ? num / den : 0;
      
      // Apply weight to the normalized amplitude
      const normalized = this.dataArray[i] / 255;
      const weighted = normalized * weight;
      
      sumOfSquares += weighted * weighted;
    }
    
    const rms = Math.sqrt(sumOfSquares / this.dataArray.length);

    // Convert RMS to decibels (dB)
    // Reference: 0 dB = maximum level (1.0), silence approaches -infinity dB
    const db = 20 * Math.log10(Math.max(rms, 0.000001)); // Prevent log10(0)
    
    
    // Apply noise gate - filter out very quiet background noise
    // const noiseGateThreshold = -80; // Threshold in dB
    // if (db < noiseGateThreshold) {
    //   return 0;
    // }

    
    // Map dB range to 0-100 scale
    // Typical range: -60 dB (quiet) to 0 dB (max)
    // const minDb = -60; // Below this is considered silence
    // const maxDb = 0;  // Headroom before clipping
    
    // Linear mapping of dB to percentage
    const normalizedDb = (db - this.minDb) / (this.maxDb - this.minDb);
    const level = Math.max(0, Math.min(100, normalizedDb * 100));

    return level;
  }

  public setSensitivity(minDb: number, maxDb: number) {
    this.minDb = minDb;
    this.maxDb = maxDb;
  }

  public getSensitivity() {
    return { minDb: this.minDb, maxDb: this.maxDb };
  }

  public isActive(): boolean {
    return this.isMonitoring;
  }
}
