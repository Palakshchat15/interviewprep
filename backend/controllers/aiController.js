// FIX 1: Use the correct, full package name
const { GoogleGenerativeAI } = require("@google/generative-ai");

const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utils/prompts");

const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    Generate interview questions and answers using Gemini
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // FIX 2: Use a valid, stable model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    // FIX 3: Use the correct two-step method to generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // FIX 4: The response text is a function call -> .text()
    const rawText = response.text();

    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    // FIX 5: Add a server-side log for better debugging
    console.error("Error in generateInterviewQuestions:", error);
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
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

    // Apply the same fixes here
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = conceptExplainPrompt(question);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();
      
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in generateConceptExplanation:", error);
    res.status(500).json({
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };