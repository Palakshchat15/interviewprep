const { GoogleGenerativeAI } = require("@google/genai");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utils/prompts");

// Initialize the GenAI client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Generate interview questions and answers using Gemini
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Get the specific generative model
    // Note: I'm using "gemini-1.5-flash", a standard and efficient model.
    // You can change this to another model if you prefer.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    // 2. Call generateContent with the prompt
    const result = await model.generateContent(prompt);
    const response = result.response;

    // 3. Get the text response using the .text() function
    const rawText = response.text();

    // Clean the text to ensure it's valid JSON
    const cleanedText = rawText
      .replace(/^```json\s*/, "") // remove starting ```json
      .replace(/```$/, "") // remove ending ```
      .trim(); // remove extra spaces

    // Now it's safe to parse
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error("AI Generation Error:", error); // Log the actual error for debugging
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};

// @desc    Generate an explanation for an interview question
// @route   POST /api/ai/generate-explanation
// @access  Private
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // 1. Get the specific generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = conceptExplainPrompt(question);

    // 2. Call generateContent with the prompt
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // 3. Get the text response using the .text() function
    const rawText = response.text();

    // Clean the text to ensure it's valid JSON
    const cleanedText = rawText
      .replace(/^```json\s*/, "") // remove starting ```json
      .replace(/```$/, "") // remove ending ```
      .trim(); // remove extra spaces

    // Now it's safe to parse
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error("AI Explanation Error:", error); // Log the actual error for debugging
    res.status(500).json({
      message: "Failed to generate explanation", // More specific message
      error: error.message,
    });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };
