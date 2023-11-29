export class Message {
  id: string;
  // milisecond timestamp
  createTime: number;
  from: string;
  to: string;
  content: MessageContent;
  constructor(
    from: string,
    to: string,
    content: MessageContent,
    createTime?: number,
    id?: string,
  ) {
    if (from.length === 0 || to.length === 0) {
      throw new Error("from, to are required");
    }

    this.id = id ?? Math.random().toString(36).substring(2, 9);
    this.createTime = createTime ?? Date.now();
    this.from = from;
    this.to = to;
    this.content = content;
  }
  toString() {
    return JSON.stringify({
      id: this.id,
      createTime: this.createTime,
      content: this.content.displayObject(),
    });
  }
}

export class MessagePoco {
  id = "";
  createTime = 0;
  from = "";
  to = "";

  contentType: MessageType | null = null;

  text: string | null = null;

  file: ArrayBuffer | null = null;
  filetype: string | null = null;
  filename: string | null = null;
  isPriview = false;
}

enum MessageType {
  TEXT = "text",
  FILE = "file",
}

export abstract class MessageContent {
  abstract displayObject(): { type: MessageType };
}

export class TextMessageContent extends MessageContent {
  text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
  displayObject() {
    return {
      type: MessageType.TEXT,
      text: this.text,
    };
  }
}

export class FileMessageContent extends MessageContent {
  file: Blob;
  filename: string;
  isPriview: boolean;

  constructor(file: Blob, filename: string, isPriview: boolean) {
    super();
    this.file = file;
    this.filename = filename;
    this.isPriview = isPriview;
  }
  displayObject() {
    return {
      type: MessageType.FILE,
      fileSize: this.file.size,
      filename: this.filename,
      isPriview: this.isPriview,
    };
  }
}

export async function messageToPoco(message: Message) {
  const poco = new MessagePoco();
  poco.id = message.id;
  poco.createTime = message.createTime;
  poco.from = message.from;
  poco.to = message.to;

  if (message.content instanceof TextMessageContent) {
    poco.contentType = MessageType.TEXT;
    poco.text = message.content.text;
  } else if (message.content instanceof FileMessageContent) {
    poco.contentType = MessageType.FILE;
    poco.file = await message.content.file.arrayBuffer();
    poco.filetype = message.content.file.type;
    poco.filename = message.content.filename;
    poco.isPriview = message.content.isPriview;
  } else {
    throw new Error("unknown message content type");
  }
  return poco;
}

export function pocoToMessage(poco: MessagePoco): Message {
  let content: MessageContent;
  if (poco.contentType === MessageType.TEXT) {
    if (poco.text === null) {
      throw new Error("text is null");
    }
    content = new TextMessageContent(poco.text);
  } else if (poco.contentType === MessageType.FILE) {
    if (
      poco.file === null ||
      poco.filetype === null ||
      poco.filename === null
    ) {
      throw new Error("file, filetype, filename are required");
    }
    content = new FileMessageContent(
      new Blob([poco.file], { type: poco.filetype }),
      poco.filename,
      poco.isPriview,
    );
  } else {
    throw new Error("unknown message content type");
  }
  return new Message(poco.from, poco.to, content, poco.createTime, poco.id);
}
