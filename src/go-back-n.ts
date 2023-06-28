import * as CONFIG from "./config";
import { Packet, Tracer, calcChecksum, tryCorruptPacket } from "./shared";

const packets: Packet[] = [];
var next_packet = 0;
var window_start = 0;
var timer: NodeJS.Timeout | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const reset_timer = () => {
  Tracer(2, "Resetting timer");
  stop_timer();
  timer = setTimeout(onTimeout, CONFIG.TIMEOUT);
};
const stop_timer = () => {
  if (timer) clearTimeout(timer);
  timer = null;
};

const createPacket = (packet_number: number): Packet => {
  let packet: Packet = {
    data: "".padEnd(
      CONFIG.MESSAGE_LENGTH,
      CONFIG.ALPHABET.charAt(packet_number % CONFIG.ALPHABET.length)
    ),
    seq: packet_number,
    checksum: 0,
  };
  packet.checksum = calcChecksum(packet);
  packet = tryCorruptPacket(packet);
  return packet;
};

const send_packet = async (packet_number: number) => {
  let packet = createPacket(packet_number);
  Tracer(1, "\nSending " + packet_number + ": " + packet.data);
  if (Math.random() < CONFIG.LOSS_RATE) {
    Tracer(1, "packet " + packet_number + " lost");
  } else {
    Tracer(1, "packet " + packet_number + " sent");

    let time = 50;
    // let time = Math.floor(Math.random() * 50) + 50;
    if (Math.random() < CONFIG.DELAY_RATE) {
      Tracer(2, "packet " + packet_number + "'s reply will be delayed");
      time += Math.floor(Math.random() * 50);
    }

    if (packet.checksum != calcChecksum(packet)) {
      setTimeout(() => {
        Tracer(1, "packet " + packet_number + " corrupted");
        onNack(packet, packet_number);
      }, time);
    } else setTimeout(() => onAck(packet), time);
  }
  if (!timer) reset_timer();
};

const send_window = async () => {
  if (
    next_packet < window_start + CONFIG.WINDOW_SIZE &&
    next_packet < CONFIG.NUMBER_TO_SIMULATE
  )
    Tracer(
      2,
      "\n\nSending window " +
        next_packet +
        " to " +
        Math.min(
          CONFIG.NUMBER_TO_SIMULATE,
          window_start + CONFIG.WINDOW_SIZE - 1
        )
    );
  while (
    next_packet < window_start + CONFIG.WINDOW_SIZE &&
    next_packet < CONFIG.NUMBER_TO_SIMULATE
  ) {
    if (CONFIG.TRACING == 0 && next_packet > last_printed) {
      console.clear();
      console.log(
        Math.ceil(
          ((last_printed = next_packet) / CONFIG.NUMBER_TO_SIMULATE) * 100
        ) + "%"
      );
    }
    send_packet(next_packet);
    next_packet++;
  }
};

let last_printed = -1;
const main = async () => {
  console.time("Time taken");
  send_window();
};

const onAck = (packet: Packet) => {
  if (packet.seq !== window_start) {
    Tracer(1, "Ack received " + packet.seq + " but expected " + window_start);
    return;
  }
  Tracer(1, "Ack received " + window_start);
  window_start++;
  packets.push(packet);
  if (window_start === next_packet) stop_timer();
  else reset_timer();
  send_window();
  if (packets.length === CONFIG.NUMBER_TO_SIMULATE) {
    Tracer(0, "\n\nAll packets sent and received");
    Tracer(
      0,
      packets
        .map(
          (p) =>
            `${p.seq
              .toString()
              .padStart(CONFIG.NUMBER_TO_SIMULATE.toString().length, "0")} ${
              CONFIG.NUMBER_TO_SIMULATE > 62 &&
              p.seq % CONFIG.ALPHABET.length < 62
                ? p.data.replace(/./gi, (a) => a + " ")
                : p.data
            } ${p.checksum.toString().padStart(8, "0")}`
        )
        .join("\n")
    );
    console.timeEnd("Time taken");
    process.exit(0);
  }
};

const onNack = (packet: Packet, seq: number) => {
  Tracer(1, "Nack received (" + seq + ")");
  next_packet = window_start;
  reset_timer();
  send_window();
};

const onTimeout = () => {
  next_packet = window_start;
  Tracer(2, "Timeout, restarting from " + next_packet);
  reset_timer();
  send_window();
};

main();
