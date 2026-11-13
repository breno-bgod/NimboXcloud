import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SessionOwner } from './session-owner.mjs';
function fixture(overrides = {}) {
  const calls = [];
  const adapters = Object.fromEntries(['nimbo-cloud', 'psbox'].map(id => [id, {
    async start() { calls.push(`${id}:start`); },
    async neutralizeInput() { calls.push(`${id}:neutral`); },
    async stop() { calls.push(`${id}:stop`); },
    ...overrides[id]
  }]));
  return { owner: new SessionOwner(adapters), calls };
}
test('uma sessão por vez e liberação de entrada antes de parar', async () => {
  const {owner, calls} = fixture();
  const first = await owner.start('nimbo-cloud');
  assert.equal(owner.acceptsInput('nimbo-cloud', first), true);
  await assert.rejects(owner.start('psbox'), /SESSION_OCCUPIED/);
  await owner.stop();
  const second = await owner.start('psbox');
  assert.equal(owner.acceptsInput('nimbo-cloud', first), false);
  assert.equal(owner.acceptsInput('psbox', first), false);
  assert.equal(owner.acceptsInput('psbox', second), true);
  assert.deepEqual(calls, ['nimbo-cloud:start','nimbo-cloud:neutral','nimbo-cloud:stop','psbox:start']);
});
test('início pendente não permite outro motor nem stop concorrente', async () => {
  let resolve;
  const {owner} = fixture({psbox:{start: () => new Promise(r => { resolve = r; })}});
  const pending = owner.start('psbox');
  assert.equal(owner.snapshot().state, 'starting');
  await assert.rejects(owner.start('nimbo-cloud'), /SESSION_OCCUPIED/);
  await assert.rejects(owner.stop(), /OPERATION_IN_PROGRESS/);
  resolve(); await pending;
});
test('falha de start limpa recursos sem expor mensagem do backend', async () => {
  const {owner, calls} = fixture({psbox:{async start(){throw new Error('PRIVATE_BACKEND_DETAIL');}}});
  await assert.rejects(owner.start('psbox'), /^Error: START_FAILED$/);
  assert.deepEqual(calls, ['psbox:neutral','psbox:stop']);
  assert.equal(owner.snapshot().engine, null);
  assert.ok(!JSON.stringify(owner.snapshot()).includes('PRIVATE'));
  await owner.start('nimbo-cloud');
});
test('stop falho retém propriedade e permite repetir parada', async () => {
  let attempts = 0;
  const {owner} = fixture({psbox:{async stop(){if(++attempts === 1) throw new Error('native');}}});
  const token = await owner.start('psbox');
  await assert.rejects(owner.stop(), /STOP_FAILED/);
  assert.equal(owner.snapshot().engine, 'psbox');
  assert.equal(owner.acceptsInput('psbox', token), false);
  await assert.rejects(owner.start('nimbo-cloud'), /SESSION_OCCUPIED/);
  await owner.stop(); assert.equal(owner.snapshot().state, 'idle');
});
test('start e cleanup falhos não liberam segundo motor', async () => {
  const {owner} = fixture({psbox:{async start(){throw 0;},async stop(){throw 0;}}});
  await assert.rejects(owner.start('psbox'), /STOP_FAILED/);
  await assert.rejects(owner.start('nimbo-cloud'), /SESSION_OCCUPIED/);
});
test('neutralização falha ainda tenta encerrar transporte e informa erro', async () => {
  const {owner,calls} = fixture({psbox:{async neutralizeInput(){throw 0;}}});
  await owner.start('psbox');
  await assert.rejects(owner.stop(), /INPUT_RELEASE_FAILED/);
  assert.deepEqual(calls,['psbox:start','psbox:stop']);
  assert.equal(owner.snapshot().engine,null);
});
test('motor desconhecido e adaptador incompleto recusados sem efeitos', async () => {
  const {owner,calls} = fixture();
  await assert.rejects(owner.start('arbitrary-native-method'), /UNKNOWN_ENGINE/);
  assert.deepEqual(calls,[]);
  assert.throws(() => new SessionOwner({}), /INVALID_ADAPTER/);
});
test('stop ocioso é idempotente e snapshots não são mutáveis', async () => {
  const {owner,calls} = fixture();
  await owner.stop(); await owner.stop();
  assert.deepEqual(calls,[]);
  assert.throws(() => {owner.snapshot().state = 'running';}, TypeError);
});
test('capacidades são explícitas e ausentes não habilitam entradas', () => {
  const {owner} = fixture({psbox:{capabilities:{controller:true,keyboardMouse:'yes',arbitrary:true}}});
  assert.deepEqual(owner.capabilities('psbox'),{controller:true,keyboardMouse:false,touch:false});
  assert.deepEqual(owner.capabilities('nimbo-cloud'),{controller:false,keyboardMouse:false,touch:false});
  assert.throws(() => owner.capabilities('other'), /UNKNOWN_ENGINE/);
});
