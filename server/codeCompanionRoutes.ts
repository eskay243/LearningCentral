import { Express, Request, Response } from "express";
import { isAuthenticated } from "./replitAuth";

interface TipRequest {
  language?: string;
  difficulty?: string;
  topic?: string;
  currentCode?: string;
  error?: string;
  context?: string;
}

export function registerCodeCompanionRoutes(app: Express) {
  // Get a programming tip or assistance based on the request
  app.post("/api/code-companion/tip", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { language, difficulty, topic, currentCode, error, context } = req.body as TipRequest;
      
      // Build prompt based on the request details
      let prompt = "Please provide an encouraging programming tip";
      
      if (language) {
        prompt += ` for ${language}`;
      }
      
      if (topic) {
        prompt += ` about ${topic}`;
      }
      
      if (difficulty) {
        prompt += ` at ${difficulty} level`;
      }
      
      if (error) {
        prompt += `. The user is facing this error: "${error}"`;
      }
      
      if (currentCode) {
        prompt += `. Here's their current code: \`\`\`${currentCode}\`\`\``;
      }
      
      if (context) {
        prompt += `. Additional context: ${context}`;
      }
      
      prompt += ". Be encouraging, concise, and provide actionable advice with a code example if relevant. Format your response with markdown.";
      
      // Call Perplexity API
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system", 
              content: "You are a helpful and encouraging coding assistant named Code Companion. You provide actionable programming tips, explain concepts clearly, and help debug code with kindness and patience. Keep responses friendly, concise, and focused on helping students learn."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error:", errorText);
        return res.status(500).json({ 
          error: "Failed to get programming tip", 
          details: errorText
        });
      }
      
      const data = await response.json();
      
      // Extract the generated tip
      const generatedTip = data.choices[0].message.content;
      
      res.json({
        tip: generatedTip,
        citations: data.citations || [],
        model: data.model
      });
      
    } catch (error) {
      console.error("Error in code companion route:", error);
      res.status(500).json({ error: "Failed to get programming tip" });
    }
  });
  
  // Get a list of suggested topics for programming tips
  app.get("/api/code-companion/suggested-topics", isAuthenticated, (req: Request, res: Response) => {
    // Provide some suggested topics for tips
    const topics = {
      languages: ["JavaScript", "Python", "SQL", "Java", "C#", "PHP", "TypeScript", "HTML/CSS", "Ruby", "Swift"],
      concepts: ["Variables", "Functions", "Loops", "Conditionals", "Data Structures", "Algorithms", "APIs", "Debugging", "Testing", "Performance Optimization"],
      difficulties: ["Beginner", "Intermediate", "Advanced"]
    };
    
    res.json(topics);
  });
}