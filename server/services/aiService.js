const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Service to handle AI interactions using Google Gemini.
 */
class AIService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey || "");
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Summarize meeting content and extract discussion points and decisions.
   */
  async summarize(contentHtml) {
    const prompt = `
      Analyze the following meeting minutes (in HTML format) and provide a concise summary, key discussion points, and major decisions.
      
      Content:
      ${contentHtml}

      Respond ONLY with a JSON object in the following format:
      {
        "summary": "Short summary string",
        "discussion": "Bullet points of discussion",
        "decisions": "Bullet points of decisions"
      }
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Clean up potential markdown code blocks in the response
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to parse AI response:", text);
      throw new Error("AI response was not in the expected JSON format.");
    }
  }

  /**
   * Extract action items from meeting content.
   */
  async extractActionItems(contentHtml) {
    const prompt = `
      Analyze the following meeting minutes (in HTML format) and extract all action items/tasks.
      For each item, identify the task, the person it's assigned to, and the deadline if mentioned.
      
      Content:
      ${contentHtml}

      Respond ONLY with a JSON array of objects in the following format:
      [
        {
          "task": "Task description",
          "assignedTo": "Name or Email",
          "deadline": "YYYY-MM-DD or empty string if not mentioned"
        }
      ]
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to parse AI response for action items:", text);
      throw new Error("AI response was not in the expected JSON format.");
    }
  }

  /**
   * Polish the grammar and tone of the meeting minutes.
   */
  async polish(contentHtml) {
    const prompt = `
      You are a professional editor. Polish the following meeting minutes for better grammar, clarity, and professional tone.
      Maintain the original HTML structure and tags. Do not change the core meaning, just improve the writing.
      
      Content:
      ${contentHtml}

      Return ONLY the polished HTML content. Do not include any explanations or markdown blocks.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Sometimes Gemini wraps HTML in markdown blocks even when told not to
    return text.replace(/```html/g, "").replace(/```/g, "").trim();
  }
}

module.exports = new AIService();
