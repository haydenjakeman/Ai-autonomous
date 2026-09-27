import {
    CreateMLCEngine
} from "https://esm.run/@mlc-ai/web-llm";


// =====================================================
// PULSE
// =====================================================

const MODEL = "Qwen3-0.6B-q4f16_1-MLC";

let engine = null;
let loading = false;
let talkingByItself = false;
let autonomousTimer = null;
let generating = false;


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
    document.getElementById("downloadBrainButton");

const talkButton =
    document.getElementById("talkButton");

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
// DOWNLOAD AI
// =====================================================

async function downloadBrain() {

    if (loading || engine) {
        return;
    }

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

                            if (!info) return;

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
            "AI ready.";

        sendButton.disabled = false;

        talkButton.disabled = false;

        addMessage(
            "Hey! I'm Pulse. I'm ready.",
            "ai"
        );

    } catch (error) {

        console.error(error);

        engine = null;

        status.textContent =
            "Download failed";

        progress.textContent =
            "Check your internet, storage and WebGPU support.";

        downloadButton.disabled =
            false;

    } finally {

        loading = false;
    }
}


// =====================================================
// FAST STREAMING RESPONSE
// =====================================================

async function generateResponse(
    userText,
    autonomous = false
) {

    if (!engine || generating) {
        return;
    }

    generating = true;

    const replyBox =
        addMessage(
            autonomous
                ? ""
                : "Thinking...",
            "ai"
        );

    try {

        const messages = autonomous

            ? [
                {
                    role: "system",
                    content:
                        `You are Pulse, a friendly AI.

You are allowed to start conversations
by yourself when the user has enabled
"Talk by itself".

Say something short and natural.
Do not claim to have feelings or real
experiences that you don't have.

Keep it interesting and conversational.`
                },

                {
                    role: "user",
                    content:
                        "Start a short conversation with me."
                }
            ]

            : [
                {
                    role: "system",
                    content:
                        `You are Pulse, a helpful,
friendly AI assistant.

Give clear and useful answers.

Keep answers reasonably concise
unless the user asks for detail.`
                },

                {
                    role: "user",
                    content: userText
                }
            ];


        // STREAM THE ANSWER
        // This makes Pulse display tokens
        // as they are generated.

        const stream =
            await engine.chat.completions.create({

                messages,

                temperature: 0.7,

                max_tokens: autonomous
                    ? 80
                    : 384,

                stream: true
            });


        let answer = "";

        replyBox.textContent = "";

        for await (
            const chunk of stream
        ) {

            const piece =
                chunk.choices?.[0]?.delta?.content
                || "";

            if (!piece) continue;

            answer += piece;

            replyBox.textContent =
                answer;

            chat.scrollTop =
                chat.scrollHeight;
        }


    } catch (error) {

        console.error(error);

        replyBox.textContent =
            "Sorry, something went wrong.";

    } finally {

        generating = false;
    }
}


// =====================================================
// NORMAL MESSAGE
// =====================================================

async function sendMessage() {

    const text =
        input.value.trim();

    if (!text || !engine || generating) {
        return;
    }

    input.value = "";

    addMessage(
        text,
        "user"
    );

    sendButton.disabled = true;

    await generateResponse(
        text,
        false
    );

    sendButton.disabled = false;

    input.focus();
}


// =====================================================
// TALK BY ITSELF
// =====================================================

function startAutonomousTalking() {

    if (!engine) {
        return;
    }

    talkingByItself = true;

    talkButton.textContent =
        "🗣️ Talk by itself: ON";

    talkButton.classList.add(
        "active"
    );

    // First automatic message
    // after a short delay.

    autonomousTimer =
        setTimeout(
            autonomousMessage,
            3000
        );
}


function stopAutonomousTalking() {

    talkingByItself = false;

    talkButton.textContent =
        "🗣️ Talk by itself: OFF";

    talkButton.classList.remove(
        "active"
    );

    if (autonomousTimer) {

        clearTimeout(
            autonomousTimer
        );

        autonomousTimer = null;
    }
}


function autonomousMessage() {

    if (
        !talkingByItself ||
        !engine
    ) {
        return;
    }

    if (generating) {

        autonomousTimer =
            setTimeout(
                autonomousMessage,
                5000
            );

        return;
    }

    generateResponse(
        "",
        true
    ).finally(() => {

        if (!talkingByItself) {
            return;
        }

        // Wait 20–40 seconds before
        // Pulse speaks again.

        const delay =
            20000 +
            Math.random() * 20000;

        autonomousTimer =
            setTimeout(
                autonomousMessage,
                delay
            );
    });
}


// =====================================================
// TALK BUTTON
// =====================================================

talkButton.addEventListener(
    "click",
    () => {

        if (!engine) {
            return;
        }

        if (talkingByItself) {
            stopAutonomousTalking();
        } else {
            startAutonomousTalking();
        }
    }
);


// =====================================================
// BUTTONS
// =====================================================

downloadButton.addEventListener(
    "click",
    downloadBrain
);

sendButton.addEventListener(
    "click",
    sendMessage
);


// =====================================================
// ENTER
// =====================================================

input.addEventListener(
    "keydown",
    event => {

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

talkButton.disabled = true;

status.textContent =
    "AI not downloaded";

progress.textContent =
    "Tap Download AI Brain to begin.";
