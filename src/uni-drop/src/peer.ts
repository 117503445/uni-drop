import { DataConnection, Peer } from "peerjs";
import { publicIpv4 } from "public-ip";
import React from "react";
import { Message, MessageContent } from "./model";

// TODO: prior to use old peers id. If they are not available, use new peers id
class PeerIDStore {
    constructor() {
        this.peerIDStorageKey = this.getPeerIDStorageKey();

        this.refreshTimer = setInterval(() => {
            this.refreshPeerIDStorage(this.peerIDStorageKey);
        }, 1000);
    }

    private refreshTimer: number;
    private peerIDStorageKey: string;

    private refreshPeerIDStorage(peerIDKey: string) {
        let v = JSON.parse(localStorage.getItem(peerIDKey) || "{}");
        v.updatedTime = Date.now();
        localStorage.setItem(peerIDKey, JSON.stringify(v));
    }

    private getPeerIDStorageKey() {
        let peerIDKey = "";
        let i = 0;
        while (true) {
            let k = `peerID-${i}`;
            let v = localStorage.getItem(k);
            if (v == null) {
                peerIDKey = k;
                break;
            } else {
                const timeout = 5 * 1000;
                if (JSON.parse(v).updatedTime < Date.now() - timeout) {
                    // expired, reuse this key
                    peerIDKey = k;
                    break;
                }
            }
            i++;
        }
        console.log("peerIDKey", peerIDKey);
        this.peerIDStorageKey = peerIDKey;
        this.refreshPeerIDStorage(peerIDKey);
        return peerIDKey;
    }

    setPeerID(peerID: string) {
        localStorage.setItem(this.peerIDStorageKey, JSON.stringify({
            peerID: peerID,
            updatedTime: Date.now(),
        }));
    }

    getPeerID(): string | null {
        let v = localStorage.getItem(this.peerIDStorageKey);
        if (v == null) {
            return null;
        }
        return JSON.parse(v).peerID;
    }

    close() {
        clearInterval(this.refreshTimer);
    }
}

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
        let peerSet = new Set<string>();
        for (let peer of peers) {
            peerSet.add(peer);
        }

        // lanpeer not in peers should be removed from lanPeers
        this.activatePeers = this.activatePeers.filter((peer) => {
            return peerSet.has(peer.getId());
        });
        // console.log("activatePeers", this.activatePeers);

        let lanPeerSet = new Set<string>();
        for (let peer of this.activatePeers) {
            lanPeerSet.add(peer.getId());
        }

        // peers not in lanpeers should be added to lanPeers
        for (let p of peers) {
            if (!lanPeerSet.has(p) && p != this.peer.id) {
                console.info("new peer found", p);
                this.activatePeers.push(new UniPeer(this.peer, p));
            }
        }

        this.setpeersID(this.getPeersId());
    }

    updateConnectedPeer(peer: UniPeer) {
        for (let peer of this.activatePeers) {
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
        let ids: string[] = [];
        for (let peer of this.getPeers()) {
            ids.push(peer.getId());
        }
        return ids
    }

    findPeer(id: string): UniPeer | null {
        for (let peer of this.getPeers()) {
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
    send(content: MessageContent) {
        // const msg = new Message(this.peer.id, this.id, content);
        if (this.connection == undefined) {
            console.warn("DataConnection not set");
            return;
        }

        const metadata = {
            from: this.peer.id,
            to: this.id,
            create_time: Date.now(),
            type: content.type,
        }

        const payload = new Blob([metadata, "<split>", content.data]);
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
        let ipv6: string = "";

        // get ipv4 and ipv6 in parallel, ignore errors
        // let promises = await Promise.allSettled([publicIpv4({ timeout: 1000 }), publicIpv6({ timeout: 1000 })]);
        // promises.forEach((promise, i) => {
        //     if (promise.status == "fulfilled") {
        //         if (i == 0) {
        //             ipv4 = promise.value;
        //         } else if (i == 1) {
        //             ipv6 = promise.value;
        //         } else {
        //             console.error("Promise index out of range");
        //         }
        //     }
        // })

        ipv4 = await publicIpv4({ timeout: 2000 });

        let res = await fetch(`${this.host}/api/heartbeat`, {
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
        let data = await res.json();
        return data["data"]["peerIDs"];
    }
}

export class UniPeersManager {
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

    getPeersId(): string[] {
        if (this.peerpool == undefined) {
            return [];
        }

        let ids: string[] = [];
        for (let peer of this.peerpool.getPeers()) {
            ids.push(peer.getId());
        }
        return ids
    }

    constructor(setpeerID: React.Dispatch<React.SetStateAction<string>>, setpeersID: React.Dispatch<React.SetStateAction<string[]>>, msgCallback: ((msg: Message) => void) | undefined = undefined) {
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
                let uniPeer = new UniPeer(this.peer, conn.peer, conn);
                if (this.peerpool == undefined) {
                    console.warn("another peer connected before peerpool is set");
                } else {
                    this.peerpool.updateConnectedPeer(uniPeer);
                }
            })
            conn.on("data", (data) => {
                let payload = data as ArrayBuffer;
                // data is a payload
                console.log("data", data, typeof data);
                
                

                let metadata: any;
                let content: any;

                

                // let reader = new FileReader();
                // reader.readAsText(payload);
                // reader.onload = () => {
                //     let data = reader.result;
                //     let dataStr = data as string;
                //     let splitIndex = dataStr.indexOf("<split>");
                //     if (splitIndex == -1) {
                //         console.error("invalid data format");
                //         return;
                //     }
                //     metadata = JSON.parse(dataStr.substring(0, splitIndex));
                //     content = dataStr.substring(splitIndex + "<split>".length);
                //     // console.log("metadata", metadata);
                //     // console.log("content", content);

                //     let msg: Message;
                //     try {
                //         msg = new Message(metadata.from, metadata.to, new MessageContent(metadata.type, content), metadata.create_time);
                //     } catch (error) {
                //         console.error(error);
                //         return;
                //     }

                //     console.info(`<- peer ${conn.peer}: ${msg}`);
                //     this.msgCallback?.(msg);
                // }
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

    async heartbeat() {
        if (this.discovery == undefined) {
            console.warn("discovery not set");
            return;
        }

        let idList: string[] = [];
        try {
            idList = await this.discovery.heartbeat();
        } catch (error) {
            if (import.meta.env.MODE == "development" && import.meta.env.VITE_MOCK_API == "true") {
                if (this.heartbeatTimer != undefined) {
                    clearInterval(this.heartbeatTimer);
                    this.heartbeatTimer = undefined;
                }
                this.setpeersID(["peer1", "peer2", "peer3"]);
            } else {
                console.error(error);
            }
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
        let peer = this.peerpool.findPeer(id);
        if (peer != null) {
            console.info(`-> peer ${id}: ${content}`);
            peer.send(content);
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
            return new Promise((resolve, _) => {
                this.peer.on("open", () => {
                    resolve(this.peer.id);
                });
            });
        }
        return this.peer.id;
    }
}