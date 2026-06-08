/**
 * 语音工具 - 录音和播放
 */

/**
 * 录制音频并返回 WAV base64
 * @param durationMs 录制时长（毫秒），默认 5000
 */
export async function recordAudio(durationMs = 5000): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const audioContext = new AudioContext({ sampleRate: 16000 })
  const source = audioContext.createMediaStreamSource(stream)
  const processor = audioContext.createScriptProcessor(4096, 1, 1)

  const chunks: Float32Array[] = []

  return new Promise<string>((resolve, reject) => {
    processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0)
      chunks.push(new Float32Array(data))
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

    // 设置录制时长
    const timeout = setTimeout(() => {
      processor.disconnect()
      source.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      audioContext.close()

      // 合并音频数据
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
      const merged = new Float32Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        merged.set(chunk, offset)
        offset += chunk.length
      }

      // 转换为 WAV base64
      const wavBase64 = float32ToWavBase64(merged, audioContext.sampleRate)
      resolve(wavBase64)
    }, durationMs)

    // 提前停止
    ;(window as any).__stopRecording = () => {
      clearTimeout(timeout)
      processor.disconnect()
      source.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      audioContext.close()

      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
      const merged = new Float32Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        merged.set(chunk, offset)
        offset += chunk.length
      }

      const wavBase64 = float32ToWavBase64(merged, audioContext.sampleRate)
      resolve(wavBase64)
    }
  })
}

/**
 * 停止当前录音
 */
export function stopRecording(): void {
  if ((window as any).__stopRecording) {
    ;(window as any).__stopRecording()
    delete (window as any).__stopRecording
  }
}

/**
 * Float32Array 转 WAV base64
 */
function float32ToWavBase64(samples: Float32Array, sampleRate: number): string {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = samples.length * (bitsPerSample / 8)
  const headerSize = 44
  const buffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(buffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // 写入音频数据
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  // 转 base64
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

/**
 * 播放 base64 编码的 PCM16 音频（24kHz）
 */
export async function playPcm16Audio(base64Data: string): Promise<void> {
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // PCM16 转 Float32
  const int16 = new Int16Array(bytes.buffer)
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0
  }

  // 使用 AudioContext 播放
  const audioContext = new AudioContext({ sampleRate: 24000 })
  const audioBuffer = audioContext.createBuffer(1, float32.length, 24000)
  audioBuffer.getChannelData(0).set(float32)

  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioContext.destination)

  return new Promise<void>((resolve) => {
    source.onended = () => {
      audioContext.close()
      resolve()
    }
    source.start()
  })
}
