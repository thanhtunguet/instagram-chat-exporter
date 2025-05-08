import "dotenv/config";
import fs from "fs";
import path from "path";
import { Message, Note } from "./types";

function cleanMessageContent(content: string | undefined): string {
  if (!content) return "";

  // Remove reaction messages
  content = content.replace(/Đã thích .+\./g, "");
  content = content.replace(/Đã bày tỏ cảm xúc .+\./g, "");

  // Clean up extra whitespace
  content = content.trim();

  return content;
}

function convertNoteToMarkdown(note: Note): string {
  const messages: Message[] = note.context_messages;
  let markdown: string = "";

  // Add a header with the trigger message index
  markdown += `# Conversation Context (Trigger Message: ${note.trigger_message_index})\n\n`;

  // Convert each message to markdown
  messages.forEach((msg) => {
    const cleanContent: string = cleanMessageContent(msg.content);
    if (cleanContent) {
      // Only add non-empty messages
      markdown += `**${msg.sender_name}**: ${cleanContent}\n\n`;
    }
  });

  return markdown;
}

function convertAllNotes(): void {
  try {
    // Create conversations directory if it doesn't exist
    const conversationsDir: string = path.join(__dirname, "conversations");
    if (!fs.existsSync(conversationsDir)) {
      fs.mkdirSync(conversationsDir);
    }

    // Read all note files
    const notesDir: string = path.join(__dirname, "notes");
    const noteFiles: string[] = fs
      .readdirSync(notesDir)
      .filter((file) => file.startsWith("note_") && file.endsWith(".json"));

    console.log(`Found ${noteFiles.length} notes to convert...`);

    // Convert each note
    noteFiles.forEach((file: string, index: number) => {
      const notePath: string = path.join(notesDir, file);
      const note: Note = JSON.parse(fs.readFileSync(notePath, "utf8"));

      // Convert to markdown
      const markdown: string = convertNoteToMarkdown(note);

      // Save to markdown file
      const outputPath: string = path.join(
        conversationsDir,
        `conversation_${index + 1}.md`
      );
      fs.writeFileSync(outputPath, markdown);

      console.log(
        `Converted note ${index + 1} to conversation_${index + 1}.md`
      );
    });

    console.log("\nAll notes have been converted to markdown conversations!");
  } catch (error) {
    console.error("\n❌ Error converting notes:");
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Run the conversion
convertAllNotes();
