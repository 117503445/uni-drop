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
  ) {
    if (!from || !to || !content) {
      throw new Error("from, to and content are required");
    }

    this.id = Math.random().toString(36).substring(2, 9);
    this.createTime = createTime || Date.now();
    this.from = from;
    this.to = to;
    this.content = content;
  }
  toString() {
    return JSON.stringify({
      id: this.id,
      createTime: this.createTime,
      content: this.content.toObject(),
    });
  }
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
}

export class MessageContent {
  type: MessageType;

  data: string = "";

  filename: string = "";

  private ready = false;

  constructor(type: MessageType, data?: string, filename?: string) {
    this.type = type;
    if (data) {
      this.data = data;
      this.ready = true;
    }
    if (filename) {
      this.filename = filename;
    }
  }

  async setData(data: string | File) {
    if (this.ready) {
      throw new Error("data already set");
    }

    if (typeof data === "string") {
      this.data = data;
      this.ready = true;
    } else if (typeof data === "object" && data instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(data);
      this.data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result as string);
          this.ready = true;
          this.filename = data.name;
        };
        reader.onerror = () => {
          reject(reader.error);
        };
      });
    } else {
      throw new Error("data must be string or blob");
    }
  }

  toString() {
    return JSON.stringify(this.toObject());
  }
  toObject() {
    switch (this.type) {
      case MessageType.TEXT:
        return this.data;
      case MessageType.IMAGE:
        return {
          type: this.type,
          filename: this.filename,
          size: this.data.length,
        };
      case MessageType.FILE:
        return {
          type: this.type,
          filename: this.filename,
          size: this.data.length,
        };
    }
  }
}
