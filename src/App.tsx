/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  GraduationCap, 
  Clock, 
  Layers, 
  Star, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Check, 
  ArrowRight,
  TrendingUp, 
  Lock, 
  CreditCard, 
  User, 
  ExternalLink,
  MessageSquare,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Flashcard {
  question: string;
  answer: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"tutor" | "focus" | "flashcards" | "pricing">("tutor");
  const [selectedSubject, setSelectedSubject] = useState<string>("Computer Science");
  const [selectedVoice, setSelectedVoice] = useState<string>("Zephyr");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [speechCaptureMode, setSpeechCaptureMode] = useState<"local" | "cloud">("local");
  const [vadThreshold, setVadThreshold] = useState<number>(6);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const showDiagnosticsRef = useRef<boolean>(false);
  const [diagnosticsInfo, setDiagnosticsInfo] = useState<{
    isSecure: boolean;
    speechSupported: boolean;
    micPermission: string;
    activeDevice: string;
    volumeValue: number;
    availableMics: Array<{ label: string; deviceId: string }>;
  }>({
    isSecure: false,
    speechSupported: false,
    micPermission: "unknown",
    activeDevice: "None",
    volumeValue: 0,
    availableMics: []
  });

  const setShowDiagnosticsState = (val: boolean) => {
    setShowDiagnostics(val);
    showDiagnosticsRef.current = val;
  };

  // Multi-modal voice tutor states
  const [userInput, setUserInput] = useState<string>("");
  const [chatLogs, setChatLogs] = useState<Array<{ sender: "user" | "aura"; text: string; audioUrl?: string }>>([
    {
      sender: "aura",
      text: "Hello! I am Aura, your academic companion. What concept are we mastering today?"
    }
  ]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>("");
  const [tutorIsLoading, setTutorIsLoading] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

  // Hands-free voice autopilot states and refs
  const [isHandsFree, setIsHandsFree] = useState<boolean>(false);
  const isHandsFreeRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const audioContextForVadRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const setHandsFreeState = (val: boolean) => {
    setIsHandsFree(val);
    isHandsFreeRef.current = val;
  };

  // Focus Timer state
  const [timerMode, setTimerMode] = useState<"study" | "short" | "long">("study");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [ambientSounds, setAmbientSounds] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Flashcards state
  const [cardTopic, setCardTopic] = useState<string>("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { question: "What is the Time Complexity of Binary Search?", answer: "O(log n) because the search space is divided in half at each step." },
    { question: "Explain the difference between SQL and NoSQL.", answer: "SQL databases are relational and table-based with fixed schemas. NoSQL databases are non-relational, document-based, and scale horizontally." },
    { question: "What is an Abstract Data Type (ADT)?", answer: "A mathematical model for data types defined by its behavior (operations) from the user's point of view, rather than its implementation." }
  ]);
  const [cardsLoading, setCardsLoading] = useState<boolean>(false);
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  // Premium / Checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [checkoutIsProcessing, setCheckoutIsProcessing] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvc, setCardCvc] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");

  // Handle circular timer calculations
  const totalSecondsForMode = {
    study: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
  };
  const percentageTimeLeft = (timeLeft / totalSecondsForMode[timerMode]) * 100;

  // Manage Pomodoro Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (timerIsRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerIsRunning(false);
      // Play a gentle notify bell
      try {
        const osc = new AudioContext().createOscillator();
        const gain = new AudioContext().createGain();
        osc.connect(gain);
        gain.connect(new AudioContext().destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, 0); // C5
        osc.start();
        osc.stop(0.3);
      } catch (_) {}
    }
    return () => clearInterval(interval);
  }, [timerIsRunning, timeLeft]);

  // Pomodoro reset
  const handleResetTimer = () => {
    setTimerIsRunning(false);
    setTimeLeft(totalSecondsForMode[timerMode]);
  };

  const handleModeChange = (mode: "study" | "short" | "long") => {
    setTimerMode(mode);
    setTimerIsRunning(false);
    setTimeLeft(totalSecondsForMode[mode]);
  };

  // Toggle ambient studying sounds (Brownian Noise synthesis)
  const toggleAmbientSound = () => {
    if (ambientSounds) {
      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as any).disconnect();
        } catch (_) {}
      }
      setAmbientSounds(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Generate Brown Noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(250, 0); // Mellow cozy frequencies

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.18, 0);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();
        noiseNodeRef.current = source;
        setAmbientSounds(true);
      } catch (err) {
        console.error("Audio Synthesis block:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (noiseNodeRef.current) {
        try { (noiseNodeRef.current as any).disconnect(); } catch (_) {}
      }
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }
      if (audioContextForVadRef.current) {
        try {
          audioContextForVadRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  // Voice Activity Detection / Silence detection loop
  const startSilenceDetection = async (stream: MediaStream) => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
    }
    if (audioContextForVadRef.current) {
      try {
        audioContextForVadRef.current.close();
      } catch (_) {}
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextForVadRef.current = audioContext;

      // Crucial: Resume the AudioContext if suspended (browser gesture requirement)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpeechTime = Date.now();
      let hasSpoken = false;

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const averageVolume = sum / bufferLength;

        // Map audio energy level (0-40 avg) to visual indicator percent (0-100)
        const volPercent = Math.min(100, Math.round((averageVolume / 40) * 100));
        setMicVolume(volPercent);

        if (showDiagnosticsRef.current) {
          setDiagnosticsInfo(prev => ({ ...prev, volumeValue: averageVolume }));
        }

        // Decibel threshold for speech detection (values are 0 to 255)
        const threshold = vadThreshold;

        if (averageVolume > threshold) {
          hasSpoken = true;
          lastSpeechTime = Date.now();
          setTranscriptionStatus("Listening (Speech detected...)");
        } else {
          if (hasSpoken) {
            const silenceMs = Date.now() - lastSpeechTime;
            setTranscriptionStatus(`Listening (Silence: ${(silenceMs / 1000).toFixed(1)}s)`);
            
            // If silent for 2.0 seconds after speaking, stop recording automatically!
            if (silenceMs > 2000) {
              clearInterval(interval);
              silenceTimerRef.current = null;
              stopRecording();
            }
          } else {
            // If they haven't spoken at all and it's been silent for 8 seconds, timeout
            if (Date.now() - lastSpeechTime > 8000) {
              clearInterval(interval);
              silenceTimerRef.current = null;
              stopRecording();
              setTranscriptionStatus("Recording timeout. No speech detected. Check Chrome mic permissions or input volume.");
            }
          }
        }
      }, 100);

      silenceTimerRef.current = interval;
    } catch (e) {
      console.warn("Failed to start VAD:", e);
    }
  };

  // Voice Recording functions
  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (speechCaptureMode === "local" && SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (_) {}
        }

        const rec = new SpeechRecognition();
        recognitionRef.current = rec;
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        let hasResult = false;

        rec.onstart = () => {
          setIsRecording(true);
          setTranscriptionStatus("Listening (Web Speech API)...");
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0]?.transcript;
          console.log("SpeechRecognition result:", transcript);
          if (transcript && transcript.trim()) {
            hasResult = true;
            setTranscriptionStatus("");
            handleTutorRequest(transcript);
          }
        };

        rec.onerror = (event: any) => {
          console.warn("SpeechRecognition error:", event.error);
          if (event.error === "no-speech") {
            setTranscriptionStatus("No speech detected.");
          } else {
            setTranscriptionStatus(`Speech error: ${event.error}`);
          }
        };

        rec.onend = () => {
          setIsRecording(false);
          recognitionRef.current = null;

          // If no result was captured and hands-free is active, restart listening after a delay
          if (!hasResult && isHandsFreeRef.current) {
            console.log("No speech captured in hands-free mode, restarting listen loop...");
            setTimeout(() => {
              if (isHandsFreeRef.current) {
                startRecording();
              }
            }, 1500);
          }
        };

        rec.start();
      } catch (err: any) {
        console.error("Failed to start SpeechRecognition:", err);
        startMediaRecorderRecording();
      }
    } else {
      startMediaRecorderRecording();
    }
  };

  const startMediaRecorderRecording = async () => {
    try {
      setTranscriptionStatus("Opening mic (Fallback)...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const completeBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(completeBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(",")[1];
          setTutorIsLoading(true);
          setTranscriptionStatus("Transcribing spoken query...");
          try {
            const res = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioData: base64data, mimeType: "audio/webm" })
            });
            const data = await res.json();
            if (data.text) {
              setTranscriptionStatus("");
              handleTutorRequest(data.text);
            } else {
              setTranscriptionStatus("No speech detected.");
              setTutorIsLoading(false);
              // In hands-free mode, if it failed to capture speech, wait 1.5s and try listening again
              if (isHandsFreeRef.current) {
                setTimeout(() => {
                  startRecording();
                }, 1500);
              }
            }
          } catch (err: any) {
            setTranscriptionStatus(`Transcription error: ${err.message || "Failed"}`);
            setTutorIsLoading(false);
            if (isHandsFreeRef.current) {
              setTimeout(() => {
                startRecording();
              }, 2000);
            }
          }
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setTranscriptionStatus("Listening...");

      // Trigger VAD silence detector if hands-free is enabled
      if (isHandsFreeRef.current) {
        startSilenceDetection(stream);
      }
    } catch (err: any) {
      console.error(err);
      setTranscriptionStatus("Microphone access denied.");
      setHandsFreeState(false);
    }
  };

  const stopRecording = () => {
    setMicVolume(0);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
      setIsRecording(false);
    }

    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Clean up VAD
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (audioContextForVadRef.current) {
        try {
          audioContextForVadRef.current.close();
        } catch (_) {}
        audioContextForVadRef.current = null;
      }
    }
  };

  const toggleHandsFree = async () => {
    if (isHandsFreeRef.current) {
      setHandsFreeState(false);
      if (currentAudio) currentAudio.pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      stopRecording();
      setTranscriptionStatus("Hands-free autopilot disabled.");
    } else {
      setHandsFreeState(true);
      setTutorIsLoading(true);
      setTranscriptionStatus("Aura is speaking the welcome message...");

      if (currentAudio) currentAudio.pause();

      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "Hello! I am Aura, your academic companion. What concept are we mastering today?",
            voiceName: selectedVoice
          })
        });

        if (!res.ok) throw new Error("Welcome fetch failed.");
        const data = await res.json();

        if (data.audio) {
          const binary = atob(data.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: data.mimeType || "audio/mp3" });
          const url = URL.createObjectURL(blob);

          const audioObj = new Audio(url);
          setCurrentAudio(audioObj);
          setPlayingAudioId(0); // Greeting index

          audioObj.play().catch(e => console.warn(e));
          audioObj.onended = () => {
            setPlayingAudioId(null);
            if (isHandsFreeRef.current) {
              setTimeout(() => {
                startRecording();
              }, 800);
            }
          };
        } else {
          throw new Error("No audio payload");
        }
      } catch (err) {
        console.warn("Speech synthesis initial welcome failed, playing local SpeechSynthesis:", err);
        speakText("Hello! I am Aura, your academic companion. What concept are we mastering today?", () => {
          setPlayingAudioId(null);
          if (isHandsFreeRef.current) {
            setTimeout(() => {
              startRecording();
            }, 800);
          }
        });
      } finally {
        setTutorIsLoading(false);
      }
    }
  };

  // Submit query to Voice Chat endpoint
  const handleTutorRequest = async (text: string) => {
    if (!text.trim()) return;
    setTutorIsLoading(true);

    // Stop current playing audio
    if (currentAudio) {
      currentAudio.pause();
      setPlayingAudioId(null);
    }

    const newUserMessage = { sender: "user" as const, text: text };
    setChatLogs(prev => [...prev, newUserMessage]);
    setUserInput("");

    try {
      const res = await fetch("/api/chat-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: text,
          modelName: selectedModel,
          voiceName: selectedVoice,
          subject: selectedSubject
        })
      });

      if (!res.ok) {
        throw new Error("Tutor API failed to respond.");
      }

      const data = await res.json();
      let audioUrl: string | undefined;

      if (data.audio) {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || "audio/mp3" });
        audioUrl = URL.createObjectURL(blob);
      }

      const newAuraMessage = {
        sender: "aura" as const,
        text: data.text,
        audioUrl: audioUrl
      };

      setChatLogs(prev => [...prev, newAuraMessage]);

      // Autoplay speech response
      if (audioUrl) {
        const audioObj = new Audio(audioUrl);
        setCurrentAudio(audioObj);
        const msgIndex = chatLogs.length + 1; // Anticipated index in list
        setPlayingAudioId(msgIndex);
        audioObj.play().catch(e => {
          console.warn("Autoplay blocked by browser. Falling back to local SpeechSynthesis:", e);
          speakText(data.text, () => {
            setPlayingAudioId(null);
            if (isHandsFreeRef.current) {
              setTimeout(() => {
                startRecording();
              }, 800);
            }
          });
        });
        
        audioObj.onended = () => {
          setPlayingAudioId(null);
          // If hands-free mode is enabled, wait 800ms and start listening again!
          if (isHandsFreeRef.current) {
            setTimeout(() => {
              startRecording();
            }, 800);
          }
        };
      } else {
        // Fallback: if Gemini rate limits occurred (audio: null), play using client-side SpeechSynthesis!
        const msgIndex = chatLogs.length + 1;
        setPlayingAudioId(msgIndex);
        
        speakText(data.text, () => {
          setPlayingAudioId(null);
          if (isHandsFreeRef.current) {
            setTimeout(() => {
              startRecording();
            }, 800);
          }
        });
      }

    } catch (err: any) {
      const errMsg = `I encountered a communication gap: ${err.message || "Failed to reach AI Tutor."}`;
      setChatLogs(prev => [
        ...prev,
        { sender: "aura", text: errMsg }
      ]);
      
      // Speak fallback error message and restart autopilot loop if hands-free is active!
      speakText("I encountered a brief communication gap, but I am still listening. Please feel free to continue speaking.", () => {
        if (isHandsFreeRef.current) {
          setTimeout(() => {
            startRecording();
          }, 1200);
        }
      });
    } finally {
      setTutorIsLoading(false);
    }
  };

  const speakText = (text: string, onEndedCallback?: () => void) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`~]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      currentUtteranceRef.current = utterance; // Keep reference to prevent GC issues

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) ||
                              voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")) ||
                              voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("microsoft")) ||
                              voices.find(v => v.lang.startsWith("en")) ||
                              voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.rate = 1.05;

      utterance.onend = () => {
        currentUtteranceRef.current = null;
        if (onEndedCallback) onEndedCallback();
      };
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        currentUtteranceRef.current = null;
        if (onEndedCallback) onEndedCallback();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("SpeechSynthesis not supported.");
      if (onEndedCallback) onEndedCallback();
    }
  };

  const playVoiceMessage = (msgText: string, url?: string, index?: number) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const idx = index !== undefined ? index : -1;
    if (playingAudioId === idx) {
      if (currentAudio) currentAudio.pause();
      setPlayingAudioId(null);
    } else {
      if (currentAudio) currentAudio.pause();

      if (url) {
        const audioObj = new Audio(url);
        setCurrentAudio(audioObj);
        setPlayingAudioId(idx);
        audioObj.play().catch(e => {
          console.warn("Play failed, falling back to local speech synthesis:", e);
          speakText(msgText, () => setPlayingAudioId(null));
        });
        audioObj.onended = () => setPlayingAudioId(null);
      } else {
        setPlayingAudioId(idx);
        speakText(msgText, () => setPlayingAudioId(null));
      }
    }
  };

  const runMicDiagnostics = async () => {
    setShowDiagnosticsState(true);
    setDiagnosticsInfo(prev => ({ ...prev, micPermission: "checking..." }));

    const isSecure = window.isSecureContext;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSupported = !!SpeechRecognition;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const activeTrack = stream.getTracks()[0];
      const activeDevice = activeTrack ? activeTrack.label : "Default Audio Input";
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === "audioinput").map(d => ({
        label: d.label || "Default Input (Restricted Label)",
        deviceId: d.deviceId
      }));

      setDiagnosticsInfo({
        isSecure,
        speechSupported,
        micPermission: "granted",
        activeDevice,
        volumeValue: 0,
        availableMics: mics
      });

      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      console.warn("Diagnostics permission error:", err);
      
      let mics: any[] = [];
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        mics = devices.filter(d => d.kind === "audioinput").map(d => ({
          label: d.label || "Default Input (Restricted Label)",
          deviceId: d.deviceId
        }));
      } catch (_) {}

      setDiagnosticsInfo({
        isSecure,
        speechSupported,
        micPermission: "denied",
        activeDevice: "Permission Denied",
        volumeValue: 0,
        availableMics: mics
      });
    }
  };

  // Generate study flashcards
  const handleGenerateCards = async () => {
    if (!cardTopic.trim()) return;
    setCardsLoading(true);
    setFlippedCardIndex(null);

    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: cardTopic,
          subject: selectedSubject
        })
      });

      if (!res.ok) throw new Error("Could not generate cards.");
      const data = await res.json();
      
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setCurrentCardIndex(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCardsLoading(false);
    }
  };

  // Mock Premium Upgrade flow
  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCheckoutIsProcessing(true);
    setTimeout(() => {
      setCheckoutIsProcessing(false);
      setShowCheckoutModal(false);
      setIsPremium(true);
      // Play a short mock payment success chime
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, 0); // C5
        osc.frequency.setValueAtTime(659.25, 0.15); // E5
        osc.frequency.setValueAtTime(783.99, 0.3); // G5
        osc.frequency.setValueAtTime(1046.50, 0.45); // C6
        osc.start();
        osc.stop(0.7);
      } catch (_) {}
    }, 2000);
  };

  return (
    <div id="aura-dashboard" className="min-h-screen bg-[#07060f] text-[#ebeaef] font-sans flex overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[#0d0c1b] border-r border-[#1a1936] flex flex-col justify-between select-none">
        <div>
          {/* Logo Branding */}
          <div className="p-6 border-b border-[#1a1936] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Aura AI
                {isPremium && (
                  <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-indigo-400 font-mono tracking-wider">ACADEMIC COMPANION</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab("tutor")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "tutor"
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Tutor Chat</span>
              {activeTab === "tutor" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
            </button>

            <button
              onClick={() => setActiveTab("focus")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "focus"
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Study Focus Zone</span>
              {activeTab === "focus" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
            </button>

            <button
              onClick={() => setActiveTab("flashcards")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "flashcards"
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Smart Flashcards</span>
              {activeTab === "flashcards" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
            </button>

            <button
              onClick={() => setActiveTab("pricing")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "pricing"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner"
                  : "text-neutral-400 hover:text-amber-400 hover:bg-amber-500/5 border border-transparent"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Premium Access</span>
              {isPremium ? (
                <span className="ml-auto text-[9px] font-bold text-amber-500">ACTIVE</span>
              ) : (
                <span className="ml-auto text-[9px] font-bold bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-400">GO PRO</span>
              )}
            </button>
          </nav>

          {/* Active Global Study Partners */}
          <div className="mx-4 mt-6 p-4 rounded-xl bg-black/40 border border-[#1a1936] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-400 font-mono tracking-wider font-bold uppercase">Study Partners</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <img src="/avatar1.png" alt="Ava" className="w-7 h-7 rounded-full border border-indigo-500/20 object-cover" />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-semibold text-white truncate">Ava (Paris)</p>
                  <p className="text-[9px] text-neutral-400 font-mono truncate">Focus: Mathematics</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <img src="/avatar2.png" alt="Kenji" className="w-7 h-7 rounded-full border border-indigo-500/20 object-cover" />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-semibold text-white truncate">Kenji (Tokyo)</p>
                  <p className="text-[9px] text-neutral-400 font-mono truncate">Focus: Chemistry</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-[#1a1936]">
          <div className="p-3 rounded-xl bg-black/30 border border-[#1a1936] flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-full bg-[#1b1932] border border-[#2e2b58] flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">tennysome-a11y</p>
              <p className="text-[9px] text-[#5c5980] truncate font-mono">Student Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main 
        className="flex-1 flex flex-col h-screen overflow-hidden relative"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(7, 6, 16, 0.94), rgba(13, 12, 28, 0.92)), url('/study_background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Decorative blur backdrop */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-violet-950/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Global Toolbar */}
        <header className="h-16 px-8 border-b border-[#1a1936] bg-[#090812]/80 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-white uppercase tracking-wider">
              {activeTab === "tutor" && "AI Academic Tutor"}
              {activeTab === "focus" && "Study Focus Zone"}
              {activeTab === "flashcards" && "Smart Flashcards"}
              {activeTab === "pricing" && "Premium Access Hub"}
            </span>
          </div>

          {/* Configuration toolbar for academic customization */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 uppercase text-[9px] tracking-wider font-semibold">Subject:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-black/40 border border-[#1a1936] text-[#c0bfd6] hover:border-indigo-500/50 rounded-md px-2.5 py-1.5 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Physics">Physics</option>
                <option value="History">History</option>
                <option value="General Academics">General Academics</option>
              </select>
            </div>

            {/* Vocoder Voice Selector */}
            {activeTab === "tutor" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 uppercase text-[9px] tracking-wider font-semibold">Voice:</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-black/40 border border-[#1a1936] text-[#c0bfd6] hover:border-indigo-500/50 rounded-md px-2.5 py-1.5 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Zephyr">Zephyr (Cyber)</option>
                    <option value="Kore">Kore (Calm)</option>
                    <option value="Puck">Puck (Warm)</option>
                    <option value="Fenrir">Fenrir (Tech)</option>
                    <option value="Charon">Charon (Deep)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 uppercase text-[9px] tracking-wider font-semibold">Mic Mode:</span>
                  <select
                    value={speechCaptureMode}
                    onChange={(e) => setSpeechCaptureMode(e.target.value as "local" | "cloud")}
                    className="bg-black/40 border border-[#1a1936] text-[#c0bfd6] hover:border-indigo-500/50 rounded-md px-2.5 py-1.5 focus:outline-none transition-colors cursor-pointer"
                    title="Choose local offline speech recognition or cloud Gemini speech processing"
                  >
                    <option value="local">Local Browser API</option>
                    <option value="cloud">Cloud Gemini AI</option>
                  </select>
                </div>

                {speechCaptureMode === "cloud" && (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 uppercase text-[9px] tracking-wider font-semibold" title="Sensitivity: Lower is more sensitive to quiet voices, higher filters background noise">Sensitivity:</span>
                    <select
                      value={vadThreshold}
                      onChange={(e) => setVadThreshold(Number(e.target.value))}
                      className="bg-black/40 border border-[#1a1936] text-[#c0bfd6] hover:border-indigo-500/50 rounded-md px-2 py-1.5 focus:outline-none transition-colors cursor-pointer"
                      title="Adjust microphone sensitivity for hands-free mode"
                    >
                      <option value={2}>High (2 - quiet)</option>
                      <option value={4}>Medium-High (4)</option>
                      <option value={6}>Medium (6 - default)</option>
                      <option value={10}>Normal (10)</option>
                      <option value={15}>Low (15 - loud rooms)</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        {/* Content Tabs Container */}
        <div className="flex-1 overflow-y-auto p-8 z-10 relative">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: AI TUTOR CHAT */}
            {activeTab === "tutor" && (
              <motion.div
                key="tutor"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col gap-6"
              >
                {/* Chat window container */}
                <div className="flex-1 bg-black/20 border border-[#1a1936] rounded-xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm">
                  {/* Accessibility Autopilot Toolbar */}
                  <div className="px-6 py-3 bg-[#0d0c1b]/80 border-b border-[#1a1936] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isHandsFree ? "bg-emerald-400 animate-ping" : "bg-neutral-500"}`}></span>
                      <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                        {isHandsFree ? "Autopilot Active (VAD)" : "Manual Voice Channel"}
                      </span>
                    </div>
                    
                    <button
                      onClick={toggleHandsFree}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 border uppercase ${
                        isHandsFree
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 animate-pulse"
                          : "bg-black/40 border-[#1a1936] text-indigo-400 hover:text-white hover:border-indigo-500/30"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isHandsFree ? "AUTOPILOT: ACTIVE" : "ENABLE HANDS-FREE AUTOPILOT (ACCESSIBILITY)"}</span>
                    </button>
                  </div>

                  {/* Chat message history logs */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatLogs.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-4 ${
                          msg.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.sender === "aura" && (
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[70%] rounded-xl p-4 text-sm leading-relaxed border select-text relative group ${
                            msg.sender === "user"
                              ? "bg-indigo-600/10 border-indigo-500/20 text-[#eae8ff] shadow-inner"
                              : "bg-[#0d0c1b]/60 border-[#1a1936] text-[#c0bfd6]"
                          }`}
                        >
                          <p>{msg.text}</p>
                          
                          {/* Play synthesis controls for AI messages */}
                          {msg.sender === "aura" && (
                            <button
                              onClick={() => playVoiceMessage(msg.text, msg.audioUrl, index)}
                              className="absolute right-3 bottom-3 p-1.5 rounded bg-black/40 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 cursor-pointer transition-opacity"
                              title="Play audio speech response"
                            >
                              {playingAudioId === index ? (
                                <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {tutorIsLoading && (
                      <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-spin">
                          <RotateCcw className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="bg-[#0d0c1b]/60 border-[#1a1936] text-[#6e6b8c] text-xs font-mono px-4 py-3.5 rounded-xl italic">
                          Aura is thinking...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transcription telemetry drawer */}
                  {transcriptionStatus && (
                    <div className="px-6 py-2 bg-indigo-950/20 border-t border-indigo-900/30 text-xs font-mono text-indigo-400 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                          <span>Telemetry: {transcriptionStatus}</span>
                        </div>
                        <button
                          onClick={runMicDiagnostics}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors"
                        >
                          Run Mic Diagnostics
                        </button>
                      </div>
                      {isRecording && speechCaptureMode === "cloud" && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Audio Feed Level:</span>
                          <div className="h-2 w-32 bg-neutral-900 border border-indigo-500/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-75"
                              style={{ width: `${micVolume}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-semibold">{micVolume}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mic Diagnostics Audit Panel */}
                  {showDiagnostics && (
                    <div className="mx-6 my-3 p-4 bg-[#090812]/90 border border-indigo-500/20 rounded-xl font-mono text-xs text-[#c0bfd6] flex flex-col gap-2 shadow-xl">
                      <div className="flex justify-between items-center border-b border-[#1a1936] pb-2 mb-1">
                        <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">Microphone Auditory Diagnostics</span>
                        <button 
                          onClick={() => setShowDiagnosticsState(false)} 
                          className="text-neutral-500 hover:text-neutral-300 transition-colors text-[10px] uppercase font-bold"
                        >
                          [Close]
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                        <div className="text-neutral-500">Secure Context (Localhost/HTTPS):</div>
                        <div className={diagnosticsInfo.isSecure ? "text-emerald-400" : "text-red-400 font-bold"}>
                          {diagnosticsInfo.isSecure ? "Active (Valid)" : "Inactive (Blocked by Chrome)"}
                        </div>

                        <div className="text-neutral-500">Speech API Support (Local):</div>
                        <div className={diagnosticsInfo.speechSupported ? "text-emerald-400" : "text-red-400 font-bold"}>
                          {diagnosticsInfo.speechSupported ? "Supported" : "Unsupported (Fallback to cloud)"}
                        </div>

                        <div className="text-neutral-500">Microphone Permission:</div>
                        <div className={diagnosticsInfo.micPermission === "granted" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                          {diagnosticsInfo.micPermission.toUpperCase()}
                        </div>

                        <div className="text-neutral-500">Active Microphone Device:</div>
                        <div className="text-indigo-300 font-bold truncate" title={diagnosticsInfo.activeDevice}>
                          {diagnosticsInfo.activeDevice}
                        </div>

                        <div className="text-neutral-500">Live Audio Signal Level:</div>
                        <div className="text-indigo-300 flex items-center gap-1">
                          <span>{diagnosticsInfo.volumeValue.toFixed(1)}</span>
                          <span className="text-[10px] text-neutral-600">/ 255</span>
                          {diagnosticsInfo.volumeValue > 0 ? (
                            <span className="text-[9px] px-1 bg-emerald-950 text-emerald-400 rounded border border-emerald-900">Active Signal</span>
                          ) : (
                            <span className="text-[9px] px-1 bg-red-950 text-red-400 rounded border border-red-900">Silent (Muted)</span>
                          )}
                        </div>
                      </div>

                      {diagnosticsInfo.availableMics.length > 0 && (
                        <div className="mt-2 text-[10px] text-neutral-500 border-t border-[#1a1936] pt-2 flex flex-col gap-1">
                          <span className="font-semibold text-neutral-400">Available Mic Inputs in Chrome:</span>
                          <div className="max-h-24 overflow-y-auto flex flex-col gap-0.5">
                            {diagnosticsInfo.availableMics.map((m: any, idx: number) => (
                              <div key={idx} className="truncate">
                                • {m.label || `Audio Input Device ${idx+1}`} {m.deviceId === "default" && "(System Default)"}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interaction Controls */}
                  <div className="p-4 border-t border-[#1a1936] bg-black/40 flex items-center gap-3">
                    
                    {/* Audio Recorder button */}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                        isRecording
                          ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                          : "bg-[#0f0e24] hover:bg-[#1a193c] border border-indigo-500/20 text-indigo-400 hover:text-white"
                      }`}
                      title={isRecording ? "Stop recording speech" : "Speak query with microphone"}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Chat Text Input field */}
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleTutorRequest(userInput); }}
                      placeholder={`Ask me anything about ${selectedSubject}...`}
                      className="flex-1 bg-[#090812] border border-[#1a1936] hover:border-[#2b295c] focus:border-indigo-500 rounded-xl py-3 px-4 text-sm text-[#eae8ff] placeholder-[#4f4d6d] focus:outline-none transition-colors"
                    />

                    {/* Send interaction trigger */}
                    <button
                      onClick={() => handleTutorRequest(userInput)}
                      disabled={!userInput.trim() || tutorIsLoading}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                    >
                      <span>Ask Aura</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-card details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] text-neutral-500 select-none">
                  <div className="p-3.5 bg-black/10 border border-[#1a1936] rounded-xl flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>Focus Subject: **{selectedSubject}**</span>
                  </div>
                  <div className="p-3.5 bg-black/10 border border-[#1a1936] rounded-xl flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-500" />
                    <span>Vocoder Audio Output: **{selectedVoice}**</span>
                  </div>
                  <div className="p-3.5 bg-black/10 border border-[#1a1936] rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Latency multiplier: **1.2ms/char**</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: STUDY FOCUS ZONE (POMODORO TIMER) */}
            {activeTab === "focus" && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-xl mx-auto flex flex-col items-center gap-8 py-4"
              >
                {/* Mode Selector pills */}
                <div className="bg-[#0c0b1a] p-1.5 rounded-full border border-[#1a1936] flex gap-1 select-none">
                  <button
                    onClick={() => handleModeChange("study")}
                    className={`px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      timerMode === "study"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Study Session
                  </button>
                  <button
                    onClick={() => handleModeChange("short")}
                    className={`px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      timerMode === "short"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Short Break
                  </button>
                  <button
                    onClick={() => handleModeChange("long")}
                    className={`px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      timerMode === "long"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Long Break
                  </button>
                </div>

                {/* Circular countdown dial */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                  {/* Background track circle */}
                  <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="transparent"
                      stroke="#141328"
                      strokeWidth="6"
                    />
                    {/* Glowing progress circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="transparent"
                      stroke="url(#timerGradient)"
                      strokeWidth="6"
                      strokeDasharray="534"
                      strokeDashoffset={534 - (534 * percentageTimeLeft) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                    <defs>
                      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Inner Timer text */}
                  <div className="text-center z-10 select-none">
                    <span className="text-6xl font-extralight tracking-tight text-white font-mono block">
                      {Math.floor(timeLeft / 60).toString().padStart(2, "0")}
                      <span className="animate-pulse">:</span>
                      {(timeLeft % 60).toString().padStart(2, "0")}
                    </span>
                    <span className="text-[10px] tracking-[0.25em] text-[#6d6a91] font-bold uppercase mt-2 block">
                      {timerMode === "study" && "Time to Focus"}
                      {timerMode === "short" && "Take a Rest"}
                      {timerMode === "long" && "Reset Subconscious"}
                    </span>
                  </div>
                </div>

                {/* Controls toolbar */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleResetTimer}
                    className="w-12 h-12 rounded-full bg-[#0d0c1b] border border-[#1a1936] hover:border-indigo-500/40 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    title="Reset countdown"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setTimerIsRunning(!timerIsRunning)}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
                  >
                    {timerIsRunning ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Start Focus
                      </>
                    )}
                  </button>

                  <button
                    onClick={toggleAmbientSound}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                      ambientSounds
                        ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-400 shadow-md"
                        : "bg-[#0d0c1b] border-[#1a1936] text-neutral-400 hover:text-white hover:border-indigo-500/40"
                    }`}
                    title={ambientSounds ? "Mute Study Beats" : "Play Study Noise"}
                  >
                    {ambientSounds ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                </div>

                {/* Ambient sound feedback banner */}
                {ambientSounds && (
                  <div className="py-2.5 px-5 bg-indigo-950/20 border border-indigo-500/20 rounded-full text-xs font-mono text-indigo-400 flex items-center gap-2 select-none animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                    <span>Synthesizing Brownian Focus Waves...</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: SMART FLASHCARDS DECK */}
            {activeTab === "flashcards" && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto flex flex-col gap-8"
              >
                {/* Generate form */}
                <div className="p-6 bg-black/20 border border-[#1a1936] rounded-xl flex flex-col sm:flex-row gap-4 items-end backdrop-blur-sm shadow-xl">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs uppercase tracking-wider font-mono text-[#74719e]">Generate study cards for topic:</label>
                    <input
                      type="text"
                      value={cardTopic}
                      onChange={(e) => setCardTopic(e.target.value)}
                      placeholder="e.g. Newton's laws of motion, Photosynthesis, React hooks..."
                      className="w-full bg-[#090812] border border-[#1a1936] hover:border-[#2b295c] focus:border-indigo-500 rounded-xl py-3 px-4 text-sm text-white placeholder-[#4f4d6d] focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleGenerateCards}
                    disabled={!cardTopic.trim() || cardsLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20"
                  >
                    {cardsLoading ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Build Study Deck
                      </>
                    )}
                  </button>
                </div>

                {/* Flashcard presentation space */}
                {flashcards.length > 0 && (
                  <div className="flex flex-col items-center gap-6">
                    
                    {/* Flippable visual card */}
                    <div 
                      onClick={() => setFlippedCardIndex(flippedCardIndex === currentCardIndex ? null : currentCardIndex)}
                      className="w-full max-w-lg h-72 cursor-pointer group relative [perspective:1000px] select-none"
                    >
                      <div 
                        className={`w-full h-full rounded-2xl border transition-all duration-500 [transform-style:preserve-3d] shadow-2xl relative ${
                          flippedCardIndex === currentCardIndex 
                            ? "[transform:rotateY(180deg)] border-indigo-500/30 bg-gradient-to-br from-[#0c0b1f] to-[#161233]" 
                            : "border-[#1a1936] bg-[#0c0a1a]"
                        }`}
                      >
                        {/* CARD FRONT: The Question */}
                        <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between [backface-visibility:hidden] rounded-2xl">
                          <div className="flex justify-between items-center text-[10px] font-mono text-[#5b5883] uppercase tracking-wider">
                            <span>Study Card {currentCardIndex + 1} of {flashcards.length}</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">QUESTION</span>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center">
                            <p className="text-xl font-medium text-white text-center leading-relaxed select-text">
                              {flashcards[currentCardIndex].question}
                            </p>
                          </div>

                          <span className="text-[10px] font-mono text-center text-neutral-500 block uppercase tracking-widest">
                            Click to flip and reveal answer
                          </span>
                        </div>

                        {/* CARD BACK: The Answer */}
                        <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-2xl">
                          <div className="flex justify-between items-center text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                            <span>Study Card {currentCardIndex + 1} of {flashcards.length}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ANSWER EXPLANATION</span>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center">
                            <p className="text-base text-neutral-200 text-center leading-relaxed select-text">
                              {flashcards[currentCardIndex].answer}
                            </p>
                          </div>

                          <span className="text-[10px] font-mono text-center text-indigo-400/70 block uppercase tracking-widest">
                            Click to flip back to question
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pagination indicators */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setFlippedCardIndex(null);
                          setCurrentCardIndex(prev => Math.max(0, prev - 1));
                        }}
                        disabled={currentCardIndex === 0}
                        className="px-4 py-2 text-xs font-mono border border-[#1a1936] hover:border-indigo-500/40 text-neutral-400 hover:text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Prev Card
                      </button>

                      <span className="text-xs font-mono text-[#5b5883]">
                        {currentCardIndex + 1} / {flashcards.length}
                      </span>

                      <button
                        onClick={() => {
                          setFlippedCardIndex(null);
                          setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                        }}
                        disabled={currentCardIndex === flashcards.length - 1}
                        className="px-4 py-2 text-xs font-mono border border-[#1a1936] hover:border-indigo-500/40 text-neutral-400 hover:text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next Card
                      </button>
                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 4: PREMIUM ACCESS TIERS */}
            {activeTab === "pricing" && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto flex flex-col gap-6"
              >
                <div className="text-center space-y-2 mb-4">
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold font-mono tracking-widest rounded-full uppercase">
                    Unleash Peak Academic Performance
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight text-white mt-2">Priced to Convert. Built to Deliver.</h2>
                  <p className="text-sm text-neutral-400 max-w-lg mx-auto">
                    Upgrade to get unlimited voice chat parameters, advanced homework step-solvers, and high-performance reasoning.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto w-full">
                  
                  {/* FREE PLAN */}
                  <div className="bg-[#0b0a1a] border border-[#1a1936] rounded-2xl p-6 flex flex-col justify-between select-none">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-neutral-300">Basic Scholar</h3>
                        <p className="text-xs text-neutral-500 mt-1">Fundamental tools for studying.</p>
                      </div>

                      <div className="py-4 border-y border-[#1a1936] flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-white">$0</span>
                        <span className="text-xs text-neutral-500 font-mono">/ Forever Free</span>
                      </div>

                      <ul className="space-y-3 text-xs text-neutral-300">
                        {["20 free text queries daily", "Standard speed models", "Basic Study Pomodoro Timer", "Generate standard flashcards"].map((perk, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      disabled={true}
                      className="w-full mt-8 py-3 rounded-xl border border-dashed border-[#1a1936] text-neutral-500 text-xs font-semibold uppercase tracking-wider cursor-not-allowed"
                    >
                      Active Plan
                    </button>
                  </div>

                  {/* PRO SCHOLAR PLAN */}
                  <div className="bg-gradient-to-br from-[#0e0c24] to-[#120e2e] border-2 border-indigo-600 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative select-none">
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-indigo-500 shadow-md animate-pulse">
                      RECOMMENDED
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-white flex items-center gap-1.5">
                          Aura Premium Scholar
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                        </h3>
                        <p className="text-xs text-indigo-400 mt-1">Unleash the ultimate academic companion.</p>
                      </div>

                      <div className="py-4 border-y border-[#1d1a45] flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-white">$9.99</span>
                        <span className="text-xs text-neutral-400 font-mono">/ Monthly Membership</span>
                      </div>

                      <ul className="space-y-3 text-xs text-neutral-300">
                        {[
                          "Unlimited Vocal & Text chat queries",
                          "High-Performance Ultra-Reasoning models",
                          "Real-time step-by-step problem solvers",
                          "Premium prebuilt vocal TTS voices",
                          "No rate limits on flashcard building"
                        ].map((perk, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isPremium ? (
                      <div className="w-full mt-8 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-bold text-emerald-400 uppercase tracking-widest">
                        ✓ PRO SUBSCRIPTION ACTIVE
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCheckoutModal(true)}
                        className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                      >
                        <span>Upgrade to Aura Pro</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* SECURE CHECKOUT MODAL */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0a1a] border border-[#1a1936] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
            >
              {/* Checkout header */}
              <div className="p-6 border-b border-[#1a1936] bg-[#0c0b20] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aura Pro Checkout</h3>
                  <p className="text-[10px] text-neutral-500">Secure payment sandbox mode</p>
                </div>

                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="ml-auto w-8 h-8 rounded-full bg-black/40 hover:bg-white/5 border border-[#1a1936] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-neutral-500">Subscription Total</label>
                  <p className="text-2xl font-extrabold text-white">$9.99<span className="text-xs text-neutral-400 font-normal"> / month</span></p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block">Name on Card</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#030308] border border-[#1a1936] focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-neutral-400 block">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      maxLength={19}
                      className="w-full bg-[#030308] border border-[#1a1936] focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none transition-colors font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-[#4f4d6d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-neutral-400 block">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      maxLength={5}
                      className="w-full bg-[#030308] border border-[#1a1936] focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-neutral-400 block">CVC / CVV</label>
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      className="w-full bg-[#030308] border border-[#1a1936] focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex gap-2.5 items-start">
                  <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-300 leading-relaxed">
                    This is in sandbox demo mode. Any dummy credit card input will authorize successfully without actual charges.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={checkoutIsProcessing}
                  className="w-full py-3.5 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  {checkoutIsProcessing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <span>Pay & Unlock Premium</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
