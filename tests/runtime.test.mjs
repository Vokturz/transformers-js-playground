import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { createPipelineFactory } from '../public/workers/runtime.js'

const source = await readFile(
  new URL('../src/lib/modelFiles.ts', import.meta.url),
  'utf8'
)
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext
  }
}).outputText
const { getQuantizations, defaultQuantization } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

test('ONNX precision discovery matches suffixes and requires all components', () => {
  assert.deepEqual(
    getQuantizations([
      'onnx/model.onnx',
      'onnx/model_quantized.onnx',
      'onnx/model_q4f16.onnx'
    ]),
    ['fp32', 'q8', 'q4f16']
  )
  assert.deepEqual(
    getQuantizations([
      'onnx/encoder_model.onnx',
      'onnx/encoder_model_quantized.onnx',
      'onnx/decoder_model_merged_quantized.onnx'
    ]),
    ['q8']
  )
  assert.deepEqual(
    getQuantizations([
      'onnx/model_quantized.onnx',
      'onnx/model_O3.onnx',
      'onnx/model_qint8_avx512.onnx'
    ]),
    ['q8']
  )
  assert.deepEqual(getQuantizations(['onnx/model_q1f16.onnx']), ['q1f16'])
  assert.equal(defaultQuantization(['fp16']), 'fp16')
  assert.equal(defaultQuantization(['fp32', 'q8']), 'q8')
})

test('without a GPU, Auto loads WASM once and reuses the model', async () => {
  const calls = [],
    reports = []
  const instance = {}
  const factory = createPipelineFactory(
    async (model, options) => {
      calls.push(options)
      return instance
    },
    { gpu: null, report: (event) => reports.push(event) }
  )
  assert.equal(await factory.getInstance('tiny', 'q8'), instance)
  assert.equal(await factory.getInstance('tiny', 'q8'), instance)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].device, 'wasm')
  assert.equal(reports[0].output.device, 'wasm')
})

test('Auto falls back after a GPU failure, but explicit GPU never silently changes backend', async () => {
  const calls = []
  const factory = createPipelineFactory(
    async (model, options) => {
      calls.push(options.device)
      if (options.device === 'webgpu') throw new Error('Unsupported operator')
      return {}
    },
    { gpu: { requestAdapter: async () => ({}) } }
  )
  await factory.getInstance('tiny', 'q8')
  assert.deepEqual(calls, ['webgpu', 'wasm'])
  await assert.rejects(
    factory.getInstance('tiny', 'q8', null, 'webgpu'),
    /Unsupported operator/
  )
  assert.deepEqual(calls, ['webgpu', 'wasm', 'webgpu'])
})

test('missing GPU produces actionable error and model failures remain retryable', async () => {
  let attempts = 0
  const factory = createPipelineFactory(
    async () => {
      if (++attempts === 1) throw new Error('Download interrupted')
      return {}
    },
    { gpu: null }
  )
  await assert.rejects(
    factory.getInstance('tiny', 'q8', null, 'webgpu'),
    /Select CPU/
  )
  assert.equal(attempts, 0)
  await assert.rejects(
    factory.getInstance('tiny', 'q8', null, 'wasm'),
    /Download interrupted/
  )
  await factory.getInstance('tiny', 'q8')
  assert.equal(attempts, 2)
})

test('precision, model and backend changes dispose the old session', async () => {
  let disposed = 0,
    loaded = 0
  const factory = createPipelineFactory(
    async () => {
      loaded++
      return {
        dispose: async () => {
          disposed++
        }
      }
    },
    { gpu: null }
  )
  await factory.getInstance('one', 'q8')
  await factory.getInstance('one', 'fp32')
  await factory.getInstance('two', 'fp32')
  await factory.getInstance('two', 'fp32', null, 'wasm')
  assert.equal(loaded, 4)
  assert.equal(disposed, 3)
  await factory.dispose()
  assert.equal(disposed, 4)
})

// Evaluate the real worker handlers with a fake inference engine, without downloading models.
async function workerHarness(task, inference) {
  const events = [],
    calls = []
  let handler
  class InterruptableStoppingCriteria {
    interrupt() {
      this.interrupted = true
    }
    reset() {
      this.interrupted = false
    }
  }
  const context = vm.createContext({
    pipeline: async (task, model, options) => {
      calls.push({ task, model, options })
      return inference
    },
    createPipelineFactory,
    InterruptableStoppingCriteria,
    listen: (callback) => {
      handler = callback
    },
    self: { postMessage: (event) => events.push(event) },
    console
  })
  const worker = (
    await readFile(
      new URL(`../public/workers/${task}.js`, import.meta.url),
      'utf8'
    )
  ).replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"];?$/gm, '')
  vm.runInContext(worker, context)
  return { events, calls, send: (data) => handler({ data }) }
}

test('generation forwards top_k/top_p and uses stopping criteria', async () => {
  let options
  const harness = await workerHarness(
    'text-generation',
    async (input, config) => {
      options = config
      return { generated_text: 'Hello world' }
    }
  )
  await harness.send({
    type: 'load',
    model: 'tiny',
    dtype: 'q8',
    device: 'wasm'
  })
  await harness.send({
    type: 'generate',
    model: 'tiny',
    dtype: 'q8',
    prompt: 'Hello',
    config: { top_k: 5, top_p: 0.8, temperature: 0 }
  })
  assert.equal(options.top_k, 5)
  assert.equal(options.top_p, 0.8)
  assert.equal(options.temperature, 0)
  assert.ok(options.stopping_criteria)
  assert.equal(harness.calls.length, 1)
  assert.equal(
    harness.events.find((event) => event.status === 'output').output.content,
    'Hello world'
  )
})

test('image readiness follows loading, output retains image ID, errors are not overwritten by ready', async () => {
  const harness = await workerHarness('image-classification', async (image) => {
    if (image === 'broken') throw new Error('Image could not decode')
    return [{ label: 'cat', score: 0.9 }]
  })
  assert.equal(harness.events.length, 0)
  await harness.send({ type: 'load', model: 'tiny', device: 'wasm' })
  await harness.send({
    type: 'classify',
    model: 'tiny',
    image: 'valid',
    exampleId: 'image-2'
  })
  assert.equal(
    harness.events.find((event) => event.status === 'output').output.exampleId,
    'image-2'
  )
  await harness.send({ type: 'classify', model: 'tiny', image: 'broken' })
  assert.equal(harness.events.at(-1).status, 'error')
})

test('embedding failures remain visible instead of ending in a misleading ready state', async () => {
  const harness = await workerHarness('feature-extraction', async () => {
    throw new Error('Unsupported pooling')
  })
  await harness.send({
    type: 'extract',
    model: 'tiny',
    device: 'wasm',
    texts: ['Hello'],
    config: {}
  })
  assert.equal(harness.events.at(-1).status, 'error')
  assert.match(harness.events.at(-1).output, /Unsupported pooling/)
  assert.equal(
    harness.events.find((event) => event.status === 'output').output
      .embeddings[0].embedding,
    null
  )
})
