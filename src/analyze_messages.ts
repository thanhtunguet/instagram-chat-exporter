import "dotenv/config";
import fs from "fs";
import path from "path";
import { Message, Note } from "./types";

function findAndSaveNotes(): void {
  try {
    const steps: number = 10;
    // Create notes directory if it doesn't exist
    const notesDir: string = path.join(__dirname, "notes");
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir);
    }

    // Read and parse the JSON file
    const messages: Message[] = JSON.parse(
      fs.readFileSync("messages.json", "utf8")
    );

    // Find all messages containing "ghi sổ"
    const notes: Note[] = [];
    messages.forEach((message: Message, index: number) => {
      if (message.content && message.content.toLowerCase().includes("ghi sổ")) {
        // Get context (5 messages before and after)
        const startIndex: number = Math.max(0, index - steps);
        const endIndex: number = Math.min(messages.length - 1, index + steps);
        const contextMessages: Message[] = messages.slice(
          startIndex,
          endIndex + 1
        );

        notes.push({
          trigger_message_index: index,
          context_messages: contextMessages,
        });
      }
    });

    // Save each note to a separate file
    notes.forEach((note: Note, index: number) => {
      const fileName: string = `note_${index + 1}.json`;
      const filePath: string = path.join(notesDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(note, null, 2));
      console.log(`Saved note ${index + 1} to ${fileName}`);
    });

    console.log(`\nFound ${notes.length} notes containing "ghi sổ"`);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Run the analysis
findAndSaveNotes();
