import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, Square, Download, Eraser, Loader2, Volume2 } from 'lucide-react'

interface AudioPlayerProps {
  audio: Float32Array
  samplingRate: number
  text: string
  index: number
}

function createWavBuffer(
  audioData: Float32Array,
  sampleRate: number
): ArrayBuffer {
  const length = audioData.length
  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length * 2, true)

  // Convert float32 to int16
  let offset = 44
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return buffer
}

interface CustomAudioVisualizerProps {
  audio: Float32Array
  isPlaying: boolean
  currentTime: number
  duration: number
  height?: number
}

function CustomAudioVisualizer({
  audio,
  isPlaying,
  currentTime,
  duration,
  height = 80
}: CustomAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Memoize expensive calculations with smoothing
  const waveformData = useMemo(() => {
    if (!audio || audio.length === 0) return []

    const samples = Math.min(audio.length, 1600) // Fixed high resolution
    const step = audio.length / samples
    const data = []

    for (let i = 0; i < samples; i++) {
      const sample = Math.abs(audio[Math.floor(i * step)])
      data.push(sample)
    }

    // Apply smoothing filter
    const smoothedData = []
    const smoothingWindow = 3
    for (let i = 0; i < data.length; i++) {
      let sum = 0
      let count = 0
      for (
        let j = Math.max(0, i - smoothingWindow);
        j <= Math.min(data.length - 1, i + smoothingWindow);
        j++
      ) {
        sum += data[j]
        count++
      }
      smoothedData.push(sum / count)
    }

    return smoothedData
  }, [audio])

  // Add resize observer for true responsiveness
  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(container)
    setContainerWidth(container.getBoundingClientRect().width)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || waveformData.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use state-tracked container width for responsive behavior
    const displayWidth = containerWidth
    const displayHeight = height

    // Set high DPI for sharper rendering
    const dpr = window.devicePixelRatio || 1

    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    ctx.scale(dpr, dpr)

    const samples = waveformData.length

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // Enable smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw waveform bars with full width and logarithmic scaling
    const actualBars = Math.min(samples, displayWidth) // Use full width
    const barWidth = displayWidth / actualBars
    const gap = Math.max(0, barWidth * 0.1)
    const effectiveBarWidth = Math.max(1, barWidth - gap)

    for (let i = 0; i < actualBars; i++) {
      const x = i * barWidth
      const dataIndex = Math.floor((i / actualBars) * samples)
      const sample = waveformData[dataIndex] || 0

      // Logarithmic scaling for better speech visualization
      // This makes quiet sounds (silence) very small and speech much more prominent
      const minThreshold = 0.01 // Silence threshold
      const logSample =
        sample > minThreshold
          ? Math.log10(sample * 9 + 1) // Log scale: log10(sample * 9 + 1) ranges from 0 to 1
          : sample * 0.1 // Very quiet for near-silence

      const amplified = Math.pow(logSample * 3, 1.5) // Further emphasize speech
      const barHeight = Math.max(2, amplified * displayHeight * 0.9)

      const y = (displayHeight - barHeight) / 2

      let barColor = '#6B7280'
      if (duration > 0) {
        const timePosition = (i / actualBars) * duration
        if (isPlaying && timePosition <= currentTime) {
          barColor = '#3B82F6'
        } else if (isPlaying) {
          barColor = '#9CA3AF'
        }
      }

      ctx.fillStyle = barColor
      ctx.fillRect(x, y, effectiveBarWidth, barHeight)

      // Optional: Add rounded corners if supported
      if (typeof ctx.roundRect === 'function') {
        ctx.clearRect(x, y, effectiveBarWidth, barHeight)
        ctx.beginPath()
        const radius = Math.min(effectiveBarWidth / 4, 2)
        ctx.roundRect(x, y, effectiveBarWidth, barHeight, radius)
        ctx.fill()
      }
    }

    // Draw progress line with gradient
    if (isPlaying && duration > 0 && currentTime >= 0) {
      const progressX = Math.min(
        (currentTime / duration) * displayWidth,
        displayWidth
      )

      // Create gradient for progress line
      const gradient = ctx.createLinearGradient(0, 0, 0, displayHeight)
      gradient.addColorStop(0, '#EF4444')
      gradient.addColorStop(0.5, '#DC2626')
      gradient.addColorStop(1, '#EF4444')

      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(progressX, 4)
      ctx.lineTo(progressX, displayHeight - 4)
      ctx.stroke()
    }
  }, [waveformData, isPlaying, currentTime, duration, height, containerWidth])

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{
          width: '100%',
          height: `${height}px`,
          maxWidth: '100%',
          display: 'block'
        }}
      />
    </div>
  )
}

function AudioPlayer({ audio, samplingRate, text, index }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const visualizerRef = useRef<HTMLCanvasElement>(null)

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  const playAudio = useCallback(async () => {
    if (!audio || audio.length === 0) return

    // Stop current audio if playing
    if (isPlaying) {
      stopAudio()
      return
    }

    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      // Create audio buffer
      const audioBuffer = audioContext.createBuffer(
        1,
        audio.length,
        samplingRate
      )
      audioBuffer.getChannelData(0).set(audio)

      // Create audio source
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      sourceRef.current = source

      const audioDuration = audio.length / samplingRate
      setDuration(audioDuration)
      setIsPlaying(true)
      startTimeRef.current = audioContext.currentTime

      // Update current time during playback
      const updateTime = () => {
        if (sourceRef.current && audioContextRef.current) {
          const elapsed =
            audioContextRef.current.currentTime - startTimeRef.current
          const newCurrentTime = Math.min(elapsed, audioDuration)
          setCurrentTime(newCurrentTime)

          if (elapsed < audioDuration) {
            animationFrameRef.current = requestAnimationFrame(updateTime)
          } else {
            // Audio finished naturally
            setIsPlaying(false)
            setCurrentTime(0)
            sourceRef.current = null
            animationFrameRef.current = null
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateTime)

      source.onended = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        setIsPlaying(false)
        setCurrentTime(0)
        sourceRef.current = null
      }

      source.start()
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [audio, samplingRate, isPlaying, stopAudio])

  // Cleanup animation frame on component unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const downloadAudio = useCallback(() => {
    if (!audio || audio.length === 0) return

    try {
      const wavBuffer = createWavBuffer(audio, samplingRate)
      const blob = new Blob([wavBuffer], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `tts-output-${index + 1}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading audio:', error)
    }
  }, [audio, samplingRate, index])

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="mb-3">
        <p className="text-sm text-gray-700 font-medium mb-2">Prompt:</p>
        <p className="text-sm text-gray-600 italic bg-white p-2 rounded border">
          "{text}"
        </p>
      </div>

      <div className="mb-3">
        <div className="w-full border border-gray-200 rounded bg-gray-50 overflow-hidden">
          {audio && audio.length > 0 ? (
            <CustomAudioVisualizer
              audio={audio}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              height={80}
            />
          ) : (
            <div className="w-full h-20 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Loading waveform...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={playAudio}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play
            </>
          )}
        </button>
        <button
          onClick={downloadAudio}
          className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        {duration > 0 && (
          <span className="text-xs text-gray-500 ml-2">
            {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  )
}

export default AudioPlayer
