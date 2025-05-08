import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { Note } from "./types";

// Initialize OpenAI client
const openai: OpenAI = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractEventFromNote(note: Note): Promise<string> {
  // Prepare the messages for analysis
  const messagesText: string = note.context_messages
    .map((msg) => `${msg.sender_name}: ${msg.content}`)
    .join("\n");

  // Create the prompt for OpenAI
  const prompt: string = `Phân tích đoạn hội thoại sau và trích xuất thông tin về địa điểm hoặc sự kiện được nhắc đến kèm theo từ "ghi sổ".
Định dạng thông tin theo cấu trúc ghi chú sau:

[Tên Địa Điểm/Sự Kiện]
	•	Loại: [Nhà hàng/Quán cafe/Cửa hàng/Sự kiện/v.v.]
	•	Địa điểm: [Nếu có nhắc đến]
	•	Thời gian: [Nếu có nhắc đến]
	•	Ghi chú: [Bất kỳ chi tiết bổ sung, gợi ý, hoặc điểm quan trọng nào]
	•	Ngữ cảnh: [Tóm tắt ngắn gọn lý do tại sao được ghi sổ]

Hội thoại:
${messagesText}

Vui lòng tập trung vào việc trích xuất thông tin cụ thể về địa điểm hoặc sự kiện, và định dạng thông tin bằng markdown rõ ràng.
Luôn luôn trả lời bằng tiếng Việt.`;

  // Call OpenAI API
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Bạn là một trợ lý hữu ích chuyên trích xuất và định dạng thông tin về địa điểm và sự kiện từ các đoạn hội thoại. Chỉ trả lời bằng định dạng markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error("No response from OpenAI API");
  }

  return response;
}

async function processNotes(): Promise<void> {
  try {
    // Create extracted directory if it doesn't exist
    const extractedDir: string = path.join(__dirname, "extracted");
    if (!fs.existsSync(extractedDir)) {
      fs.mkdirSync(extractedDir);
    }

    // Read all note files
    const notesDir: string = path.join(__dirname, "notes");
    const noteFiles: string[] = fs
      .readdirSync(notesDir)
      .filter((file) => file.startsWith("note_") && file.endsWith(".json"));

    console.log(`Found ${noteFiles.length} notes to process...`);

    // Process each note
    for (let i = 0; i < noteFiles.length; i++) {
      const notePath: string = path.join(notesDir, noteFiles[i]);
      const note: Note = JSON.parse(fs.readFileSync(notePath, "utf8"));

      console.log(`Processing note ${i + 1} of ${noteFiles.length}...`);

      // Extract event information using AI
      const eventMarkdown: string = await extractEventFromNote(note);

      // Save to markdown file
      const outputPath: string = path.join(extractedDir, `event_${i + 1}.md`);
      fs.writeFileSync(outputPath, eventMarkdown);

      console.log(`Saved event to event_${i + 1}.md`);
    }

    console.log(
      "\nAll events have been extracted and saved to the extracted/ directory"
    );
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Run the extraction
processNotes();
