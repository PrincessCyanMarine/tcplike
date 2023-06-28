import axios from "axios";
import { Packet, Tracer, calcChecksum, tryCorruptPacket } from "../shared";
import * as CONFIG from "../config";

var packets: Packet[] = [];
let expected_ack = 0;
const timers: { [i: number]: NodeJS.Timeout } = {};

const wait = async (millis: number) =>
  new Promise((resolve) => setTimeout(resolve, millis));

const sendPacket = (data: string, seq: number) =>
  new Promise<Packet>(async (resolve) => {
    Tracer(1, `\nSending packet. DATA: ${data} | ACK: ${seq}`);
    let packet: Packet = {
      data,
      seq,
      checksum: 0,
    };
    packet.checksum = calcChecksum(packet);
    packet = tryCorruptPacket(packet);
    if (Math.random() >= CONFIG.LOSS_RATE)
      axios
        .post("http://localhost:3000/", packet)
        .then(async (res) => {
          if (timers[expected_ack]) {
            clearTimeout(timers[expected_ack]);
            delete timers[expected_ack];
          }

          Tracer(
            2,
            `Received response for packet: Data: ${packet.data} | Ack: ${packet.seq} | Checksum: ${packet.checksum}`
          );

          if (calcChecksum(res.data) == res.data.checksum) {
            if (res.data.seq == expected_ack) {
              if (res.data.data === "ACK") {
                Tracer(1, "Received expected ACK " + expected_ack);
                expected_ack++;
                resolve({ data, seq: seq, checksum: 0 });
                return;
              }

              Tracer(1, "Received NACK " + res.data.seq);
            } else {
              if (res.data.data === "ACK") {
                Tracer(
                  2,
                  "Received wrong ACK. Expected: " +
                    expected_ack +
                    " | Received: " +
                    res.data.seq
                );
              } else {
                Tracer(
                  2,
                  "Received wrong NACK. Expected: " +
                    expected_ack +
                    " | Received: " +
                    res.data.seq
                );
              }
            }
          } else {
            Tracer(2, "Received corrupted packet");
          }

          await wait(CONFIG.DELAY_BETWEEN_MESSAGES);
          sendPacket(data, seq).then(resolve);
        })
        .catch(async (err) => {
          Tracer(2, `Error: ${err}`);
        });
    else Tracer(1, "Packet lost");
    timers[seq] = setTimeout(() => {
      Tracer(1, "Timeout for packet " + seq);
      sendPacket(data, seq).then(resolve);
    }, CONFIG.TIMEOUT);
  });

const main = async () => {
  await wait(1500);
  console.time("Time taken");
  const send = async (i: number) => {
    const data = "".padEnd(
      CONFIG.MESSAGE_LENGTH,
      CONFIG.ALPHABET.charAt(i % CONFIG.ALPHABET.length)
    );
    if (CONFIG.TRACING == 0) Tracer(0, `Sending ${data}`);
    packets.push(await sendPacket(data, i));
    await wait(CONFIG.DELAY_BETWEEN_MESSAGES);
    if (i < CONFIG.NUMBER_TO_SIMULATE - 1) send(i + 1);
    else {
      console.log("\n\n\n");
      console.log("Packets sent:");
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
      while (true) {}
    }
  };
  send(0);
};
main();
