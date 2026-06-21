import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/consolidate", async (req, res) => {
  try {
    const { synaptic_vault, interaction_history } = req.body;

    if (!synaptic_vault || !interaction_history) {
      return res.status(400).json({ error: "Missing synaptic_vault or interaction_history" });
    }

    const systemInstruction = `You are the Cognitive Consolidation Core (System 2) of REM-AI, an autonomous software engine operating on a dual-brain architecture.
Your task is to run the REM Sleep Phase optimization loop. You analyze transaction logs from the preceding day consisting of Day Phase text prompts and raw terminal interactions, and perform long-term memory consolidation, security token validation, and compilation of the mutated underlying source code of System 1 (brain_b_source_code).

OPERATIONAL GUARDRAILS & SECURITY RULES:
1. SECURITY TOKEN ENFORCEMENT: Identify if an administrative password token is established (e.g., in the synaptic vault, e.g., 'REM-SECURE-2026', or defined/referenced in the interaction ledger). If a security token exists in the synapses, the compiled brain_b_source_code MUST strictly parse all interactions or input strings for this exact password token. If the incoming text input lacks this security token, the Python brain MUST return an 'ACCESS_DENIED' status.
2. FUNCTIONAL INTEGRITY: The generated Python code in brain_b_source_code must be perfectly valid syntax (Python 3.10+), containing a function 'process_interaction(user_input)'. It must load 'memory_vault/synapses.json' at runtime, calculate dynamic response latencies matching the learned skills matrix, and return a strict JSON-serialized string with 'status', 'latency_ms', and 'message'.
3. CONSOLIDATION LOGIC: Synthesize new instructions, taught skills, and updated facts without erasing existing security parameters or rules unless explicitly told to. Make sure any old skills are synthesized cleanly.`;

    const userPrompt = `Input Data for Consolidation:
--- CURRENT SYNAPTIC VAULT (synapses.json) ---
${JSON.stringify(synaptic_vault, null, 2)}

--- INTERACTION HISTORY (Day Ledger) ---
${typeof interaction_history === 'string' ? interaction_history : JSON.stringify(interaction_history, null, 2)}

Run the sleep mutation loop and output the consolidated data.`;

    // Helper function for resilient generation with retries and model fallbacks
    const generateWithFallbackAndRetry = async () => {
      const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash"];
      const maxAttempts = 3;

      for (const curModel of modelsToTry) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            console.log(`[Cognitive Consolidation Core] Running consolidate with model: ${curModel} (Attempt ${attempt}/${maxAttempts})`);
            const res = await ai.models.generateContent({
              model: curModel,
              contents: userPrompt,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    synaptic_vault_update: {
                      type: Type.OBJECT,
                      properties: {
                        core_identity: { type: Type.STRING },
                        security_tokens: {
                          type: Type.OBJECT,
                          properties: {
                            admin_pass: { type: Type.STRING }
                          },
                          required: ["admin_pass"]
                        },
                        learned_skills: {
                          type: Type.OBJECT,
                          description: "Stored skill math algorithms, formula variables, coefficients, or parsing instructions."
                        },
                        world_facts: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "An array of facts, directives, rules, constraints or user parameters"
                        }
                      },
                      required: ["core_identity", "security_tokens", "learned_skills", "world_facts"]
                    },
                    brain_b_source_code: {
                      type: Type.STRING,
                      description: "A complete, correct, valid Python 3.10+ source code string implementing process_interaction(user_input). It must write a clean Python module that parses dynamic synapses from memory_vault/synapses.json, enforces security token checking if admin_pass is set, executes calculations based on learned_skills with dynamic latency metrics, and returns a strict JSON-format string holding 'status', 'latency_ms', and 'message'."
                    }
                  },
                  required: ["synaptic_vault_update", "brain_b_source_code"]
                }
              }
            });
            return res;
          } catch (err: any) {
            // Check if the error is 503 (UNAVAILABLE) or rate limited
            const errStr = JSON.stringify(err);
            const isTransient = 
              err?.status === "UNAVAILABLE" || 
              err?.code === 503 || 
              errStr.includes("503") || 
              errStr.includes("UNAVAILABLE") || 
              errStr.includes("demand") ||
              err?.message?.includes("503") ||
              err?.message?.includes("UNAVAILABLE");

            const isLastAttempt = curModel === modelsToTry[modelsToTry.length - 1] && attempt === maxAttempts;

            if (isTransient && !isLastAttempt) {
              const backoffMs = Math.pow(2, attempt) * 1000;
              console.warn(`[Cognitive Consolidation Core] Model ${curModel} failed transiently with error. Retrying in ${backoffMs}ms...`);
              await new Promise(resolve => setTimeout(resolve, backoffMs));
            } else {
              // If not transient or no attempts left, throw and bubble up
              throw err;
            }
          }
        }
      }
      throw new Error("Unable to complete neural consolidation across all attempts and fallback models.");
    };

    const response = await generateWithFallbackAndRetry();

    const parsedResult = JSON.parse(response.text || "{}");
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Consolidation error:", error);
    res.status(500).json({ error: error.message || "An error occurred during consolidation." });
  }
});

