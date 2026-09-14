import { QuantizationType } from '../types'

// Match the suffix, since component names can contain underscores (decoder_model_merged).
const suffixes: [string, QuantizationType][] = [
  ['_q4f16', 'q4f16'],
  ['_quantized', 'q8'],
  ['_uint8', 'uint8'],
  ['_q2f16', 'q2f16'],
  ['_q1f16', 'q1f16'],
  ['_q2', 'q2'],
  ['_q1', 'q1'],
  ['_int8', 'int8'],
  ['_fp16', 'fp16'],
  ['_bnb4', 'bnb4'],
  ['_q4', 'q4']
]
export function getQuantizations(files: string[]): QuantizationType[] {
  const components = new Map<string, Set<QuantizationType>>()
  for (const file of files.filter(
    (name) => name.startsWith('onnx/') && name.endsWith('.onnx')
  )) {
    const stem = file.slice(5, -5)
    const suffix = suffixes.find(([ending]) => stem.endsWith(ending))
    const component = suffix ? stem.slice(0, -suffix[0].length) : stem
    // Ignore hardware-specific/optimized exports the pipeline cannot select by dtype.
    if (/_O[1-4]$|_q?u?int8_/.test(component)) continue
    const dtype = suffix?.[1] ?? 'fp32'
    if (!components.has(component)) components.set(component, new Set())
    components.get(component)!.add(dtype)
  }
  // Only offer a global dtype when every component has that export.
  const variants = [...components.values()]
  return variants.length
    ? [...variants[0]].filter((dtype) =>
        variants.every((set) => set.has(dtype))
      )
    : []
}

export function defaultQuantization(
  variants: QuantizationType[]
): QuantizationType {
  return (
    (
      [
        'q8',
        'int8',
        'uint8',
        'q4',
        'fp32',
        'fp16',
        'q4f16',
        'bnb4',
        'q2',
        'q2f16',
        'q1',
        'q1f16'
      ] as QuantizationType[]
    ).find((dtype) => variants.includes(dtype)) ?? 'fp32'
  )
}
