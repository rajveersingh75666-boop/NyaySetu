
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
});

function extractJson(responseText) {
  const cleanedResponse = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleanedResponse);
  } catch {
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Translation AI did not return valid JSON");
    }

    return JSON.parse(jsonMatch[0]);
  }
}

async function generateTranslation(prompt) {
  let result;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await model.generateContent(prompt);
      break;
    } catch (error) {
      console.error(
        `Translation Gemini attempt ${attempt} failed:`,
        error.message
      );

      if (attempt === 3) {
        throw error;
      }

      if (
        error.status === 429 ||
        error.status === 503 ||
        error.status === 500
      ) {
        const delay = attempt * 3000;

        console.log(
          `Retrying translation request in ${delay / 1000} seconds...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      } else {
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error("Translation AI did not return a response");
  }

  return result.response.text().trim();
}

/*
==========================================================
HINDI → ENGLISH
==========================================================
*/

async function translateToEnglish(text, sourceLanguage) {
  if (!text || !text.trim() || sourceLanguage === "en") {
    return text;
  }

  if (sourceLanguage !== "hi") {
    throw new Error(
      `Unsupported source language: ${sourceLanguage}`
    );
  }

  const prompt = `
You are ONLY a translation engine for the NyaySetu application.

Translate the citizen's Hindi complaint into clear, natural English.

CRITICAL RULES:

1. TRANSLATE ONLY.
2. Do NOT analyze the complaint.
3. Do NOT classify the complaint.
4. Do NOT summarize the complaint.
5. Do NOT infer missing information.
6. Do NOT change the subject or topic of the complaint.
7. Do NOT replace one type of complaint with another.
8. Preserve the exact meaning of the original Hindi text.
9. Preserve places, names, dates, numbers, quantities, and facts.
10. If the complaint is about a road, it must remain a road complaint.
11. If the complaint is about water, it must remain a water complaint.
12. If the complaint is about electricity, it must remain an electricity complaint.
13. Do not add details that are not present in the Hindi text.
14. Do not invent any information.

Return ONLY valid JSON.

Required format:

{
  "translation": "exact English translation"
}

Hindi complaint:

${text}
`;

  try {
    const responseText = await generateTranslation(prompt);

    console.log("Hindi → English raw translation response:");
    console.log(responseText);

    const result = extractJson(responseText);

    if (
      !result.translation ||
      typeof result.translation !== "string" ||
      !result.translation.trim()
    ) {
      throw new Error(
        "Hindi to English translation was empty"
      );
    }

    const translation = result.translation.trim();

    console.log("Hindi → English translation:");
    console.log(translation);

    return translation;
  } catch (error) {
    console.error(
      "Hindi to English translation error:",
      error
    );

    throw new Error(
      "Could not translate complaint to English"
    );
  }
}

/*
==========================================================
ENGLISH ANALYSIS → HINDI
==========================================================
*/

async function translateAnalysisToHindi(
  analysis,
  originalComplaint = ""
) {
  if (!analysis) {
    return analysis;
  }

  const prompt = `
You are a professional Hindi translation engine for the NyaySetu government grievance system.

The citizen submitted their complaint in Hindi.

Your ONLY task is to translate the English AI analysis into NATURAL HINDI.

DO NOT analyze the complaint.
DO NOT classify the complaint.
DO NOT change any values.
DO NOT rewrite the meaning.
DO NOT return English sentences.

The following fields MUST be translated into Hindi:

- category
- department
- summary
- reason
- priorityReason

The following fields MUST NOT be translated or changed:

- priority
- status
- priorityScore

IMPORTANT:

The output values for category, department, summary, reason,
and priorityReason MUST actually be written in Hindi script.

For example:

BAD:
"summary": "Citizen reported a damaged road."

GOOD:
"summary": "नागरिक ने क्षतिग्रस्त सड़क की शिकायत की है।"

BAD:
"reason": "Road repairs fall under the Public Works Department."

GOOD:
"reason": "सड़क की मरम्मत का कार्य लोक निर्माण विभाग के अंतर्गत आता है।"

BAD:
"category": "Road Infrastructure"

GOOD:
"category": "सड़क अवसंरचना"

Translate department names naturally into Hindi.

For example:

"Public Works Department"
→
"लोक निर्माण विभाग"

"Municipal Corporation"
→
"नगर निगम"

"Water Supply Department"
→
"जल आपूर्ति विभाग"

Keep names, numbers, IDs and factual information unchanged.

The original citizen complaint in Hindi is:

${originalComplaint}

The English AI analysis is:

${JSON.stringify(
  {
    category: analysis.category,
    department: analysis.department,
    priority: analysis.priority,
    summary: analysis.summary,
    reason: analysis.reason,
    status: analysis.status || "Pending",
    priorityScore: analysis.priorityScore,
    priorityReason: analysis.priorityReason,
  },
  null,
  2
)}

Return ONLY valid JSON.

The result MUST follow exactly this structure:

{
  "category": "Hindi category",
  "department": "Hindi department",
  "priority": "Critical",
  "summary": "Hindi summary",
  "reason": "Hindi reason",
  "status": "Pending",
  "priorityScore": 2,
  "priorityReason": "Hindi priority reason"
}

FINAL REQUIREMENTS:

- category MUST be Hindi.
- department MUST be Hindi.
- summary MUST be Hindi.
- reason MUST be Hindi.
- priorityReason MUST be Hindi.
- priority MUST remain exactly one of:
  Critical, High, Medium, Low
- status MUST remain exactly:
  Pending
- priorityScore MUST remain the same number.
`;

  try {
    const responseText = await generateTranslation(prompt);

    console.log("English → Hindi raw translation response:");
    console.log(responseText);

    const translated = extractJson(responseText);

    console.log("English → Hindi translated result:");
    console.log(translated);

    return {
      ...analysis,

      category:
        translated.category || analysis.category,

      department:
        translated.department || analysis.department,

      priority:
        analysis.priority,

      summary:
        translated.summary || analysis.summary,

      reason:
        translated.reason || analysis.reason,

      status:
        analysis.status || "Pending",

      priorityScore:
        analysis.priorityScore,

      priorityReason:
        translated.priorityReason ||
        analysis.priorityReason,
    };
  } catch (error) {
    console.error(
      "English to Hindi translation error:",
      error
    );

    throw new Error(
      "Could not translate analysis to Hindi"
    );
  }
}

module.exports = {
  translateToEnglish,
  translateAnalysisToHindi,
};