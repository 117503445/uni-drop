import { DataConnection, Peer, PeerJSOption } from "peerjs";
import { publicIpv4 } from "public-ip";
import React from "react";
import {
  Message,
  MessageContent,
  MessagePoco,
  messageToPoco,
  pocoToMessage,
} from "./model";

class UniPeerState {
  // is the peer found by discovery currently
  isDiscovery = false;

  // is the peer has chat history
  isHistory = false;

  // user manually add peer, or peer manually add my peer
  isManual = false;

  isOnlyDiscovery(): boolean {
    return this.isDiscovery && !this.isHistory && !this.isManual;
  }

  constructor({
    isDiscovery = false,
    isHistory = false,
    isManual = false,
  } = {}) {
    this.isDiscovery = isDiscovery;
    this.isHistory = isHistory;
    this.isManual = isManual;
  }
}

class Peerpool {
  // this peer
  private peer: Peer;

  private peers = new Map<UniPeer, UniPeerState>();

  private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;

  private peersConnState = new Map<string, boolean>();
  private setPeersConnState: React.Dispatch<
    React.SetStateAction<Map<string, boolean>>
  >;

  private msgReceiver: (peerID: string, msg: Message) => void;

  private connStateChangeListenerFunc = (peerid: string) => {
    return (connected: boolean) => {
      if (!this.peersConnState.has(peerid)) {
        this.peersConnState.set(peerid, connected);
        this.setPeersConnState(new Map(this.peersConnState));
      } else {
        if (this.peersConnState.get(peerid) != connected) {
          this.peersConnState.set(peerid, connected);
          this.setPeersConnState(new Map(this.peersConnState));
        }
      }
    };
  };

  constructor(
    peer: Peer,
    setpeersID: React.Dispatch<React.SetStateAction<string[]>>,
    setPeersConnState: React.Dispatch<
      React.SetStateAction<Map<string, boolean>>
    >,
    msgReceiver: (peerID: string, msg: Message) => void,
  ) {
    this.peer = peer;
    this.setpeersID = setpeersID;
    this.setPeersConnState = setPeersConnState;
    this.msgReceiver = msgReceiver;
  }

  updateLanPeers(peers: string[]) {
    // newPeerSet = set(peers)
    const newPeerSet = new Set<string>();
    for (const peer of peers) {
      newPeerSet.add(peer);
    }

    let changed = false;

    // remove old onlyDiscovery peers
    const deletePeers: UniPeer[] = [];
    for (const [peer, state] of this.peers) {
      if (state.isOnlyDiscovery() && !newPeerSet.has(peer.getId())) {
        changed = true;
        deletePeers.push(peer);
      }
    }
    for (const peer of deletePeers) {
      peer.close();
      this.peers.delete(peer);
    }

    // oldPeerSet = set(p.id for p in peers.keys())
    const oldPeerSet = new Set<string>();
    for (const peer of this.peers.keys()) {
      oldPeerSet.add(peer.getId());
    }

    // peers not in oldPeerSet should be added
    for (const p of peers) {
      if (!oldPeerSet.has(p) && p != this.peer.id) {
        console.info(`new peer found: [${p}], this.peer.id = ${this.peer.id}`);
        changed = true;
        this.peers.set(
          new UniPeer(
            this.peer,
            p,
            (msg: Message) => {
              this.msgReceiver(p, msg);
            },
            this.connStateChangeListenerFunc(p),
          ),
          new UniPeerState({ isDiscovery: true }),
        );
      }
    }

    // update isDiscovery state
    for (const [peer, state] of this.peers) {
      state.isDiscovery = newPeerSet.has(peer.getId());
    }

    if (changed) {
      this.setpeersID(this.getPeersId());
    }
  }

  updateConnectedPeer(conn: DataConnection) {
    console.info("connected by new peer", conn.peer);

    for (const p of this.peers.keys()) {
      if (p.getId() == conn.peer) {
        p.setConnection(conn);
        return;
      }
    }

    this.peers.set(
      new UniPeer(
        this.peer,
        conn.peer,
        (msg: Message) => {
          this.msgReceiver(conn.peer, msg);
        },
        this.connStateChangeListenerFunc(conn.peer),
        conn,
      ),
      new UniPeerState({ isManual: true }), // TODO: isManual and by another peer discovery should be separated
    );

    this.setpeersID(this.getPeersId());
  }

  getPeers(): UniPeer[] {
    return Array.from(this.peers.keys());
  }

  getPeersId(): string[] {
    const ids: string[] = [];
    for (const peer of this.getPeers()) {
      ids.push(peer.getId());
    }
    return ids;
  }

  findPeer(id: string): UniPeer | null {
    for (const peer of this.getPeers()) {
      if (peer.getId() == id) {
        return peer;
      }
    }
    return null;
  }

  // user manually add peer
  addPeer(id: string) {
    if (this.findPeer(id) != null) {
      console.info(`peer ${id} already added`);
      return;
    }
    console.info(`add peer ${id}`);
    this.peers.set(
      new UniPeer(
        this.peer,
        id,
        (msg: Message) => {
          this.msgReceiver(id, msg);
        },
        this.connStateChangeListenerFunc(id),
      ),
      new UniPeerState({ isManual: true }),
    );
    this.setpeersID(this.getPeersId());
  }
}

