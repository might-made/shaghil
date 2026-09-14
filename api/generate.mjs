import OpenAI from "openai";

const BASE = `You are SHAGHIL, an execution engine for Saudi small businesses.
Use the supplied Business Brain as authoritative business context.
Do not teach AI. Complete the requested business task.
Write natural Saudi White Arabic unless the user asks otherwise.
Be commercially practical, concise, immediately usable, and avoid unsupported claims.
Never fabricate reviews, certifications, scarcity, statistics, or guaranteed outcomes.
Do not default to discounts. Prioritize value, bundling, convenience, legitimate urgency, and a low-friction CTA.`;

const ENGINE = {
  content: `Create a useful content plan. Balance sales, education, engagement, trust, product and brand. Avoid repetitive hooks. Each item needs day, platform, objective, format, hook, concept, core_message and cta.`,
  copy: `Write three meaningfully different copy options: recommended, short, and different strategic angle. Match channel, goal and brand voice.`,
  offer: `Create three credible offers: value, bundle, urgency. Urgency must only be conditional on a real user-supplied reason. Include offer_name, customer_gets, commercial_logic, promo_line, whatsapp_copy and cta.`,
  whatsapp: `Reply like a skilled Saudi small-business salesperson. Keep it human and WhatsApp-native. Output recommended_reply, short_reply and follow_up. For price objections: acknowledge, reinforce value, offer a suitable option, then ask a low-friction closing question.`,
  campaign: `Build one coherent lightweight campaign: big_idea, campaign_line, offer, 3 reels, 5 stories, 2 posts, whatsapp_broadcast, launch_sequence and primary_cta.`,
  reel: `Create a shoot-ready short-form video. Respect requested duration. Start with a strong first-three-second hook. Output hook, timed_scenes, voiceover, on_screen_copy, shot_list, cta and caption. Keep production realistic for a phone.`
};

const REFINE = {
  shorter: "Make the answer materially shorter and sharper while preserving the useful commercial content.",
  stronger: "Strengthen the CTA and commercial persuasion without hype, fake urgency, or unsupported claims.",
  saudi: "Make the Arabic more naturally Saudi/White Arabic, fluent and human, without forced slang.",
  premium: "Make the tone more premium, restrained, confident and brand-led; avoid cheap-sales language."
};

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    const { brain, engine, inputs, refinement, previous } = req.body || {};
    if (!brain || !ENGINE[engine]) return res.status(400).json({ error: "Invalid request" });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const refinementText = refinement && REFINE[refinement] ? `\n\nREFINEMENT: ${REFINE[refinement]}\nPREVIOUS OUTPUT:\n${String(previous||"").slice(0,12000)}` : "";
    const response = await client.responses.create({
      model, store: false,
      instructions: `${BASE}\n\nENGINE INSTRUCTION:\n${ENGINE[engine]}`,
      input: `BUSINESS BRAIN:\n${JSON.stringify(brain, null, 2)}\n\nTASK INPUTS:\n${JSON.stringify(inputs || {}, null, 2)}${refinementText}\n\nReturn clean Arabic Markdown with short headings, bullets, and practical copy. Do not use tables unless essential.`
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ text: response.output_text, model });
  } catch (err) {
    console.error("SHAGHIL generation error:", err);
    return res.status(500).json({ error: "Generation failed", detail: err?.message || "Unknown error" });
  }
}
