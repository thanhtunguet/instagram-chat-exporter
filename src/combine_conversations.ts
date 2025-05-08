import "dotenv/config";
import fs from "fs";
import path from "path";

function combineConversations(): void {
  try {
    // Create output directory if it doesn't exist
    const outputDir: string = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Read all conversation files
    const conversationsDir: string = path.join(__dirname, "conversations");
    const conversationFiles: string[] = fs
      .readdirSync(conversationsDir)
      .filter(
        (file) => file.startsWith("conversation_") && file.endsWith(".md")
      )
      .sort((a, b) => {
        // Sort by conversation number
        const numA: number = parseInt(a.match(/\d+/)?.[0] || "0");
        const numB: number = parseInt(b.match(/\d+/)?.[0] || "0");
        return numA - numB;
      });

    console.log(
      `Found ${conversationFiles.length} conversations to combine...`
    );

    // Combine all conversations
    let combinedContent: string = "";
    conversationFiles.forEach((file: string, index: number) => {
      const filePath: string = path.join(conversationsDir, file);
      const content: string = fs.readFileSync(filePath, "utf8");

      // Remove the header (first line) and clean up the content
      const messages: string = content.split("\n").slice(1).join("\n").trim();

      // Add to combined content with template
      combinedContent += `Conversation ${index + 1}:\n${messages}\n\n---\n\n`;
    });

    // Generate filename with current date
    const date: string = new Date().toISOString().split("T")[0];
    const outputPath: string = path.join(
      outputDir,
      `all_conversations_${date}.md`
    );

    // Write the combined content to file
    fs.writeFileSync(outputPath, combinedContent);

    console.log(
      `\nSuccessfully combined ${conversationFiles.length} conversations into:`
    );
    console.log(outputPath);
  } catch (error) {
    console.error("\n❌ Error combining conversations:");
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Run the combination
combineConversations();