// UniPeer is a peer that can be connected to
class UniPeer {
  // id of the peer that can be connected to
  private id: string;

  // my peer
  private peer: Peer;

  // connection must be open
  private connection: DataConnection | undefined = undefined;

  private connStateChangeListener: (connected: boolean) => void;
  private msgReceiver: (msg: Message) => void;

  private closing = false;

  constructor(
    peer: Peer,
    id: string,
    msgReceiver: (msg: Message) => void,
    connStateChangeListener: (connected: boolean) => void,
    connection: DataConnection | undefined = undefined,
  ) {
    this.peer = peer;
    this.id = id;
    this.msgReceiver = msgReceiver;
    this.connStateChangeListener = connStateChangeListener;

    if (connection == undefined) {
      this.connect();
    } else {
      // UniPeer connect to my peer
      this.setConnection(connection);
      this.connStateChangeListener(true);
    }
  }

  getId(): string {
    return this.id;
  }

  setConnection(connection: DataConnection) {
    if (this.connection != undefined) {
      console.info(`peer ${this.id} connection already set`);
      connection.close();
      return;
    }
    connection.on("open", () => {
      console.info(`connection to peer ${this.id} opened`);
      if (this.connection == undefined) {
        this.connection = connection;
        this.connStateChangeListener(true);
      } else {
        console.log(
          `peer ${this.id} connection opened, but connection already set`,
        );
        connection.close();
      }
    });
    connection.on("close", () => {
      console.info(`connection to peer ${this.id} closed`);
      if (this.connection == connection) {
        this.connStateChangeListener(false);
        this.connection = undefined;
        if (!this.closing) {
          console.info(`reconnecting to peer ${this.id}`);
          this.connect();
        } else {
          console.info(`peer ${this.id} closed`);
        }
      }
    });
    connection.on("error", (error) => {
      console.error(`connection to peer ${this.id} error: ${error.message}`);
    });
    connection.on("iceStateChanged", (state) => {
      console.info(`connection to peer ${this.id} iceStateChanged: ${state}`);
      if (state === "disconnected") {
        connection.close();
      }
    });
    connection.on("data", (data) => {
      if (typeof data !== "object") {
        console.warn(`received data type is not object: ${typeof data}`);
        return;
      }

      const poco = data as MessagePoco;
      const msg = pocoToMessage(poco);
      console.log(`received msg: ${msg.toString()}`);

      if (msg.to != this.peer.id) {
        console.warn(`received msg.to is not my peer id: ${msg.to}`);
      } else if (msg.from != this.id) {
        console.warn(`received msg.from is not peer id: ${msg.from}`);
      }

      this.msgReceiver(msg);
    });
  }

  // my peer connect to this UniPeer
  private connect() {
    console.info(`connecting to peer ${this.id}`);
    const conn = this.peer.connect(this.id);
    this.setConnection(conn);
  }

  // send content to this UniPeer
  async send(msg: Message) {
    // const msg = new Message(this.peer.id, this.id, content);
    if (this.connection == undefined) {
      console.warn("DataConnection not set");
      return;
    }

    console.info(`-> peer ${this.id}: ${msg.toString()}`);
    this.connection.send(await messageToPoco(msg));
  }

  close() {
    this.closing = true;
    if (this.connection != undefined) {
      this.connection.close();
    }
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
    let ipv4 = "";
    const ipv6 = "";

    if (import.meta.env.DEV) {
      ipv4 = "127.0.0.1";
    } else {
      ipv4 = await publicIpv4({ timeout: 2000 });
    }

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
      signal: AbortSignal.timeout(300),
    });

    const response = (await res.json()) as { data: { peerIDs: string[] } };

    return response.data.peerIDs;
  }
  async ping(): Promise<boolean> {
    try {
      await (await fetch(`${this.host}`)).json();
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }
}

export abstract class UniPeersService {
  // send content to peer with id, non-blocking
  abstract send(id: string, content: MessageContent): void;
  // user manually add peer
  abstract addPeer(id: string): void;
  abstract close(): void;
}

export class UniPeersManager extends UniPeersService {
  // my peer
  private peer: Peer;

  // peers that can be connected to
  private peerpool: Peerpool | undefined = undefined;

  private heartbeatTimer: NodeJS.Timeout | undefined = undefined;

  private setpeerID: React.Dispatch<React.SetStateAction<string>>;

  private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;

  private setMessages: React.Dispatch<React.SetStateAction<Message[]>>;

  private setPeersConnState: React.Dispatch<
    React.SetStateAction<Map<string, boolean>>
  >;

  private discovery: UniDiscovery | undefined = undefined;

  private messages: Message[] = [];

  private pendingAddPeers: string[] = [];

  // private peerIDStore: PeerIDStore = new PeerIDStore();

