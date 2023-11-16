import { DataConnection, Peer } from "peerjs";
import { publicIpv4 } from "public-ip";
import React from "react";
import { Message, MessageContent, MessageType } from "./model";



class Peerpool {
    // this peer
    private peer: Peer;

    // peers that can be connected to
    private activatePeers: UniPeer[] = [];
    // peers has chat history
    private historyPeers: UniPeer[] = [];

    private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;


    constructor(peer: Peer, setpeersID: React.Dispatch<React.SetStateAction<string[]>>) {
        this.peer = peer;
        this.setpeersID = setpeersID;
    }

    updateLanPeers(peers: string[]) {
        const peerSet = new Set<string>();
        for (const peer of peers) {
            peerSet.add(peer);
        }

        // lanpeer not in peers should be removed from lanPeers
        this.activatePeers = this.activatePeers.filter((peer) => {
            return peerSet.has(peer.getId());
        });
        // console.log("activatePeers", this.activatePeers);

        const lanPeerSet = new Set<string>();
        for (const peer of this.activatePeers) {
            lanPeerSet.add(peer.getId());
        }

        // peers not in lanpeers should be added to lanPeers
        for (const p of peers) {
            if (!lanPeerSet.has(p) && p != this.peer.id) {
                console.info(`new peer found: [${p}], this.peer.id = ${this.peer.id}`);
                this.activatePeers.push(new UniPeer(this.peer, p));
            }
        }

        this.setpeersID(this.getPeersId());
    }

    updateConnectedPeer(peer: UniPeer) {
        for (const peer of this.activatePeers) {
            if (peer.getId() == peer.getId()) {
                return;
            }
        }

        console.info("connected by new peer", peer.getId());
        this.activatePeers.push(peer);

        this.setpeersID(this.getPeersId());
    }

    getPeers(): UniPeer[] {
        return this.activatePeers.concat(this.historyPeers);
    }

    getPeersId(): string[] {
        const ids: string[] = [];
        for (const peer of this.getPeers()) {
            ids.push(peer.getId());
        }
        return ids
    }

    findPeer(id: string): UniPeer | null {
        for (const peer of this.getPeers()) {
            if (peer.getId() == id) {
                return peer;
            }
        }
        return null;
    }
}

// UniPeer is a peer that can be connected to
class UniPeer {
    // id of the peer that can be connected to
    private id: string;

    // my peer
    private peer: Peer;
    private connection: DataConnection | undefined = undefined;

    constructor(peer: Peer, id: string, connection: DataConnection | undefined = undefined) {
        this.peer = peer;
        this.id = id;

        if (connection == undefined) {
            this.connect();
        } else {
            // UniPeer connect to my peer
            this.setConnection(connection);
        }
    }

    getId(): string {
        return this.id;
    }

    private setConnection(connection: DataConnection) {
        if (this.connection != undefined) {
            console.warn("DataConnection already set");
            return;
        }
        this.connection = connection;

        connection.on("open", () => {
            console.info("connectted with peer", this.id);
            connection.on("data", (data) => {
                console.warn("data received", data);
                // if (typeof data === "string") {
                //     this.receiveCallback(data);
                // } else {
                //     console.warn(`received data type is not string: ${typeof data}`);
                // }
            });
        });
        connection.on("close", () => {
            console.info("connection closed with peer", this.id);
        });
        connection.on("error", (error) => {
            console.error(error);
        });
    }

    // my peer connect to this UniPeer
    private connect() {
        console.info(`connecting to peer ${this.id}`);
        if (this.connection != undefined) {
            return;
        }

        const conn = this.peer.connect(this.id);
        this.setConnection(conn);
    }

    // send content to this UniPeer
    send(msg: Message) {
        // const msg = new Message(this.peer.id, this.id, content);
        if (this.connection == undefined) {
            console.warn("DataConnection not set");
            return;
        }

        const payload = {
            from: msg.from,
            to: msg.id,
            createTime: msg.createTime,
            type: msg.content.type,
            data: msg.content.data,
            filename: msg.content.filename,
        }

        this.connection.send(payload);
    }
}

// UniDiscovery is used to discover peers on the lan
class UniDiscovery {
    private host: string;
    private id: string;

