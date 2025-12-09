// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { synthesizeSpeech } from './geminiService';

// Mock values need to be defined inside vi.mock or imported
const mocks = vi.hoisted(() => {
  return {
    generateContent: vi.fn(),
  };
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mocks.generateContent
      };
      live = {
        connect: vi.fn()
      };
    }
  };
});

describe('geminiService - synthesizeSpeech', () => {
  let originalAudioContext: any;

  beforeEach(() => {
    originalAudioContext = window.AudioContext;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalAudioContext) {
        window.AudioContext = originalAudioContext;
    } else {
        delete (window as any).AudioContext;
    }
  });

  it('should successfully decode PCM audio using manual decoding logic', async () => {
    // 1. Mock AudioContext, createBuffer, and copyToChannel
    const mockCopyToChannel = vi.fn();
    const mockCreateBuffer = vi.fn().mockReturnValue({
      copyToChannel: mockCopyToChannel,
      length: 1,
      sampleRate: 24000,
      numberOfChannels: 1
    });

    const MockAudioContext = class {
      createBuffer = mockCreateBuffer;
      decodeAudioData = vi.fn(); // Should not be called
      close = vi.fn();
    };

    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = MockAudioContext;

    // 2. Mock GoogleGenAI response with some dummy data
    // "AAAAAA==" -> 4 bytes [0,0,0,0] -> 2 shorts [0,0]
    const base64PCM = "AAAAAA==";

    mocks.generateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              data: base64PCM
            }
          }]
        }
      }]
    });

    // 3. Run synthesizeSpeech
    const result = await synthesizeSpeech("Hello world");

    // 4. Verify assertions
    expect(mocks.generateContent).toHaveBeenCalled();
    expect(mockCreateBuffer).toHaveBeenCalledWith(1, expect.any(Number), 24000);
    expect(mockCopyToChannel).toHaveBeenCalled();

    // Should return the buffer created by createBuffer
    expect(result).toBeDefined();
    expect(result).toHaveProperty('copyToChannel');
  });
});
