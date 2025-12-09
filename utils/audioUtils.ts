/**
 * Decodes 16-bit PCM 24kHz audio data (typically from Gemini API) into an AudioBuffer.
 *
 * @param base64 The base64 encoded audio string.
 * @param ctx The AudioContext to use for creating the buffer.
 * @returns An AudioBuffer containing the decoded audio.
 */
export const decodePCM16 = (base64: string, ctx: AudioContext): AudioBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataInt16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(dataInt16.length);
  for(let i=0; i<dataInt16.length; i++) {
      float32[i] = dataInt16[i] / 32768.0;
  }

  // Create buffer: 1 channel, length matches sample count, 24kHz sample rate
  const buffer = ctx.createBuffer(1, float32.length, 24000);
  buffer.copyToChannel(float32, 0);
  return buffer;
};
