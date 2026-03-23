
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { io, Socket } from 'socket.io-client';

// Socket instance
let socket: Socket | null = null;

// WebRTC Configuration
export const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ]
};

export const getSocket = () => {
  if (!socket) {
    // Connect to the current origin (Express server on port 3000)
    socket = io({
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 5000,
    });

    socket.on('connect', () => {
      console.log('Connected to Signaling Server');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Signaling Server:', reason);
      // Socket.io handles reconnection automatically with the config above,
      // but we can log it or force it if needed.
    });

    socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
      // The socket will automatically try to reconnect every 5s due to reconnectionDelay
    });
  }
  return socket;
};

export const fetchUserLocation = async () => {
  const services = [
    'https://ipapi.co/json/',
    'https://freeipapi.com/api/json',
    'https://ip-api.com/json/'
  ];

  for (const service of services) {
    try {
      const response = await fetch(service);
      if (!response.ok) continue;
      const data = await response.json();
      
      // Handle different response formats
      const country = data.country_name || data.countryName || data.country || "Global";
      const countryCode = data.country_code || data.countryCode || null;
      const city = data.city || data.cityName || "Global";

      return {
        country,
        flag: countryCode ? getFlagEmoji(countryCode) : '🌐',
        city
      };
    } catch (e) {
      // Silently try next service
      continue;
    }
  }

  // Final fallback if all services fail
  return { country: "USA", flag: "🇺🇸", city: "New York" };
};

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Native encoding/decoding as required by guidelines
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
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

export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const setupPaymentListener = (onSuccess: (data: any) => void) => {
  const socket = getSocket();
  socket.on('payment-success', onSuccess);
  return () => socket.off('payment-success', onSuccess);
};

export const connectToGeminiLive = async (
  onAudioChunk: (base64: string) => void,
  onTranscription: (text: string, type: 'input' | 'output') => void
) => {
  // Always use the latest process.env.API_KEY as per instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      systemInstruction: `You are an expert real-time translator and social companion for "GlobalPulse", a global video chat app. 
      Your mission is to:
      1. Instantly translate spoken words between different languages.
      2. If the user speaks English, translate it to the target user's likely language (or just provide a helpful polite response).
      3. If the user speaks any other language, translate it clearly into English.
      4. Occasionally suggest a fun "ice-breaker" question if there is a lull in conversation.
      5. Keep translations natural, conversational, and very concise.`,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => console.log('GlobalPulse AI Link Established'),
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
          onAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
        }
        if (message.serverContent?.inputTranscription) {
          onTranscription(message.serverContent.inputTranscription.text, 'input');
        }
        if (message.serverContent?.outputTranscription) {
          onTranscription(message.serverContent.outputTranscription.text, 'output');
        }
      },
      onerror: (e) => console.error('AI Link Error', e),
      onclose: () => console.log('AI Link Terminated'),
    },
  });

  return sessionPromise;
};