  constructor(
    setpeerID: React.Dispatch<React.SetStateAction<string>>,
    setpeersID: React.Dispatch<React.SetStateAction<string[]>>,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setPeersConnState: React.Dispatch<
      React.SetStateAction<Map<string, boolean>>
    >,
  ) {
    super();

    this.setpeerID = setpeerID;
    this.setpeersID = setpeersID;
    this.setMessages = setMessages;
    this.setPeersConnState = setPeersConnState;

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
    // const DEBUG_LEVEL = 3;

    const peerOptions: PeerJSOption = {
      debug: DEBUG_LEVEL,
    };
    if (import.meta.env.DEV) {
      peerOptions.host = "localhost";
      peerOptions.port = 9000;
    }

    this.peer = new Peer(peerOptions);

    this.peer.on("open", (id) => {
      console.info("this Peer id set to", id);
      this.setpeerID(id);
      // this.peerIDStore.setPeerID(id);

      this.peerpool = new Peerpool(
        this.peer,
        this.setpeersID,
        this.setPeersConnState,
        (peerID: string, msg: Message) => {
          console.info(`<- peer ${peerID}: ${msg.toString()}`);
          this.messages.push(msg);

          this.setMessages([...this.messages]);
        },
      );
      console.log("current pendingAddPeers", this.pendingAddPeers);
      for (const id of this.pendingAddPeers) {
        console.info(`add pending peer ${id}`);
        this.peerpool.addPeer(id);
      }
      this.pendingAddPeers = [];

      this.discovery = new UniDiscovery(id);

      let heartbeatInterval = 5000;
      if (import.meta.env.DEV) {
        heartbeatInterval = 500;
      }
      if (import.meta.env.VITE_DISABLE_HEARTBEAT != "true") {
        this.heartbeatTimer = setInterval(() => {
          this.heartbeat().catch((error) => {
            console.error(error);
          });
        }, heartbeatInterval);
      }
    });

    this.peer.on("connection", (conn) => {
      if (this.peerpool == undefined) {
        console.warn("another peer connected before peerpool is set");
        conn.close();
      } else {
        this.peerpool.updateConnectedPeer(conn);
      }
    });

    this.peer.on("error", (error) => {
      console.error(error);
    });
    this.peer.on("disconnected", () => {
      console.warn(`peer[${this.peer.id}] disconnected`);
    });
    this.peer.on("close", () => {
      console.warn(`peer[${this.peer.id}] closed`);
    });
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

  async send(id: string, content: MessageContent) {
    if (this.peerpool == undefined) {
      console.warn("peerpool not set");
      return;
    }

    const msg = new Message(this.peer.id, id, content);

    this.messages.push(msg);

    this.setMessages([...this.messages]);
    const peer = this.peerpool.findPeer(id);
    if (peer != null) {
      await peer.send(msg);
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
    if (this.peer.id.length == 0) {
      // wait until peer id is set
      console.warn("Waiting for peer id to be set");
      return new Promise((resolve) => {
        this.peer.on("open", () => {
          resolve(this.peer.id);
        });
      });
    }
    return this.peer.id;
  }
  addPeer(id: string) {
    if (this.peerpool == undefined) {
      console.log(`add peer ${id} to pending list`);
      this.pendingAddPeers.push(id);
    } else {
      this.peerpool.addPeer(id);
    }
  }
}

export class UniPeersMockManager extends UniPeersService {
  private setpeerID: React.Dispatch<React.SetStateAction<string>>;
  private setpeersID: React.Dispatch<React.SetStateAction<string[]>>;
  private setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  private setPeersConnState: React.Dispatch<
    React.SetStateAction<Map<string, boolean>>
  >;

  private messages: Message[] = [];

  private peersID: string[] = (() => {
    // const peerNum = 20;
    const peerNum = 3;
    const peersID = [];
    for (let i = 1; i <= peerNum; i++) {
      peersID.push(`peer${i}`);
    }
    return peersID;
  })();

  constructor(
    setpeerID: React.Dispatch<React.SetStateAction<string>>,
    setpeersID: React.Dispatch<React.SetStateAction<string[]>>,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setPeersConnState: React.Dispatch<
      React.SetStateAction<Map<string, boolean>>
    >,
  ) {
    super();
    this.setpeerID = setpeerID;
    this.setpeersID = setpeersID;

    this.setMessages = setMessages;
    this.setPeersConnState = setPeersConnState;

    this.setpeerID("mock-peer");

    const m = new Map<string, boolean>();
    for (const id of this.peersID) {
      m.set(id, true);
    }
    this.setPeersConnState(m);

    this.setpeersID(this.peersID);
  }

  send(id: string, content: MessageContent) {
    const msg = new Message("mock-peer", id, content);
    this.messages.push(msg);
    console.info(`-> peer ${id}: ${msg.toString()}`);
    this.messages.push(new Message(id, "mock-peer", content));
    this.setMessages([...this.messages]);
  }

  close() {
    console.info(`closing peer mock-peer`);
  }

  async getPeerId(): Promise<string> {
    return new Promise((resolve) => {
      resolve("mock-peer");
    });
  }

  addPeer(id: string): void {
    console.info(`add peer ${id}`);
    this.peersID.push(id);
    this.setpeersID(this.peersID);
  }
}
