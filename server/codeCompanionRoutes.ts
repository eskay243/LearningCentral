import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";

interface TipRequest {
  language?: string;
  difficulty?: string;
  topic?: string;
  currentCode?: string;
  error?: string;
  context?: string;
}

export function registerCodeCompanionRoutes(app: Express) {
  // API endpoint that provides programming tips
  app.post("/api/code-companion/tip", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const request: TipRequest = req.body;
      
      // Construct the prompt based on request data
      let prompt = "Provide a helpful programming tip";
      
      if (request.language) {
        prompt += ` for ${request.language} programming`;
      }
      
      if (request.difficulty) {
        prompt += ` at ${request.difficulty} difficulty level`;
      }
      
      if (request.topic) {
        prompt += ` about ${request.topic}`;
      }
      
      if (request.currentCode) {
        prompt += `. Here's the code I'm working with: \`\`\`${request.language || ''}\n${request.currentCode}\n\`\`\``;
      }
      
      if (request.error) {
        prompt += `. I'm getting this error: "${request.error}"`;
      }
      
      if (request.context) {
        prompt += `. Additional context: ${request.context}`;
      }
      
      prompt += ". Be encouraging, concise, and provide actionable advice with a code example if relevant. Format your response with markdown.";
      
      // Check for API key
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({ 
          error: "Missing Perplexity API key",
          details: "PERPLEXITY_API_KEY environment variable is required" 
        });
      }
      
      try {
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
        
        // Add a fallback message if the content is missing
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          return res.json({
            tip: "I'm having trouble generating a response right now. Please try a different question.",
            model: "llama-3.1-sonar-small-128k-online"
          });
        }
      
        // Extract the generated tip
        const generatedTip = data.choices[0].message.content;
        
        // Return the successful response
        return res.json({
          tip: generatedTip,
          citations: data.citations || [],
          model: data.model || "llama-3.1-sonar-small-128k-online"
        });
      } catch (error: any) {
        console.error("Error calling Perplexity API:", error);
        return res.status(500).json({
          error: "An error occurred with the AI service",
          details: error.message || "Unknown error"
        });
      }
    } catch (error: any) {
      console.error("Error in code companion route:", error);
      res.status(500).json({ 
        error: "Failed to process your request",
        details: error.message || "Unknown error"
      });
    }
  });

  // API endpoint that provides suggested programming topics
  app.get("/api/code-companion/suggested-topics", isAuthenticated, (req: Request, res: Response) => {
    // Return a set of common programming topics
    res.json({
      languages: [
        "JavaScript", "TypeScript", "Python", "Java", "C#", 
        "PHP", "Go", "Rust", "Swift", "Kotlin", "Ruby"
      ],
      topics: [
        "Arrays and Lists", "Functions", "Objects and Classes", 
        "Error Handling", "Asynchronous Programming", "Data Structures",
        "Algorithms", "Design Patterns", "Unit Testing", "Debugging",
        "Performance Optimization", "Security Best Practices"
      ],
      difficulties: ["Beginner", "Intermediate", "Advanced"]
    });
  });
}