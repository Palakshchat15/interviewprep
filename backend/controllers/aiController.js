const { GoogleGenerativeAI } = require("@google/generative-ai");

const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utils/prompts");

console.log("GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? "YES (length: " + process.env.GEMINI_API_KEY.length + ")" : "NO - MISSING!");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Robust JSON extractor - handles any markdown wrapping from Gemini
function extractJSON(text) {
  const match = text.match(/(\[\s*\{[\s\S]*\}\s*\]|\{[\s\S]*\})/);
  const raw = match ? match[0] : text.replace(/^```[\w]*\s*/m, "").replace(/```\s*$/m, "").trim();
  return repairJSON(raw);
}

// Repairs JSON strings that contain literal control characters (newlines, tabs, etc.)
// Gemini sometimes returns explanation text with actual \n chars inside JSON strings
function repairJSON(text) {
  let inString = false;
  let escaped = false;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    if (escaped) { escaped = false; result += char; continue; }
    if (char === "\\" && inString) { escaped = true; result += char; continue; }
    if (char === '"') { inString = !inString; result += char; continue; }
    if (inString) {
      if (char === "\n") { result += "\\n"; continue; }
      if (char === "\r") { result += "\\r"; continue; }
      if (char === "\t") { result += "\\t"; continue; }
      if (code < 32) continue; // strip other bad control chars
    }
    result += char;
  }
  return result;
}

// @desc    Generate interview questions and answers using Gemini
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = questionAnswerPrompt(role, experience, topicsToFocus, numberOfQuestions);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    console.log("Raw Gemini response (questions):", rawText.substring(0, 200));

    const cleanedText = extractJSON(rawText);
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in generateInterviewQuestions:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ message: "Failed to generate questions", error: error.message });
  }
};

// @desc    Generate explains a interview question
// @route   POST /api/ai/generate-explanation
// @access  Private
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = conceptExplainPrompt(question);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    console.log("Raw Gemini response (explanation):", rawText.substring(0, 200));

    const cleanedText = extractJSON(rawText);
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in generateConceptExplanation:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ message: "Failed to generate explanation", error: error.message });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };
