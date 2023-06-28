import express from "express";
import * as CONFIG from "../config";
import { Packet, Tracer, calcChecksum, tryCorruptPacket } from "../shared";
const app = express();

let timer_started = false;
let last_seq = -1;
var packets: Packet[] = [];
app.use(express.json());

const getAck = (seq: number): Packet => {
  let res = { data: "ACK", seq, checksum: 0 };
  res.checksum = calcChecksum(res);
  res = tryCorruptPacket(res);
  return res;
};

const getNack = (seq: number): Packet => {
  let res = { data: "NACK", seq, checksum: 0 };
  res.checksum = calcChecksum(res);
  res = tryCorruptPacket(res);
  return res;
};

app.post("/", (req, res) => {
  const _send = (packet: Packet) => {
    if (Math.random() >= CONFIG.LOSS_RATE) res.send(packet);
    else
      Tracer(
        1,
        "Packet lost | Data: " +
          packet.data +
          " Seq: " +
          packet.seq +
          " Checksum: " +
          packet.checksum
      );
  };
  if (!timer_started) {
    console.time("Time taken");
    timer_started = true;
  }
  let packet = req.body as Packet;
  Tracer(
    1,
    `\nReceived packet. Data: ${packet.data} | Ack: ${packet.seq} | Checksum: ${packet.checksum}`
  );
  if (packet.checksum != calcChecksum(packet)) {
    Tracer(1, "Packet is corrupted");
    Tracer(1, "Sending NACK " + last_seq);
    _send(getNack(packet.seq));
    return;
  }
  if (packet.seq != last_seq + 1) {
    Tracer(
      1,
      "Packet is out of order. Expected: " +
        (last_seq + 1) +
        " | Received: " +
        packet.seq
    );
    Tracer(1, "Sending ACK " + last_seq);
    _send(getAck(last_seq));
    return;
  }
  last_seq = packet.seq;
  Tracer(1, "Sending ACK " + packet.seq);
  packets.push(packet);
  if (CONFIG.TRACING == 0) Tracer(0, `Received ${packet.data}`);
  _send(getAck(packet.seq));

  if (packets.length == CONFIG.NUMBER_TO_SIMULATE) {
    console.log("\n\n\n");
    console.log("Packets received:");
    Tracer(
      0,
      packets
        .map(
          (p) =>
            `${p.seq
              .toString()
              .padStart(CONFIG.NUMBER_TO_SIMULATE.toString().length, "0")}: ${
              p.data
            }`
        )
        .join("\n")
    );
    console.timeEnd("Time taken");
    packets = [];
  }
});

const server = app.listen(3000, () => {
  Tracer(0, "Receiver is listening on port 3000");
});
