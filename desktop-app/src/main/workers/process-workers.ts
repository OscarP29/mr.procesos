import { parentPort, workerData } from 'node:worker_threads'
import { appendFileSync, writeFileSync } from 'node:fs'

interface WorkerData {
  pid: number
  descripcion: string
  filePath: string
}
const { pid, descripcion, filePath } = workerData as WorkerData

let progress = 0

writeFileSync(filePath, '', 'utf-8')

parentPort?.on('message', (message) => {
  if (message.type !== 'execute') return

  const quantum: number = message.quantum

  let executed = 0

  while (executed < quantum && progress < descripcion.length) {
    const character = descripcion[progress]

    appendFileSync(filePath, character, 'utf-8')

    progress++
    executed++

    parentPort?.postMessage({
      type: 'progress',
      pid,
      progress,
      total: descripcion.length,
      character
    })
  }

  parentPort?.postMessage({
    type: 'turn-completed',
    pid,
    progress,
    finished: progress >= descripcion.length
  })
})
