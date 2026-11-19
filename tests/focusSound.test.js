import test from 'node:test';
import assert from 'node:assert/strict';
import { makeNoise, createFocusSound } from '../src/lib/focusSound.js';

test('focus sounds produce finite, loopable samples', () => {
  for (const type of ['white', 'pink', 'brown']) {
    let seed = 12;
    const data = makeNoise(type, 2048, () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; });
    assert.equal(data.length, 2048);
    assert.ok(data.every(Number.isFinite));
    assert.ok(data.some((sample) => sample !== 0));
    assert.ok(Math.abs(data[0] - data[data.length - 1]) < 0.00001);
  }
  assert.throws(() => makeNoise('rain', 10), /Unknown/);
});

test('stopping a pending sound prevents it from starting', async () => {
  let resume, started = false;
  class AudioContext {
    sampleRate = 100;
    destination = {};
    createGain() { return { connect() {}, gain: { value: 0 } }; }
    resume() { return new Promise((resolve) => { resume = resolve; }); }
    createBuffer() { return { length: 800, copyToChannel() {} }; }
    createBufferSource() { return { connect() {}, start() { started = true; }, stop() {}, disconnect() {} }; }
  }
  const old = globalThis.window;
  globalThis.window = { AudioContext };
  try {
    const sound = createFocusSound();
    const play = sound.play('white', 0.25);
    sound.stop();
    resume();
    assert.equal(await play, false);
    assert.equal(started, false);
  } finally { globalThis.window = old; }
});

test('focus sound starts, adjusts volume and stops', async () => {
  let started = 0, stopped = 0, gain;
  class AudioContext {
    sampleRate = 100;
    destination = {};
    createGain() { gain = { connect() {}, gain: { value: 0 } }; return gain; }
    async resume() {}
    createBuffer() { return { length: 800, copyToChannel() {} }; }
    createBufferSource() { return { connect() {}, start() { started++; }, stop() { stopped++; }, disconnect() {} }; }
  }
  const old = globalThis.window;
  globalThis.window = { AudioContext };
  try {
    const sound = createFocusSound();
    assert.equal(await sound.play('pink', 0.25), true);
    assert.equal(started, 1);
    assert.equal(gain.gain.value, 0.25);
    sound.setVolume(0.5);
    assert.equal(gain.gain.value, 0.5);
    sound.stop();
    assert.equal(stopped, 1);
  } finally { globalThis.window = old; }
});
