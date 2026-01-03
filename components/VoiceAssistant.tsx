import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio processing helpers based on Gemini API docs
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function customDecodeAudioData(
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

export const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Refs for managing audio and session state
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input?: AudioContext, output?: AudioContext }>({});
  const cleanupRef = useRef<() => void>(() => {});
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const connect = async () => {
    try {
      setError(null);
      setStatus('connecting');
      setIsActive(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      // Setup Output Node
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Setup Input (Microphone)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      // Initialize Gemini Live Session
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are an expert Agile Coach and Scrum Master assistant. Help the user manage their project, explain agile concepts, and provide feedback on their backlog or vision. Keep answers concise, helpful, and encouraging. You are talking to a Product Owner or Scrum Master using the ScrumAI Manager app."
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
            
            // Start processing audio input
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Convert Float32 to Int16 PCM
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                // simple clamp
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              const base64Data = encode(new Uint8Array(int16.buffer));

              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;

            // Handle Audio Output
            const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const binary = decode(audioData);
              const audioBuffer = await customDecodeAudioData(binary, outputCtx, 24000, 1);
              
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              
              // Schedule playback
              // Ensure nextStartTime is at least current time
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              audioSourcesRef.current.add(source);
              source.onended = () => audioSourcesRef.current.delete(source);
            }

            // Handle Interruption
            if (serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session closed");
            handleDisconnect();
          },
          onerror: (e) => {
            console.error("Session error", e);
            setError("Connection error");
            handleDisconnect();
          }
        }
      });

      // Cleanup function
      cleanupRef.current = () => {
        sessionPromise.then(s => s.close()); // Close session
        source.disconnect();
        scriptProcessor.disconnect();
        stream.getTracks().forEach(t => t.stop()); // Stop mic
        
        // Close audio contexts
        if (inputCtx.state !== 'closed') inputCtx.close();
        if (outputCtx.state !== 'closed') outputCtx.close();
        
        audioSourcesRef.current.forEach(s => {
             try { s.stop(); } catch(e) {}
        });
        audioSourcesRef.current.clear();
      };

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect");
      handleDisconnect();
    }
  };

  const handleDisconnect = () => {
    cleanupRef.current();
    setIsActive(false);
    setStatus('disconnected');
    nextStartTimeRef.current = 0;
  };

  const toggleVoice = () => {
    if (isActive) {
      handleDisconnect();
    } else {
      connect();
    }
  };

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-xl text-sm font-medium shadow-lg mb-2 animate-fade-in">
          {error}
        </div>
      )}
      
      <button
        onClick={toggleVoice}
        className={`flex items-center gap-3 px-6 py-4 rounded-full shadow-xl transition-all duration-300 font-bold ${
          isActive 
            ? 'bg-white text-accent border-2 border-accent' 
            : 'bg-accent text-white hover:bg-opacity-90'
        }`}
      >
        <span className="text-2xl">
            {isActive ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            ) : '🎙️'}
        </span>
        <span>
          {status === 'connecting' ? 'Connecting...' : isActive ? 'Listening...' : 'Ask Scrum AI'}
        </span>
        {isActive && (
            <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded ml-2">Live</span>
        )}
      </button>
    </div>
  );
};
