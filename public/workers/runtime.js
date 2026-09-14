// Shared lifecycle for all pipeline workers. The loader is injected for testing.
export function createPipelineFactory(
  load,
  { gpu = globalThis.navigator?.gpu, report = () => {} } = {}
) {
  let instance = null
  let key = null
  let preference = 'auto'
  return {
    async getInstance(model, dtype = 'fp32', progress_callback = null, device) {
      if (device) preference = device
      const nextKey = JSON.stringify([model, dtype, preference])
      if (instance && key === nextKey) return instance
      await this.dispose()
      let adapter = null
      if (preference !== 'wasm') {
        try {
          adapter = await gpu?.requestAdapter()
        } catch {
          /* CPU remains available. */
        }
      }
      if (preference === 'webgpu' && !adapter) {
        throw new Error(
          'WebGPU is unavailable in this browser. Select CPU (WASM) or Auto and retry.'
        )
      }
      const devices =
        preference === 'auto'
          ? adapter
            ? ['webgpu', 'wasm']
            : ['wasm']
          : [preference]
      const failures = []
      for (const backend of devices) {
        try {
          instance = await load(model, {
            dtype,
            device: backend,
            progress_callback
          })
          key = nextKey
          report({
            status: 'runtime',
            output: { device: backend, fallback: failures.length > 0 }
          })
          return instance
        } catch (error) {
          failures.push(
            `${backend === 'wasm' ? 'CPU (WASM)' : 'WebGPU'}: ${error.message || error}`
          )
          if (backend === 'webgpu' && preference === 'auto') {
            progress_callback?.({
              status: 'fallback',
              message: 'WebGPU could not load this model. Trying CPU (WASM)…'
            })
          }
        }
      }
      throw new Error(failures.join('\n'))
    },
    async dispose() {
      const previous = instance
      instance = null
      key = null
      await previous?.dispose?.()
    }
  }
}

// Serialize jobs so batched image requests cannot race model loading or each other.
export function listen(handler) {
  let queue = Promise.resolve()
  self.addEventListener('message', (event) => {
    if (event.data.type === 'stop') return handler(event)
    queue = queue
      .then(async () => {
        if (event.data.type !== 'load') self.postMessage({ status: 'running' })
        await handler(event)
      })
      .catch((error) =>
        self.postMessage({
          status: 'error',
          output: String(error.message || error)
        })
      )
  })
}
