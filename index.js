#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { Document, Packer, Paragraph, TextRun, Text } = require('docx');
const PDFDocument = require('pdfkit');

const MESSAGES_DIR = './.';

// Regex để phát hiện lỗi encoding dạng Latin-1
const INVALID_UTF8_REGEX = /[\xC2-\xF4][\x80-\xBF]+/g;

// Hàm sửa lỗi encoding
function fixEncoding(text) {
    return text.replace(INVALID_UTF8_REGEX, (match) => {
        try {
            return Buffer.from(match, 'latin1').toString('utf8');
        } catch (error) {
            return match;
        }
    });
}

// Định dạng thời gian
function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('vi-VN'); // Format ngày tháng Tiếng Việt
}

// Đọc tất cả các file JSON trong thư mục
function readJSONFiles(directory) {
    const files = fs.readdirSync(directory)
        .filter(file => file.startsWith('message_') && file.endsWith('.json'))
        .sort(); // Đảm bảo đúng thứ tự cuộc hội thoại
    let allMessages = [];

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        if (jsonData.messages) {
            allMessages = allMessages.concat(jsonData.messages);
        }
    });

    // Sắp xếp tin nhắn theo thời gian
    allMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    return allMessages;
}

// Xuất ra Markdown
function exportToMarkdown(messages, outputFile) {
    let mdContent = '# Instagram Chat Export\n\n';

    messages.forEach(msg => {
        const sender = fixEncoding(msg.sender_name);
        const time = formatTimestamp(msg.timestamp_ms / 1000);
        const content = msg.content ? fixEncoding(msg.content.replace(/\n/g, '  \n')) : '';

        mdContent += `**${sender}** (*${time}*):\n> ${content}\n\n`;
    });

    fs.writeFileSync(outputFile, mdContent, 'utf-8');
    console.log(`✅ Markdown file saved: ${outputFile}`);
}

// Xuất ra Word
async function exportToWord(messages, outputFile) {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ children: [new TextRun({ text: "Instagram Chat Export", bold: true, size: 32 })] }),
                new Paragraph({ text: "" })
            ],
        }]
    });

    const paragraphs = [];

    messages.forEach(msg => {
        const sender = fixEncoding(msg.sender_name);
        const time = formatTimestamp(msg.timestamp_ms / 1000);
        const content = msg.content ? fixEncoding(msg.content) : "";

        paragraphs.push(...[
            new Paragraph({
                children: [
                    new TextRun({ text: `${sender} `, bold: true }),
                    new TextRun({ text: `(${time})`, italics: true }),
                ]
            }),
            new Paragraph({
                text: content,
                pageBreakBefore: false,
            }),
            new Paragraph({ text: "" }),
        ]);
    });

    doc.addSection({
        children: paragraphs,
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputFile, buffer);
    console.log(`✅ Word file saved: ${outputFile}`);
}

// Xuất ra PDF
function exportToPDF(messages, outputFile) {
    const doc = new PDFDocument(
        {
            size: 'A4',
            margin: 50,
            bufferPages: true,

        }
    );
    doc.pipe(fs.createWriteStream(outputFile));

    doc.fontSize(20).text("Instagram Chat Export", { align: 'center' }).moveDown(2);

    messages.forEach(msg => {
        const sender = fixEncoding(msg.sender_name);
        const time = formatTimestamp(msg.timestamp_ms / 1000);
        const content = msg.content ? fixEncoding(msg.content) : "";

        doc.fontSize(12).fillColor('black').text(`${sender} (${time}):`, { bold: true });
        doc.fontSize(12).fillColor('gray').text(content.toString()).moveDown();
    });

    doc.end();
    console.log(`✅ PDF file saved: ${outputFile}`);
}

// Xử lý CLI với commander
program
    .version('1.0.0')
    .description('Export Instagram messages from JSON to Markdown, Word, or PDF')
    .option('-f, --format <type>', 'Output format: markdown, docx, pdf', 'markdown')
    .option('-o, --output <file>', 'Output file name', 'messages')
    .action(async (options) => {
        console.log("🔄 Processing JSON files...");
        const messages = readJSONFiles(MESSAGES_DIR);
        const outputFile = `${options.output}.${options.format}`;

        switch (options.format.toLowerCase()) {
            case 'markdown':
                exportToMarkdown(messages, outputFile);
                break;
            case 'docx':
                await exportToWord(messages, outputFile);
                break;
            case 'pdf':
                exportToPDF(messages, outputFile);
                break;
            default:
                console.error("❌ Invalid format! Use markdown, docx, or pdf.");
        }
    });

program.parse(process.argv);
