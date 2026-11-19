export function makeNoise(type, length, random = Math.random) {
  if (!['white', 'pink', 'brown'].includes(type)) throw new Error('Unknown focus sound');
  const samples = new Float32Array(length);
  let brown = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = random() * 2 - 1;
    if (type === 'white') samples[i] = white * 0.35;
    else if (type === 'brown') {
      brown = (brown + 0.02 * white) / 1.02;
      samples[i] = brown * 1.8;
    } else {
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      samples[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }
  }
  // Match the endpoints so the looping buffer does not click.
  const fade = Math.min(256, Math.floor(length / 2));
  const difference = length ? samples[0] - samples[length - 1] : 0;
  for (let i = 0; i < fade; i++) {
    samples[length - fade + i] += difference * ((i + 1) / fade);
  }
  return samples;
}

export function createFocusSound() {
  let context, gain, source, generation = 0;
  return {
    async play(type, volume) {
      this.stop();
      const current = generation;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Focus sounds are not supported in this browser.');
      if (!context) { context = new AudioContext(); gain = context.createGain(); gain.connect(context.destination); }
      await context.resume();
      if (current !== generation) return false;
      const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
      buffer.copyToChannel(makeNoise(type, buffer.length), 0);
      source = context.createBufferSource();
      source.buffer = buffer; source.loop = true; source.connect(gain);
      gain.gain.value = volume;
      source.start();
      return true;
    },
    setVolume(volume) { if (gain) gain.gain.value = volume; },
    stop() { generation++; if (source) { source.stop(); source.disconnect(); source = null; } },
  };
}
