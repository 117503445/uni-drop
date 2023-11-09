import { DataConnection, Peer } from "peerjs";
import { useState, useEffect } from "react";
import { publicIpv4, publicIpv6 } from "public-ip";

// UniPeer is a peer that can be connected to
class UniPeer {
    private id: string;

    // my peer
    private peer: Peer;
    private dataConnection: DataConnection | null = null;

    constructor(peer: Peer, id: string) {
        this.peer = peer;
        this.id = id;
    }

    getId(): string {
        return this.id;
    }

    // my peer connect to this UniPeer
    connect() {
        if (this.dataConnection != null) {
            console.warn("DataConnection already set, closing old connection");
            this.dataConnection.close();
        }
        this.dataConnection = this.peer.connect(this.id);
    }

    // UniPeer connect to my peer
    setConnection(dataConnection: DataConnection) {
        if (this.dataConnection != null) {
            console.warn("DataConnection already set, closing old connection");
            this.dataConnection.close();
        }
        this.dataConnection = dataConnection;
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

    // peers that can be connected to
    private peers: UniPeer[] = [];

    private heartbeatTimer: number | null = null;

    private setpeerID: React.Dispatch<React.SetStateAction<string>>;

    constructor(setpeerID: React.Dispatch<React.SetStateAction<string>>, id: string | null = null) {
        if (id != null) {
            this.peer = new Peer(id);
        }
        else {
            this.peer = new Peer();
        }
        this.peer.on("connection", (dataConnection) => {
            dataConnection.on("open", () => {
                let uniPeer = new UniPeer(this.peer, dataConnection.peer);
                uniPeer.setConnection(dataConnection);
                this.peers.push(uniPeer);
            })
        });
        this.setpeerID = setpeerID;

        this.peer.on("open", (id) => {
            console.log("this Peer id set to", id);
            this.setpeerID(id);
            const discovery = new UniDiscovery(this.peer.id);

            this.heartbeatTimer = setInterval(async () => {
                const idList = await discovery.heartbeat();
                // console.log("Heartbeat, idList = ", idList);
                let peerSet = new Set<string>();
                for (let peer of this.peers) {
                    peerSet.add(peer.getId());
                }

                for (let id of idList) {
                    if (!peerSet.has(id) && id != this.peer.id) {
                        console.log("Add peer", id);
                        let uniPeer = new UniPeer(this.peer, id);
                        uniPeer.connect();
                        this.peers.push(uniPeer);
                    }
                }
            }, 5000);
        });

    }

    close() {
        this.peer.destroy();
        if (this.heartbeatTimer != null) {
            clearInterval(this.heartbeatTimer);
        }
    }

    async getPeerId(): Promise<string> {
        if (this.peer.id == null) {
            // wait until peer id is set
            console.warn("Waiting for peer id to be set");
            return new Promise((resolve, reject) => {
                this.peer.on("open", () => {
                    resolve(this.peer.id);
                });
            });
        }
        return this.peer.id;
    }


}