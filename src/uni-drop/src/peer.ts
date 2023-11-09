import { DataConnection, Peer } from "peerjs";
import { publicIpv4 } from "public-ip";


class Peerpool {
    // id of this peer
    private id: string;
    // peers that can be connected to
    private activatePeers: UniPeer[] = [];
    // peers has chat history
    private historyPeers: UniPeer[] = [];

    private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;

    constructor(id: string, setpeersID: React.Dispatch<React.SetStateAction<string[]>>) {
        this.id = id;
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
        for (let peer of peers) {
            if (!lanPeerSet.has(peer) && peer != this.id) {
                console.info("new peer found", peer);
                this.activatePeers.push(new UniPeer(new Peer(this.id), peer));
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

    // getLanPeers(): UniPeer[] {
    //     return this.activatePeers;
    // }

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
        this.connection.on("open", () => {
            console.info("connectted with peer", this.id);
        });
        this.connection.on("data", (data) => {
            console.info("data received from peer", this.id, data);
        });
    }

    // my peer connect to this UniPeer
    private connect() {
        if (this.connection != undefined) {
            return;
        }
        this.setConnection(this.peer.connect(this.id));
    }

    // send message to this UniPeer
    send(msg: string) {
        if (this.connection == undefined) {
            console.warn("DataConnection not set");
            return;
        }
        this.connection.send(msg);
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

        ipv4 = await publicIpv4({ timeout: 1000 });

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
        });
        let data = await res.json();
        return data["data"]["peerIDs"];
    }
}

export class UniPeersManager {
    // my peer
    private peer: Peer;

    // private peers: UniPeer[] = [];


    // peers that can be connected to
    private peerpool: Peerpool | undefined = undefined;

    private heartbeatTimer: number | undefined = undefined;

    private setpeerID: React.Dispatch<React.SetStateAction<string>>;

    // private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;


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

    constructor(setpeerID: React.Dispatch<React.SetStateAction<string>>, setpeersID: React.Dispatch<React.SetStateAction<string[]>>, id: string | undefined = undefined) {
        if (id != undefined) {
            this.peer = new Peer(id);
        }
        else {
            this.peer = new Peer();
        }
        this.peer.on("connection", (dataConnection) => {
            dataConnection.on("open", () => {
                console.info("connected by peer", dataConnection.peer);
                let uniPeer = new UniPeer(this.peer, dataConnection.peer, dataConnection);
                if (this.peerpool == undefined) {
                    console.warn("another peer connected before peerpool is set");
                } else {
                    this.peerpool.updateConnectedPeer(uniPeer);
                }
            })
        });
        this.setpeerID = setpeerID;
        // this.setpeersID = setpeersID;

        this.peer.on("open", (id) => {
            console.info("this Peer id set to", id);
            this.setpeerID(id);

            this.peerpool = new Peerpool(id, setpeersID);

            const discovery = new UniDiscovery(id);

            this.heartbeatTimer = setInterval(async () => {
                const idList = await discovery.heartbeat();

                if (this.peerpool != undefined) {
                    this.peerpool.updateLanPeers(idList);
                }
            }, 5000);
        });

    }



    send(id: string, msg: string) {
        if (this.peerpool == undefined) {
            console.warn("peerpool not set");
            return;
        }
        let peer = this.peerpool.findPeer(id);
        if (peer != null) {
            peer.send(msg);
        }

    }

    close() {
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