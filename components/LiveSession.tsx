import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LIVE_MODEL } from '../constants';
import { Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

// Define the Blob type locally to match Gemini API expectation
type GenAIBlob = {
  data: string;
  mimeType: string;
};

interface LiveSessionProps {
  onEndSession: (sessionData: any) => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onEndSession }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [volume, setVolume] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState<string>("Listening...");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  
  // Gemini Session Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialization
  useEffect(() => {
    let stream: MediaStream;
    
    const init = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
             setCoachFeedback("Audio not supported in this browser.");
             return;
        }

        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup Audio Contexts
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        
        // Input processing
        const audioInputContext = new AudioContextClass({ sampleRate: 16000 });
        inputSourceRef.current = audioInputContext.createMediaStreamSource(stream);
        
        // Processor for sending chunks
        processorRef.current = audioInputContext.createScriptProcessor(4096, 1, 1);
        
        inputSourceRef.current.connect(processorRef.current);
        processorRef.current.connect(audioInputContext.destination);

        // Output Node for Gemini Audio
        outputNodeRef.current = ctx.createGain();
        outputNodeRef.current.connect(ctx.destination);

        // Connect Gemini - Safe API Key Access thanks to polyfill
        const apiKey = process.env.API_KEY || '';
            
        const ai = new GoogleGenAI({ apiKey });
        
        sessionPromiseRef.current = ai.live.connect({
          model: LIVE_MODEL,
          config: {
            responseModalities: ['AUDIO'], // Use string literal instead of Enum
            systemInstruction: "You are an expert public speaking coach. Listen to the user's speech. Provide brief, encouraging, real-time feedback on pace, tone, and clarity. Only interrupt if there is a major issue or a pause. At the end, summarize the performance.",
          },
          callbacks: {
            onopen: () => {
              console.log("Gemini Live Connected");
              setIsConnected(true);
              setCoachFeedback("Coach Connected. Start Speaking!");
            },
            onmessage: handleServerMessage,
            onclose: () => setIsConnected(false),
            onerror: (err) => console.error(err)
          }
        });

        // Send Audio Data
        processorRef.current.onaudioprocess = (e) => {
          if (!isMicOn) return;

          // Simple volume calculation for UI
          const inputData = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          setVolume(Math.min(rms * 5, 1)); // Scale for UI

          // Prepare Blob for Gemini
          const pcmBlob = createBlob(inputData);
          sessionPromiseRef.current?.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };

      } catch (err) {
        console.error("Error accessing media devices", err);
        setCoachFeedback("Error accessing microphone/camera.");
      }
    };

    init();

    return () => {
      // Cleanup
      stream?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      processorRef.current?.disconnect();
    };
  }, []);

  const handleServerMessage = async (message: any) => {
    // Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && audioContextRef.current && outputNodeRef.current) {
        setCoachFeedback("Coach is speaking...");
        const ctx = audioContextRef.current;
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
        
        const audioBuffer = await decodeAudioData(base64Audio, ctx);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputNodeRef.current);
        source.start(nextStartTimeRef.current);
        
        nextStartTimeRef.current += audioBuffer.duration;
        sourcesRef.current.add(source);
        
        source.onended = () => {
            sourcesRef.current.delete(source);
            setCoachFeedback("Listening...");
        };
    }
  };

  // Helper: Create PCM Blob
  const createBlob = (data: Float32Array): GenAIBlob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    // Simple encode to binary string -> btoa
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      data: base64,
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  // Helper: Decode Audio
  const decodeAudioData = async (base64: string, ctx: AudioContext) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(dataInt16.length);
    for(let i=0; i<dataInt16.length; i++) {
        float32[i] = dataInt16[i] / 32768.0;
    }
    
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    return buffer;
  };

  const handleFinish = () => {
    // In a real app, we would capture the transcript here.
    // For this demo, we pass mock data + qualitative feelings to the analysis engine.
    onEndSession({
        duration: 120,
        context: "The user spoke about technology trends. The user had good energy but stumbled on some technical terms. The pace was a bit fast.",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-white font-medium text-sm">AI Coach Live</span>
        </div>
        <button onClick={handleFinish} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center">
            <X className="w-4 h-4 mr-2" /> End Session
        </button>
      </div>

      {/* Main Video Area */}
      <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity ${isVideoOn ? 'opacity-100' : 'opacity-0'}`} 
        />
        
        {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center">
                    <Mic className="w-12 h-12 text-slate-500" />
                </div>
            </div>
        )}

        {/* Feedback Overlay */}
        <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
            <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-lg">
                <p className="text-indigo-300 text-xs uppercase font-bold mb-1">Coach Feedback</p>
                <p className="text-white text-lg font-medium leading-relaxed transition-all duration-300">
                    {coachFeedback}
                </p>
            </div>

            {/* Audio Visualizer */}
            <div className="flex items-center space-x-1 h-12">
                {[...Array(5)].map((_, i) => (
                    <div 
                        key={i} 
                        className="w-3 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(10, volume * 100 * (Math.random() * 0.5 + 0.5))}%` }}
                    ></div>
                ))}
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center space-x-6">
        <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-4 rounded-full ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 border border-red-500'}`}
        >
            {isMicOn ? <Mic /> : <MicOff />}
        </button>
        <button 
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-4 rounded-full ${isVideoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 border border-red-500'}`}
        >
            {isVideoOn ? <Video /> : <VideoOff />}
        </button>
      </div>

    </div>
  );
};

export default LiveSession;