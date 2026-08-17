import { prisma } from "@/lib/db";
import { aiRouter } from "@/lib/ai/router";
import { apiHandler } from "@/lib/api-handler";
import { getAIOrganizationId } from "@/lib/ai/request-context";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user;
  const body = (ctx as any).body as {
    topicTitle: string;
    lessonTitle: string;
    courseTitle?: string;
    theme?: "detective" | "cricket" | "restaurant" | "bollywood" | "space" | "startup";
    language?: "hi" | "en";
  };

  const { topicTitle, lessonTitle, courseTitle = "Web Engineering", theme = "cricket", language = "hi" } = body;

  const prompt = `You are a master storytelling teacher who teaches coding through funny, dramatic, highly memorable stories with characters.
Topic: ${lessonTitle} - ${topicTitle} (${courseTitle})
Theme: ${theme}
Language: ${language === "hi" ? "Hinglish (Conversational Hindi + English coding keywords)" : "English"}

Generate an interactive 3-scene story episode explaining this concept with characters, drama, dialogues, an interactive user choice, and a golden moral.

Return JSON in this EXACT format without markdown ticks:
{
  "title": "Story Episode Title",
  "theme": "${theme}",
  "setting": "Short 1-line description of the funny drama/situation",
  "characters": [
    { "name": "Character 1", "role": "Role (e.g. Developer, Customer, Server, Browser)", "emoji": "👨‍💻" },
    { "name": "Character 2", "role": "Role (e.g. React Engine, Database, Middleware)", "emoji": "🧠" }
  ],
  "dialogues": [
    { "speaker": "Character 1", "emoji": "👨‍💻", "text": "Dialogue line expressing the problem or confusion" },
    { "speaker": "Character 2", "emoji": "🧠", "text": "Dialogue line explaining the coding concept simply" },
    { "speaker": "Character 1", "emoji": "👨‍💻", "text": "Dialogue line having the 'Aha!' breakthrough moment" }
  ],
  "choiceMoment": {
    "question": "What should the character write in the code right now?",
    "options": [
      { "text": "Wrong Option (e.g. Direct mutation or missing middleware)", "outcome": "❌ Story Twist: Screen froze or server crashed! Here is why...", "isCorrect": false },
      { "text": "Correct Option (e.g. useState setter or next() call)", "outcome": "✅ Victory! Everything worked smoothly and the client celebrated! 🎉", "isCorrect": true }
    ]
  },
  "moral": "The 1-line golden engineering rule to remember forever",
  "tinyCode": "// 3-line clean snippet showing the concept in action"
}`;

  try {
    const organizationId = user?.id ? await getAIOrganizationId(user.id) : undefined;
    const aiRes = await aiRouter.executeWithFallback(
      [
        { role: "system", content: "You output strictly valid JSON without markdown wrapping." },
        { role: "user", content: prompt },
      ],
      {
        complexity: "low",
        userId: user?.id,
        organizationId,
        requestId: ctx.requestId,
      }
    );

    let raw = (aiRes.content || "").trim();
    if (raw.startsWith("```json")) {
      raw = raw.replace(/```json\n?/, "").replace(/```$/, "").trim();
    } else if (raw.startsWith("```")) {
      raw = raw.replace(/```\n?/, "").replace(/```$/, "").trim();
    }

    const storyData = JSON.parse(raw);
    return { success: true, story: storyData };
  } catch (error: any) {
    // Resilient Fallback Story
    const fallbackStory = {
      title: language === "hi" ? `द एडवेंचर ऑफ़ ${lessonTitle}` : `The Adventure of ${lessonTitle}`,
      theme,
      setting:
        language === "hi"
          ? "एक हलचल भरी टेक कंपनी जहाँ सब कुछ दांव पर है!"
          : "A bustling tech team where everything is on the line!",
      characters: [
        { name: "रोहन (Junior Dev)", role: "Confused Coder", emoji: "👨‍💻" },
        { name: "प्रिया (Senior Architect)", role: "Wise Mentor", emoji: "👩‍🏫" },
      ],
      dialogues: [
        {
          speaker: "रोहन (Junior Dev)",
          emoji: "👨‍💻",
          text:
            language === "hi"
              ? "मैम, मैंने कोड लिख दिया लेकिन स्क्रीन पर डेटा अपडेट ही नहीं हो रहा!"
              : "Ma'am, I wrote the code but the screen isn't updating at all!",
        },
        {
          speaker: "प्रिया (Senior Architect)",
          emoji: "👩‍🏫",
          text:
            language === "hi"
              ? `क्योंकि तुमने ${lessonTitle} का सही नियम नहीं लगाया! बिना सही मेथड के सिस्टम को पता ही नहीं चलता कि डेटा बदल चुका है!`
              : `Because you didn't follow the rule of ${lessonTitle}! Without the proper method, the system doesn't know data changed!`,
        },
        {
          speaker: "रोहन (Junior Dev)",
          emoji: "👨‍💻",
          text:
            language === "hi"
              ? "अरे वाह! जैसे ही मैंने सही फॉर्मूला लगाया, सब कुछ एकदम मक्खन की तरह चलने लगा!"
              : "Aha! As soon as I used the proper formula, everything worked like magic!",
        },
      ],
      choiceMoment: {
        question:
          language === "hi"
            ? `${lessonTitle} में सबसे सही तरीका क्या है?`
            : `What is the correct way in ${lessonTitle}?`,
        options: [
          {
            text: language === "hi" ? "बिना सोचे समझे डायरेक्ट मॉडिफाई करना" : "Directly mutate without state setters",
            outcome:
              language === "hi"
                ? "❌ ट्विस्ट: स्क्रीन हैंग हो गई और क्लाइंट नाराज़ हो गया!"
                : "❌ Twist: Screen froze and the client was upset!",
            isCorrect: false,
          },
          {
            text: language === "hi" ? "प्रॉपर फंक्शन और सेटर कॉल करना" : "Use proper setters and pure functions",
            outcome:
              language === "hi"
                ? "✅ जीत! स्क्रीन तुरंत अपडेट हुई और सबने तालियाँ बजाईं! 🎉"
                : "✅ Victory! Screen updated instantly and everyone cheered! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral:
        language === "hi"
          ? "💡 नियम: हमेशा प्रेडिक्टेबल मेथड्स और प्योर फंक्शन्स का इस्तेमाल करो, डायरेक्ट शॉर्टकट से सिर्फ बग्स आते हैं!"
          : "💡 Rule: Always use predictable setters and pure methods for deterministic state!",
      tinyCode: `// ${lessonTitle} Core Pattern\nconst result = executeSafely();\nconsole.log("Success:", result);`,
    };

    return { success: true, story: fallbackStory };
  }
});
