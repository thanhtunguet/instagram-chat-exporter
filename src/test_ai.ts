import "dotenv/config";
import OpenAI from "openai";

// Initialize OpenAI client
const openai: OpenAI = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

async function testAIConnection(): Promise<void> {
  try {
    console.log("Testing AI connection...");
    console.log("Using model:", process.env.OPENAI_MODEL);
    console.log("Base URL:", process.env.OPENAI_BASE_URL);

    // Make a simple test call
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý ảo tiếng Việt hữu ích.",
        },
        {
          role: "user",
          content: "Bạn có thể làm gì?",
        },
      ],
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI API");
    }

    console.log("\nResponse from AI:");
    console.log(response);
    console.log("\nConnection test completed successfully! ✅");
  } catch (error) {
    console.error("\n❌ Error testing AI connection:");
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );

    if (error instanceof Error && "response" in error) {
      const errorResponse = error.response as {
        status?: number;
        data?: unknown;
      };
      console.error("Response status:", errorResponse.status);
      console.error("Response data:", errorResponse.data);
    }

    console.error("\nPlease check your:");
    console.error("1. OPENAI_API_KEY in .env file");
    console.error("2. OPENAI_BASE_URL in .env file");
    console.error("3. OPENAI_MODEL in .env file");
    console.error("4. Internet connection");
  }
}

// Run the test
testAIConnection();
