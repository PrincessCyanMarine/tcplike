import * as CONFIG from "./config";

export interface Packet {
  data: string;
  seq: number;
  checksum: number;
}

export const calcChecksum = (packet: Packet): number => {
  let sum = packet.seq;
  for (let i = 0; i < packet.data.length; i++) sum += packet.data.charCodeAt(i);
  return sum;
};

export const Tracer = (level: number, message: string) => {
  if (level <= CONFIG.TRACING) {
    // let date = new Date(Date.now());
    console.log(`${message}`);
  }
};

const flipBit = <T extends number | string>(data: T): T => {
  const _flip = (num: number): number => {
    let bit = 1 << Math.floor(Math.random() * 16);
    return num ^ bit;
  };
  if (typeof data === "number") return _flip(data) as T;
  let pos = Math.floor(Math.random() * data.length);
  return (data.substring(0, pos) +
    String.fromCharCode(_flip(data.charCodeAt(pos))) +
    data.substring(pos + 1)) as T;
};

export const tryCorruptPacket = (packet: Packet): Packet => {
  if (Math.random() < CONFIG.CORRUPTION_RATE) {
    Tracer(2, "Corrupting packet " + packet.seq + " | Data: " + packet.data);
    switch (Math.floor(Math.random() * 3)) {
      case 0:
        packet.data = flipBit(packet.data);
        break;
      case 1:
        packet.seq = flipBit(packet.seq);
        break;
      case 2:
        packet.checksum = flipBit(packet.checksum);
        break;
    }
  }
  return packet;
};
