import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";

// Pulse deliberately uses a small vision-language model.
// No API key is required. The browser downloads and caches the model.
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL = "HuggingFaceTB/SmolVLM-256M-Instruct";
let generator = null;
let selectedImage = null;
let autoTimer = null;

const $ = id => document.getElementById(id);
const add = (who, text) => {
  const d = document.createElement("div");
  d.className = `bubble ${who}`;
  d.textContent = text;
  $("chat").appendChild(d);
  $("chat").scrollTop = $("chat").scrollHeight;
};

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  speechSynthesis.speak(u);
}

async function loadBrain() {
  $("download").disabled = true;
  $("status").textContent = "Downloading the AI brain… keep this page open.";
  try {
    // First pipeline creation downloads the model into the browser cache.
    generator = await pipeline("image-text-to-text", MODEL, {
      dtype: "q4",
      progress_callback: p => {
        if (typeof p.progress === "number") {
          $("bar").style.width = Math.max(0, Math.min(100, p.progress)) + "%";
          if (p.file) $("status").textContent = `Downloading ${p.file}…`;
        }
      }
    });
    $("bar").style.width = "100%";
    $("status").textContent = "Pulse's brain is ready and cached on this device.";
    localStorage.setItem("pulseBrainReady","1");
    setTimeout(() => {
      $("downloadScreen").classList.add("hidden");
      $("app").classList.remove("hidden");
      add("ai","Hey! I'm Pulse. You can type, speak, or send me a picture.");
      $("message").focus();
    },500);
  } catch (e) {
    console.error(e);
    $("download").disabled = false;
    $("status").textContent = "The download failed. Check your internet connection and try again.";
  }
}

$("download").onclick = loadBrain;

$("image").onchange = e => {
  const file = e.target.files?.[0];
  if (!file) return;
  selectedImage = file;
  $("photo").src = URL.createObjectURL(file);
  $("photoBox").classList.remove("hidden");
};
$("removePhoto").onclick = () => {
  selectedImage = null;
  $("image").value = "";
  $("photoBox").classList.add("hidden");
};

async function ask(text) {
  if (!generator) return;
  const prompt = text || "Describe this image briefly.";
  add("user", selectedImage ? `📷 ${prompt}` : prompt);
  $("ready").textContent = "Thinking…";
  try {
    let image = null;
    if (selectedImage) image = await createImageBitmap(selectedImage);
    const messages = [{
      role:"user",
      content: image
        ? [{type:"image", image}, {type:"text", text:prompt}]
        : [{type:"text", text:prompt}]
    }];
    const out = await generator(messages, {max_new_tokens:180});
    let answer = out?.[0]?.generated_text;
    if (Array.isArray(answer)) answer = answer.at(-1)?.content || "";
    if (typeof answer !== "string") answer = String(answer || "I couldn't generate a reply.");
    add("ai", answer);
    speak(answer);
  } catch(e) {
    console.error(e);
    add("ai","I couldn't process that. Try a shorter message or a smaller picture.");
  } finally {
    $("ready").textContent = "AI ready";
  }
}

$("composer").onsubmit = async e => {
  e.preventDefault();
  const text = $("message").value.trim();
  $("message").value = "";
  if (!text && !selectedImage) return;
  await ask(text);
};

let recognition;
$("mic").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { add("ai","Speech recognition isn't available in this browser."); return; }
  if (recognition) { recognition.stop(); recognition=null; return; }
  recognition = new SR();
  recognition.lang = "en-GB";
  recognition.interimResults = false;
  recognition.onresult = e => { $("message").value = e.results[0][0].transcript; $("composer").requestSubmit(); };
  recognition.onend = () => recognition=null;
  recognition.start();
  $("ready").textContent = "Listening…";
};

$("auto").onclick = () => {
  if (autoTimer) {
    clearInterval(autoTimer); autoTimer=null;
    $("auto").textContent="Auto-talk: OFF";
    return;
  }
  $("auto").textContent="Auto-talk: ON";
  add("ai","Auto-talk is on. I'll occasionally start a conversation by myself.");
  autoTimer = setInterval(async () => {
    const prompts = [
      "Start a short, friendly conversation with the user.",
      "Say one interesting thing you noticed or a random thought.",
      "Ask the user a fun question."
    ];
    await ask(prompts[Math.floor(Math.random()*prompts.length)]);
  }, 45000);
};

$("clear").onclick = () => $("chat").innerHTML = "";

if (localStorage.getItem("pulseBrainReady") === "1") {
  // Cache may have been cleared, so still initialize and verify it.
  $("status").textContent = "Checking for your saved AI brain…";
  loadBrain();
}