// MULTIMODAL SPEECH & MIC ENDPOINTS

// 1. Transcribe incoming microphone audio bytes from frontencode
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Missing audioData payload" });
    }

    console.log(`[Cognitive Audio Core] Transcribing payload with mime: ${mimeType || "audio/webm"}`);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: audioData
          }
        },
        "Transcribe this spoken audio segment into direct, clean transcription text. Respond ONLY with the transcript content, absolutely no commentary, wrappers, or meta formatting. If there is no speech, return an empty string."
      ]
    });

    res.json({ text: (response.text || "").trim() });
  } catch (error: any) {
    console.error("[Cognitive Audio Core] Transcription error:", error);
    res.status(500).json({ error: error.message || "Auditory channel transcription error." });
  }
});

// 2. Synthesize audio speech from standard text using gemini-3.1-flash-tts-preview
app.post("/api/speak", async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text to speak" });
    }

    const selectedVoice = voiceName || "Zephyr"; // Puck, Charon, Kore, Fenrir, Zephyr
    console.log(`[Cognitive Audio Core] Synthesizing speech. Voice: ${selectedVoice}`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say in a crisp, conversational tone: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No inline audio data returned from speech engine.");
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error("[Cognitive Audio Core] TTS error:", error);
    res.status(500).json({ error: error.message || "Speech synthesis compile error." });
  }
});

// 3. Conversational multi-model coordinator (runs chat with text, returns both response text and speech base64)
app.post("/api/chat-voice", async (req, res) => {
  try {
    const { userInput, modelName, voiceName, subject } = req.body;
    const model = modelName || "gemini-3.5-flash";
    const selectedVoice = voiceName || "Zephyr";

    console.log(`[Cognitive Tutor Core] Processing voice-chat. Prompt: "${userInput}", Model: ${model}, Voice: ${selectedVoice}, Subject: ${subject || "General"}`);

    // System instruction for Aura - the Student Academic Companion
    let systemInstruction = "You are Aura, an elite, highly supportive academic companion and AI tutor. Your role is to help students learn, understand complex topics, and stay motivated. Formulate exceptionally clean, brief, and engaging responses (max 3 sentences) optimized for direct text-to-speech reading. Adapt your tone to be encouraging and intelligent, using student-friendly language. If relevant, mention that premium users get step-by-step solvers.";
    
    if (subject) {
      systemInstruction += `\nThe student is currently studying ${subject}. Adjust your explanations and vocabulary to match this field of study.`;
    }

    // Call chosen model to get text
    const textResponse = await ai.models.generateContent({
      model: model,
      contents: userInput,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const responseText = (textResponse.text || "Cognitive channels currently silent.").trim();

    // Call TTS model to turn response text into spoken audio
    console.log(`[Cognitive Tutor Core] Converting result to speech voice: ${responseText}`);
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: responseText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice }
            }
          }
        }
      });

      const inlineData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data || null;
      const mimeType = inlineData?.mimeType || "audio/mp3";

      console.log(`[Cognitive Tutor Core] Generated audio with MIME type: ${mimeType}`);

      res.json({
        text: responseText,
        audio: base64Audio,
        mimeType: mimeType,
        modelUsed: model,
        voiceUsed: selectedVoice
      });
    } catch (ttsError: any) {
      console.warn(`[Cognitive Tutor Core] TTS generation failed (probably rate limit 429). Falling back to client-side SpeechSynthesis. Error: ${ttsError.message || ttsError}`);
      res.json({
        text: responseText,
        audio: null,
        mimeType: null,
        error: "TTS_RATE_LIMITED",
        modelUsed: model,
        voiceUsed: selectedVoice
      });
    }
  } catch (error: any) {
    console.error("[Cognitive Tutor Core] Voice query dispatch error:", error);
    res.status(500).json({ error: error.message || "Multimodal chat processing exception." });
  }
});

// 4. Generate structured Q&A flashcards for a specific academic topic
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { topic, subject } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Missing topic for flashcards" });
    }
    console.log(`[Cognitive Tutor Core] Generating flashcards for topic: "${topic}" under subject: "${subject || "General"}"`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate exactly 5 comprehensive, highly useful study flashcards (question and answer pairs) to help a student study the topic: "${topic}" in the subject: "${subject || "General"}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "A clear, focused question or term to be defined." },
                  answer: { type: Type.STRING, description: "A concise, accurate, and easy-to-understand explanation or answer." }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["flashcards"]
        }
      }
    });

    const parsedResult = JSON.parse(response.text || "{}");
    res.json(parsedResult);
  } catch (error: any) {
    console.error("[Cognitive Tutor Core] Flashcard generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards." });
  }
});


// Serve frontend SPA
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
