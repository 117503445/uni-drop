export class Message {
    // milisecond timestamp
    create_time: number;
    from: string;
    to: string;

    // text, image or file    
    kind: string;

    content: string;

    constructor(from: string, to: string, kind: string, content: string) {
        this.create_time = Date.now();
        this.from = from;
        this.to = to;
        this.kind = kind;
        this.content = content;
    }
}
