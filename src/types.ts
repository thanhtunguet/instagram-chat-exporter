export interface Message {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
}

export interface Note {
  trigger_message_index: number;
  context_messages: Message[];
}

export interface Event {
  "Tên địa điểm/sự kiện": string;
  Loại: string;
  "Địa điểm": string;
  "Thời gian": string;
  "Ghi chú": string;
  "Ngữ cảnh": string;
}

export interface ParsedMarkdown {
  title: string;
  type: string;
  location: string;
  dateTime: string;
  notes: string;
  context: string;
}