    constructor(id: string) {
        this.host = import.meta.env.VITE_BE_HOST;
        this.id = id;
    }
    async heartbeat(): Promise<string[]> {
        let ipv4: string = "";
        const ipv6: string = "";

        ipv4 = await publicIpv4({ timeout: 2000 });

        const res = await fetch(`${this.host}/api/heartbeat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ipv4: ipv4,
                ipv6: ipv6,
                peerID: this.id,
            }),
            signal: AbortSignal.timeout(300)
        });
        const data = await res.json();
        return data["data"]["peerIDs"];
    }
}

export abstract class UniPeersService {
    // send content to peer with id, non-blocking
    abstract send(id: string, content: MessageContent): void;
    abstract close(): void;
    abstract getPeerId(): Promise<string>;
}

export class UniPeersManager extends UniPeersService {
    // my peer
    private peer: Peer;

    // peers that can be connected to
    private peerpool: Peerpool | undefined = undefined;

    private heartbeatTimer: number | undefined = undefined;

    private setpeerID: React.Dispatch<React.SetStateAction<string>>;

    private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;

    private discovery: UniDiscovery | undefined = undefined;

    private msgCallback: ((msg: Message) => void) | undefined;

    // private peerIDStore: PeerIDStore = new PeerIDStore();

    constructor(setpeerID: React.Dispatch<React.SetStateAction<string>>, setpeersID: React.Dispatch<React.SetStateAction<string[]>>, msgCallback: ((msg: Message) => void) | undefined = undefined) {
        super();

        this.setpeerID = setpeerID;
        this.setpeersID = setpeersID;
        this.msgCallback = msgCallback;

        // TODO: use peerIDStore
        // let peerID = this.peerIDStore.getPeerID();
        // if (peerID != null && peerID != "") {
        //     this.peer = new Peer(
        //         peerID
        //         , {
        //             debug: DEBUG_LEVEL,
        //         }
        //     );
        // } else {
        //     this.peer = new Peer(
        //         {
        //             debug: DEBUG_LEVEL,
        //         }
        //     );
        // }

        const DEBUG_LEVEL = 0;
        this.peer = new Peer(
            {
                debug: DEBUG_LEVEL,
            }
        );

        this.peer.on("open", (id) => {
            console.info("this Peer id set to", id);
            this.setpeerID(id);
            // this.peerIDStore.setPeerID(id);

            this.peerpool = new Peerpool(this.peer, this.setpeersID);

            this.discovery = new UniDiscovery(id);

            this.heartbeatTimer = setInterval(async () => {
                // console.log(`peer.open: ${this.peer.open}`);
                this.heartbeat();
            }, 5000);
        });

        this.peer.on("connection", (conn) => {
            conn.on("open", () => {
                console.info("connected by peer", conn.peer);
                const uniPeer = new UniPeer(this.peer, conn.peer, conn);
                if (this.peerpool == undefined) {
                    console.warn("another peer connected before peerpool is set");
                } else {
                    this.peerpool.updateConnectedPeer(uniPeer);
                }
            })
            conn.on("data", async (data) => {
                if (typeof data !== "object") {
                    console.warn(`received data type is not object: ${typeof data}`);
                    return;
                }

                let msg: Message;
                try {
                    const payload = data as {
                        from: string,
                        to: string,
                        createTime: number,
                        type: MessageType,
                        data: string,
                        filename: string,
                    };
                    const content = new MessageContent(payload.type, payload.data, payload.filename);
                    msg = new Message(payload.from, payload.to, content, payload.createTime);
                } catch (error) {
                    console.error(error);
                    return;
                }

                console.info(`<- peer ${conn.peer}: ${msg}`);
                this.msgCallback?.(msg);
            });
        });

        this.peer.on("error", (error) => {
            console.error(error);
        })
        this.peer.on("disconnected", () => {
            console.warn(`peer[${this.peer.id}] disconnected`);
        })
        this.peer.on("close", () => {
            console.warn(`peer[${this.peer.id}] closed`);
        })

    }

    // heartbeat should be called by DemoPeer
    async heartbeat() {
        if (this.discovery == undefined) {
            console.warn("discovery not set");
            return;
        }

        let idList: string[] = [];
        try {
            idList = await this.discovery.heartbeat();
        } catch (error) {
            console.error(error);
            return;
        }
        if (this.peerpool != undefined) {
            this.peerpool.updateLanPeers(idList);
        }
    }

    send(id: string, content: MessageContent) {
        if (this.peerpool == undefined) {
            console.warn("peerpool not set");
            return;
        }

        const msg = new Message(this.peer.id, id, content);

        this.msgCallback?.(msg);
        const peer = this.peerpool.findPeer(id);
        if (peer != null) {
            console.info(`-> peer ${id}: ${content}`);
            peer.send(msg);
        } else {
            console.warn("peer not found");
        }

    }

    close() {
        console.info(`closing peer ${this.peer.id}`);
        this.peer.destroy();
        if (this.heartbeatTimer != undefined) {
            clearInterval(this.heartbeatTimer);
        }
    }

    async getPeerId(): Promise<string> {
        if (this.peer.id == null) {
            // wait until peer id is set
            console.warn("Waiting for peer id to be set");
            return new Promise((resolve, ) => {
                this.peer.on("open", () => {
                    resolve(this.peer.id);
                });
            });
        }
        return this.peer.id;
    }
}

export class UniPeersMockManager extends UniPeersService {
    private setpeerID: React.Dispatch<React.SetStateAction<string>>;
    private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;

    private msgCallback: ((msg: Message) => void) | undefined;

    constructor(setpeerID: React.Dispatch<React.SetStateAction<string>>, setpeersID: React.Dispatch<React.SetStateAction<string[]>>, msgCallback: ((msg: Message) => void) | undefined = undefined) {
        super();
        this.setpeerID = setpeerID;
        this.setpeersID = setpeersID;

        this.msgCallback = msgCallback;

        this.set();
    }

    private async set() {
        await new Promise((resolve, ) => {
            setTimeout(() => {
                resolve(null);
            }, 100);
        });
        console.log("setpeerID to mock")
        this.setpeerID("mock-peer");
        this.setpeersID(["peer1", "peer2", "peer3"]);
    }

    send(id: string, content: MessageContent): void {
        this.msgCallback?.(new Message("mock-peer", id, content));
        console.info(`-> peer ${id}: ${content}`);
        this.msgCallback?.(new Message(id, "mock-peer", content));
    }

    close(): void {
    }

    async getPeerId(): Promise<string> {
        return "mock-peer";
    }
}