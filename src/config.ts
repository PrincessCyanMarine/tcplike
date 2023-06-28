export const DELAY_BETWEEN_MESSAGES = 0;
export const TIMEOUT = 100;
export const LOSS_RATE = 0.2;
export const CORRUPTION_RATE = 0.2;
export const TRACING: 0 | 1 | 2 = 2;
export const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
export const NUMBER_TO_SIMULATE = 10;
// export const NUMBER_TO_SIMULATE = ALPHABET.length;
// export const ALPHABET = "A";
export const MESSAGE_LENGTH = 16;
export var WINDOW_SIZE = 8;
export const DELAY_RATE = 0;

WINDOW_SIZE = Math.min(WINDOW_SIZE, NUMBER_TO_SIMULATE);
