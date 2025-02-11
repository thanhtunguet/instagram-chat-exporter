# Instagram Chat Exporter

## Overview
This script exports Instagram messages from JSON files to **Markdown (.md), Word (.docx), or PDF (.pdf)** formats. It helps you back up, read, and analyze your chat history in a structured and easy-to-read format.

## Features
- 📝 **Export to Markdown** for easy sharing and viewing.
- 📄 **Export to DOCX** for editing in Microsoft Word.
- 📜 **Export to PDF** for a clean, printable format.
- 🔄 **Automatically processes multiple message files** (e.g., `message_1.json`, `message_2.json`).
- 🛠 **Fixes encoding issues** for better readability.

## Installation
### Prerequisites
- **Node.js** (v14 or higher recommended)

### Install Dependencies
```sh
npm install
```

## Usage
### Run the Script
```sh
node index.js -f <format> -o <output_filename>
```

### Options
- `-f, --format`  _(required)_ : Output format (**markdown**, **docx**, or **pdf**). Default is `markdown`.
- `-o, --output` _(optional)_ : Output file name (without extension). Default is `messages`.

### Example Commands
#### Export messages to Markdown:
```sh
node index.js -f markdown -o chat_backup
```

#### Export messages to Word (DOCX):
```sh
node index.js -f docx -o chat_backup
```

#### Export messages to PDF:
```sh
node index.js -f pdf -o chat_backup
```

## JSON File Structure
The script expects Instagram messages in the following JSON format:
```json
{
  "messages": [
    {
      "sender_name": "John Doe",
      "timestamp_ms": 1678901234567,
      "content": "Hello, how are you?"
    },
    {
      "sender_name": "Jane Smith",
      "timestamp_ms": 1678902234567,
      "content": "I'm good, thanks!"
    }
  ]
}
```

## How It Works
1. **Reads** all `message_*.json` files in the current directory.
2. **Sorts** messages by timestamp.
3. **Fixes encoding issues** (if any).
4. **Exports** messages in the selected format.

## License
This project is licensed under the **MIT License**.

## Contributing
Feel free to submit **issues** or **pull requests** to improve the script!

## Author
**thanhtunguet** - [https://thanhtunguet.info](https://thanhtunguet.info)

