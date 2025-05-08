import "dotenv/config";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { Event, ParsedMarkdown } from "./types";

function parseMarkdownFile(content: string): Event {
  // Extract title (first line after #)
  const titleMatch: RegExpMatchArray | null = content.match(/# (.+)/);
  const title: string = titleMatch ? titleMatch[1].trim() : "";

  // Extract other fields
  const typeMatch: RegExpMatchArray | null =
    content.match(/\*\*Loại\*\*: (.+)/m);
  const locationMatch: RegExpMatchArray | null = content.match(
    /\*\*Địa điểm\*\*: (.+)/m
  );
  const dateTimeMatch: RegExpMatchArray | null = content.match(
    /\*\*Thời gian\*\*: (.+)/m
  );
  const notesMatch: RegExpMatchArray | null = content.match(
    /\*\*Ghi chú\*\*: (.+)/m
  );
  const contextMatch: RegExpMatchArray | null = content.match(
    /\*\*Ngữ cảnh\*\*: (.+)/m
  );

  return {
    "Tên địa điểm/sự kiện": title,
    Loại: typeMatch ? typeMatch[1].trim() : "",
    "Địa điểm": locationMatch ? locationMatch[1].trim() : "",
    "Thời gian": dateTimeMatch ? dateTimeMatch[1].trim() : "",
    "Ghi chú": notesMatch ? notesMatch[1].trim() : "",
    "Ngữ cảnh": contextMatch ? contextMatch[1].trim() : "",
  };
}

function combineToExcel(): void {
  try {
    // Create output directory if it doesn't exist
    const outputDir: string = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Read all markdown files from extracted directory
    const extractedDir: string = path.join(__dirname, "extracted");
    const markdownFiles: string[] = fs
      .readdirSync(extractedDir)
      .filter((file) => file.startsWith("event_") && file.endsWith(".md"));

    console.log(`Found ${markdownFiles.length} events to combine...`);

    // Parse each markdown file
    const events: Event[] = markdownFiles.map((file) => {
      const filePath: string = path.join(extractedDir, file);
      const content: string = fs.readFileSync(filePath, "utf8");
      return parseMarkdownFile(content);
    });

    // Create a new workbook
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    // Convert events to worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(events);

    // Set column widths
    const colWidths: { wch: number }[] = [
      { wch: 30 }, // Tên địa điểm/sự kiện
      { wch: 15 }, // Loại
      { wch: 30 }, // Địa điểm
      { wch: 20 }, // Thời gian
      { wch: 50 }, // Ghi chú
      { wch: 50 }, // Ngữ cảnh
    ];
    worksheet["!cols"] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Events");

    // Generate filename with current date
    const date: string = new Date().toISOString().split("T")[0];
    const outputPath: string = path.join(outputDir, `events_${date}.xlsx`);

    // Write the workbook to file
    XLSX.writeFile(workbook, outputPath);

    console.log(
      `\nSuccessfully combined ${events.length} events into Excel file:`
    );
    console.log(outputPath);
  } catch (error) {
    console.error("\n❌ Error combining events:");
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Run the combination
combineToExcel();
