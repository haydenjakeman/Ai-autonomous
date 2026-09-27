import {
    CreateMLCEngine
} from "https://esm.run/@mlc-ai/web-llm";


// =====================================================
// PULSE AI
// =====================================================

const MODEL = "Qwen3-0.6B-q4f16_1-MLC";

let engine = null;
let loading = false;


// =====================================================
// ELEMENTS
// =====================================================

const chat =
    document.getElementById("chat");

const input =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const downloadButton =
    document.getElementById(
        "downloadBrainButton"
    );

const status =
    document.getElementById("status");

const progress =
    document.getElementById("progress");


// =====================================================
// ADD MESSAGE
// =====================================================

function addMessage(text, type) {

    const message =
        document.createElement("div");

    message.className =
        `message ${type}`;

    message.textContent = text;

    chat.appendChild(message);

    chat.scrollTop =
        chat.scrollHeight;

    return message;
}


// =====================================================
// DOWNLOAD / LOAD AI BRAIN
// =====================================================

async function downloadBrain() {

    if (loading || engine) {
        return;
    }

    // Check WebGPU

    if (!navigator.gpu) {

        status.textContent =
            "WebGPU unavailable";

        progress.textContent =
            "Your browser/device doesn't support WebGPU.";

        return;
    }

    loading = true;

    downloadButton.disabled = true;

    sendButton.disabled = true;

    status.textContent =
        "Downloading AI brain...";

    progress.textContent =
        "Starting...";


    try {

        engine =
            await CreateMLCEngine(
                MODEL,
                {

                    initProgressCallback:
                        (info) => {

                            if (!info) {
                                return;
                            }

                            if (
                                typeof info.progress ===
                                "number"
                            ) {

                                const percent =
                                    Math.round(
                                        info.progress * 100
                                    );

                                progress.textContent =
                                    `${percent}%`;
                            }

                            if (info.text) {

                                progress.textContent =
                                    info.text;
                            }
                        }

                }
            );


        status.textContent =
            "Pulse is ready";

        progress.textContent =
            "AI downloaded successfully.";

        sendButton.disabled = false;

        addMessage(
            "Hey! I'm Pulse. I'm ready to answer your questions.",
            "ai"
        );


    } catch (error) {

        console.error(
            "Pulse AI error:",
            error
        );

        engine = null;

        status.textContent =
            "Download failed";

        progress.textContent =
            "Check your internet connection, available storage, and WebGPU support.";

        downloadButton.disabled =
            false;

    } finally {

        loading = false;
    }
}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    if (!engine) {

        addMessage(
            "Please download the AI brain first.",
            "ai"
        );

        return;
    }

    input.value = "";

    addMessage(
        text,
        "user"
    );

    sendButton.disabled = true;


    const reply =
        addMessage(
            "Thinking...",
            "ai"
        );


    try {

        const response =
            await engine.chat.completions.create({

                messages: [

                    {
                        role: "system",

                        content:
                            `You are Pulse, a friendly,
helpful AI assistant.

Answer questions clearly and accurately.

If you don't know something,
say that you don't know.

Do not pretend to have abilities
you don't have.`
                    },

                    {
                        role: "user",

                        content: text
                    }

                ],

                temperature: 0.7,

                max_tokens: 512
            });


        const answer =
            response
                .choices[0]
                .message
                .content;


        reply.textContent =
            answer;


    } catch (error) {

        console.error(
            "Generation error:",
            error
        );

        reply.textContent =
            "Sorry, I couldn't generate an answer.";

    }


    sendButton.disabled = false;

    input.focus();
}


// =====================================================
// SEND BUTTON
// =====================================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// =====================================================
// DOWNLOAD BUTTON
// =====================================================

downloadButton.addEventListener(
    "click",
    downloadBrain
);


// =====================================================
// ENTER TO SEND
// =====================================================

input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendMessage();
        }

    }
);


// =====================================================
// STARTUP
// =====================================================

sendButton.disabled = true;

status.textContent =
    "AI not downloaded";

progress.textContent =
    "Tap Download AI Brain to begin.";

console.log(
    "Pulse AI loaded."
);
