class Message {
    // milisecond timestamp
    create_time: number;
    author: string;

    // text, image or file    
    kind: string;

    content: string;

    constructor(author: string, kind: string, content: string) {
        this.create_time = Date.now();
        this.author = author;
        this.kind = kind;
        this.content = content;
    }
}
