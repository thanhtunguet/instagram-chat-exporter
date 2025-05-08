#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { program } from "commander";
import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
import { Message } from "./types";

const MESSAGES_DIR: string = "./.";

// Regex để phát hiện lỗi encoding dạng Latin-1
const INVALID_UTF8_REGEX: RegExp = /[\xC2-\xF4][\x80-\xBF]+/g;

// Hàm sửa lỗi encoding
function fixEncoding(text: string): string {
  return text.replace(INVALID_UTF8_REGEX, (match) => {
    try {
      return Buffer.from(match, "latin1").toString("utf8");
    } catch (error) {
      return match;
    }
  });
}

// Định dạng thời gian
function formatTimestamp(timestamp: number): string {
  const date: Date = new Date(timestamp * 1000);
  return date.toLocaleString("vi-VN"); // Format ngày tháng Tiếng Việt
}

function reverseJsonEncoding(json: any): any {
  if (typeof json === "string") {
    return fixEncoding(json);
  }

  if (Array.isArray(json)) {
    return json.map(reverseJsonEncoding);
  }

  if (typeof json === "object" && json !== null) {
    const reversed: Record<string, any> = {};
    for (const key in json) {
      const value = json[key];
      reversed[key] = reverseJsonEncoding(value);
    }
    return reversed;
  }
  return json;
}

// Đọc tất cả các file JSON trong thư mục
function readJSONFiles(directory: string): Message[] {
  const files: string[] = fs
    .readdirSync(directory)
    .filter((file) => file.startsWith("message_") && file.endsWith(".json"))
    .sort(); // Đảm bảo đúng thứ tự cuộc hội thoại
  let allMessages: Message[] = [];

  files.forEach((file) => {
    const filePath: string = path.join(directory, file);
    const rawData: string = fs.readFileSync(filePath, "utf-8");
    const jsonData: { messages: Message[] } = JSON.parse(rawData);

    if (jsonData.messages) {
      allMessages = allMessages.concat(jsonData.messages);
    }
  });

  // Sắp xếp tin nhắn theo thời gian
  allMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return allMessages.map((message) => {
    return reverseJsonEncoding(message);
  });
}

// Xuất ra Markdown
function exportToMarkdown(messages: Message[], outputFile: string): void {
  let mdContent: string = "# Instagram Chat Export\n\n";

  messages.forEach((msg) => {
    const sender: string = fixEncoding(msg.sender_name);
    const time: string = formatTimestamp(msg.timestamp_ms / 1000);
    const content: string = msg.content
      ? fixEncoding(msg.content.replace(/\n/g, "  \n"))
      : "";

    mdContent += `**${sender}** (*${time}*):\n> ${content}\n\n`;
  });

  fs.writeFileSync(outputFile, mdContent, "utf-8");
  console.log(`✅ Markdown file saved: ${outputFile}`);
}

// Xuất ra Word
async function exportToWord(
  messages: Message[],
  outputFile: string
): Promise<void> {
  const paragraphs: Paragraph[] = [];

  messages.forEach((msg) => {
    const sender: string = fixEncoding(msg.sender_name);
    const time: string = formatTimestamp(msg.timestamp_ms / 1000);
    const content: string = msg.content ? fixEncoding(msg.content) : "";

    paragraphs.push(
      ...[
        new Paragraph({
          children: [
            new TextRun({ text: `${sender} `, bold: true }),
            new TextRun({ text: `(${time})`, italics: true }),
          ],
        }),
        new Paragraph({
          text: content,
          pageBreakBefore: false,
        }),
        new Paragraph({ text: "" }),
      ]
    );
  });

  const doc: Document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Instagram Chat Export",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
        ],
      },
      {
        children: paragraphs,
      },
    ],
  });

  const buffer: Buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputFile, buffer);
  console.log(`✅ Word file saved: ${outputFile}`);
}

// Xuất ra PDF
function exportToPDF(messages: Message[], outputFile: string): void {
  const doc: PDFKit.PDFDocument = new PDFDocument({
    size: "A4",
    margin: 50,
    bufferPages: true,
  });
  doc.pipe(fs.createWriteStream(outputFile));

  doc
    .fontSize(20)
    .text("Instagram Chat Export", { align: "center" })
    .moveDown(2);

  messages.forEach((msg) => {
    const sender: string = msg.sender_name;
    const time: string = formatTimestamp(msg.timestamp_ms / 1000);
    const content: string = msg.content ?? "";

    doc
      .fontSize(12)
      .fillColor("black")
      .text(fixEncoding(`${sender} (${time}):`));
    doc.fontSize(12).fillColor("gray").text(fixEncoding(content)).moveDown();
  });

  doc.end();
  console.log(`✅ PDF file saved: ${outputFile}`);
}

// Xử lý CLI với commander
program
  .version("1.0.0")
  .description("Export Instagram messages from JSON to Markdown, Word, or PDF")
  .option(
    "-f, --format <type>",
    "Output format: markdown, docx, json, pdf",
    "markdown"
  )
  .option("-o, --output <file>", "Output file name", "messages")
  .action(async (options: { format: string; output: string }) => {
    console.log("🔄 Processing JSON files...");
    const messages: Message[] = readJSONFiles(MESSAGES_DIR);
    const outputFile: string = `${options.output}.${options.format}`;

    console.log(messages.length);

    switch (options.format.toLowerCase()) {
      case "markdown":
        exportToMarkdown(messages, outputFile);
        break;

      case "docx":
        await exportToWord(messages, outputFile);
        break;

      case "pdf":
        exportToPDF(messages, outputFile);
        break;

      case "json":
        const jsonOutput: string = JSON.stringify(messages, null, 2);
        fs.writeFileSync(outputFile, jsonOutput, "utf-8");
        console.log(`✅ JSON file saved: ${outputFile}`);
        break;

      default:
        console.error("❌ Invalid format! Use markdown, docx, or pdf.");
    }
  });

program.parse(process.argv);
