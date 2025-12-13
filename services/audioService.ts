import { GoogleGenAI } from "@google/genai";

class AudioService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private audioContext: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];
  private suspenseInterval: any = null;
  
  // Cache for generated audio to save API calls and reduce latency
  private audioCache: Map<string, AudioBuffer> = new Map();
  private genAI: GoogleGenAI | null = null;
  private pendingRequests: Map<string, Promise<void>> = new Map();

  constructor() {
    this.synth = window.speechSynthesis;
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }

    // Initialize Gemini API if key is available
    try {
      if (process.env.API_KEY) {
        this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
      }
    } catch (e) {
      console.warn("Gemini API Key not found or process.env not available, falling back to browser TTS");
    }
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // --- Helper Functions for Gemini Audio Decoding ---

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  // --- Sound Management ---

  public stopAllSounds() {
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(e) {}
    });
    this.activeGainNodes.forEach(gain => {
        try { gain.disconnect(); } catch(e) {}
    });
    this.activeOscillators = [];
    this.activeGainNodes = [];
    
    if (this.suspenseInterval) {
        clearInterval(this.suspenseInterval);
        this.suspenseInterval = null;
    }
    if (this.synth.speaking) {
        this.synth.cancel();
    }
  }

  // --- Tone Generation (unchanged) ---
  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number, vol: number = 0.1, decay: boolean = true) {
    if (!this.audioContext) this.initAudioContext();
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
    if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    } else {
        gain.gain.setValueAtTime(vol, startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);

    this.activeOscillators.push(osc);
    this.activeGainNodes.push(gain);
    
    setTimeout(() => {
        const idx = this.activeOscillators.indexOf(osc);
        if (idx > -1) this.activeOscillators.splice(idx, 1);
    }, duration * 1000 + 100);
  }

  // --- Melodies (unchanged) ---
  public playIntroMusic() {
    this.stopAllSounds();
    if (!this.audioContext) this.initAudioContext();
    const now = this.audioContext!.currentTime;
    
    const notes = [
        { f: 392.00, d: 0.2, t: 0 },   
        { f: 523.25, d: 0.2, t: 0.2 }, 
        { f: 659.25, d: 0.2, t: 0.4 }, 
        { f: 783.99, d: 0.4, t: 0.6 }, 
        { f: 523.25, d: 0.2, t: 1.0 }, 
        { f: 659.25, d: 0.2, t: 1.2 }, 
        { f: 1046.50, d: 0.8, t: 1.4 } 
    ];

    notes.forEach(n => this.playTone(n.f, 'triangle', n.d, now + n.t, 0.2));
    this.playTone(130.81, 'sawtooth', 2.0, now, 0.1);
  }

  public playCelebrationMusic() {
    this.stopAllSounds();
    if (!this.audioContext) this.initAudioContext();
    const now = this.audioContext!.currentTime;

    const tune = [
        { f: 523.25, d: 0.15, t: 0 },   
        { f: 523.25, d: 0.15, t: 0.2 }, 
        { f: 523.25, d: 0.15, t: 0.4 }, 
        { f: 659.25, d: 0.4, t: 0.6 },   
        { f: 783.99, d: 0.4, t: 1.0 },   
        { f: 523.25, d: 0.2, t: 1.4 },   
        { f: 659.25, d: 0.2, t: 1.6 },   
        { f: 783.99, d: 0.6, t: 1.8 },   
        { f: 880.00, d: 0.2, t: 2.5 },   
        { f: 783.99, d: 0.2, t: 2.7 },   
        { f: 698.46, d: 0.2, t: 2.9 },   
        { f: 659.25, d: 0.2, t: 3.1 },   
        { f: 587.33, d: 0.2, t: 3.3 },   
        { f: 523.25, d: 0.8, t: 3.5 },   
    ];

    tune.forEach(n => this.playTone(n.f, 'square', n.d, now + n.t, 0.15));
    
    setTimeout(() => {
        this.playTone(261.63, 'triangle', 0.5, now, 0.1);
        this.playTone(329.63, 'triangle', 0.5, now + 0.5, 0.1);
        this.playTone(392.00, 'triangle', 0.5, now + 1.0, 0.1);
        this.playTone(523.25, 'triangle', 1.0, now + 1.5, 0.1);
    }, 0);
  }

  public startSuspenseMusic() {
    this.stopAllSounds();
    if (!this.audioContext) this.initAudioContext();
    
    const playBeat = () => {
        const now = this.audioContext!.currentTime;
        this.playTone(110, 'sine', 0.1, now, 0.15);
        this.playTone(220, 'square', 0.05, now + 0.5, 0.05);
    };

    playBeat();
    this.suspenseInterval = setInterval(playBeat, 1000);
  }

  public stopSuspenseMusic() {
    if (this.suspenseInterval) {
        clearInterval(this.suspenseInterval);
        this.suspenseInterval = null;
    }
  }

  public playCorrectSound() {
      this.playDing();
  }

  public playWrongSound() {
    this.stopAllSounds();
    if (!this.audioContext) this.initAudioContext();
    const now = this.audioContext!.currentTime;
    
    this.playTone(150, 'sawtooth', 0.5, now, 0.3);
    this.playTone(100, 'sawtooth', 1.0, now + 0.4, 0.3);
  }

  public playDing() {
    if (!this.audioContext) this.initAudioContext();
    const now = this.audioContext!.currentTime;
    this.playTone(880, 'sine', 0.1, now, 0.1); 
    this.playTone(1760, 'sine', 0.3, now + 0.1, 0.05); 
  }

  // --- High Quality Speech Implementation ---

  // Preload audio without playing it
  public async preload(text: string, lang: string = 'ar-SA'): Promise<void> {
      if (!this.genAI) return;
      
      const cacheKey = `${lang}-${text}`;
      if (this.audioCache.has(cacheKey)) return;
      if (this.pendingRequests.has(cacheKey)) return this.pendingRequests.get(cacheKey);

      const requestPromise = (async () => {
          try {
              const response = await this.genAI!.models.generateContent({
                  model: "gemini-2.5-flash-preview-tts",
                  contents: { parts: [{ text: text }] },
                  config: {
                    responseModalities: ['AUDIO'] as any,
                    speechConfig: {
                        voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: 'Puck' },
                        },
                    },
                  },
              });

              const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                  if (!this.audioContext) this.initAudioContext();
                  const audioBuffer = await this.decodeAudioData(
                      this.decodeBase64(base64Audio),
                      this.audioContext!,
                      24000,
                      1
                  );
                  this.audioCache.set(cacheKey, audioBuffer);
              }
          } catch (e) {
              console.error("Preload failed", e);
          } finally {
              this.pendingRequests.delete(cacheKey);
          }
      })();

      this.pendingRequests.set(cacheKey, requestPromise);
      return requestPromise;
  }

  public async speak(text: string, lang: string = 'ar-SA') {
    // Stop any existing browser speech
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    if (!this.genAI) {
      console.log("No Gemini API key, using browser fallback.");
      this.speakFallback(text, lang);
      return;
    }

    // Check Cache
    const cacheKey = `${lang}-${text}`;
    if (this.audioCache.has(cacheKey)) {
        this.playAudioBuffer(this.audioCache.get(cacheKey)!);
        return;
    }
    
    // Check if pending
    if (this.pendingRequests.has(cacheKey)) {
        await this.pendingRequests.get(cacheKey);
        if (this.audioCache.has(cacheKey)) {
            this.playAudioBuffer(this.audioCache.get(cacheKey)!);
            return;
        }
    }

    // If not cached or pending, fetch now
    await this.preload(text, lang);
    if (this.audioCache.has(cacheKey)) {
        this.playAudioBuffer(this.audioCache.get(cacheKey)!);
    } else {
        this.speakFallback(text, lang);
    }
  }

  private playAudioBuffer(buffer: AudioBuffer) {
    if (!this.audioContext) this.initAudioContext();
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);
    source.start();
  }

  private speakFallback(text: string, lang: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; 
    utterance.pitch = 1.1; 

    const voices = this.voices.filter(v => v.lang.includes(lang.split('-')[0]));
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Laila') || v.name.includes('Maged'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else if (voices.length > 0) {
      utterance.voice = voices[0];
    }

    this.synth.speak(utterance);
  }

  public encourageAlwaleed(isCorrect: boolean) {
    if (isCorrect) {
       const type = Math.random();
       
       if (type < 0.33) {
           const enPhrases = ["Great Alwaleed!", "Bravo Alwaleed!", "Excellent work!", "You are amazing Alwaleed!"];
           const phrase = enPhrases[Math.floor(Math.random() * enPhrases.length)];
           this.speak(phrase, 'en-US');
       } else if (type < 0.66) {
           const arPhrases = [
             "الله عليك يا الوليد!",
             "شاطر يا بطل!",
             "ممتاز يا عبقري!",
             "إجابة روعة يا مليونير!"
           ];
           this.speak(arPhrases[Math.floor(Math.random() * arPhrases.length)]);
       } else {
           this.speak("يا الوليد، أنت مبدع حقاً");
       }
    } else {
        const negativePhrases = [
          "ولا يهمك يا الوليد، فكر تاني",
          "قريب جداً، تعال نشوف الحل الصح",
          "حاول مرة تانية يا بطل",
        ];
        this.speak(negativePhrases[Math.floor(Math.random() * negativePhrases.length)]);
    }
  }
}

export const audioService = new AudioService();