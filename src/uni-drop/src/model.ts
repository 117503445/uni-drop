export class Message {
    // milisecond timestamp
    createTime: number;
    from: string;
    to: string;
    content: MessageContent;
    constructor(from: string, to: string, content: MessageContent, createTime?: number) {
        if (!from || !to || !content) {
            throw new Error('from, to and content are required');
        }
        this.createTime = createTime || Date.now();
        this.from = from;
        this.to = to;
        this.content = content;
    }
}

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file'
}

export class MessageContent {
    type: MessageType;

    data: any

    constructor(type: MessageType, data: any) {
        if (!type || !data) {
            throw new Error('type and data are required');
        }

        this.type = type;
        this.data = data;
    }
}