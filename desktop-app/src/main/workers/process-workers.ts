import { parentPort, workerData } from 'node:worker_threads'
import { appendFileSync, writeFileSync } from 'node:fs'

const { pid, description, filePath } = workerData as {
  pid: number
  description: string
  filePath: string
}

let progress = 0
writeFileSync(filePath, '') // crea el txt vacío

parentPort!.on('message', (msg: { type: 'turn'; quantum: number }) => {
  if (msg.type !== 'turn') return

  const end = Math.min(progress + msg.quantum, description.length)
  const chunk = description.slice(progress, end)
  //Esto es lo que escribe en el text
  appendFileSync(filePath, chunk)
  progress = end

  parentPort!.postMessage({
    pid,
    progress,
    chunk,
    finished: progress >= description.length
  })
})
