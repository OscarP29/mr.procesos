import { Worker } from 'node:worker_threads'
import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

import type { RoundRobinProcess, RoundRobinConfig } from '../types-round-robin'

export class RoundRobinService {
  private processes: RoundRobinProcess[] = []

  private workers = new Map<number, Worker>()

  private config: RoundRobinConfig

  private window: BrowserWindow

  private running = false

  constructor(window: BrowserWindow, config: RoundRobinConfig) {
    this.window = window
    this.config = config
  }

  async start(processes: RoundRobinProcess[]) {
    if (this.running) {
      throw new Error('Round Robin ya está ejecutándose')
    }

    this.running = true

    this.processes = processes.map((process) => ({
      ...process,
      status: 'ready',
      progress: 0,
      total: process.descripcion.length,
      output: ''
    }))

    const outputDir = join(app.getPath('userData'), 'round-robin')

    mkdirSync(outputDir, { recursive: true })

    const workerPath = join(__dirname, '../workers/process.worker.js')

    try {
      for (const process of this.processes) {
        const worker = new Worker(workerPath, {
          workerData: {
            pid: process.pid,
            descripcion: process.descripcion,
            filePath: join(outputDir, `${process.pid}.txt`)
          }
        })

        this.workers.set(process.pid, worker)
      }

      this.emitUpdate()

      // Cola de procesos
      const queue = [...this.processes]

      while (queue.length > 0 && this.running) {
        const process = queue.shift()!

        process.status = 'running'

        this.emitUpdate()

        await this.executeTurn(process)

        if (process.progress >= process.total) {
          process.status = 'finished'
        } else {
          process.status = 'ready'
          queue.push(process)
        }

        this.emitUpdate()

        await this.sleep(this.config.delay)
      }
    } finally {
      this.running = false

      await Promise.all([...this.workers.values()].map((worker) => worker.terminate()))

      this.workers.clear()
    }
  }

  private executeTurn(process: RoundRobinProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = this.workers.get(process.pid)

      if (!worker) {
        reject(new Error('Worker no encontrado'))
        return
      }

      const cleanup = () => {
        worker.off('message', onMessage)
        worker.off('error', onError)
        worker.off('exit', onExit)
      }

      const onError = (error: Error) => {
        cleanup()
        reject(error)
      }

      const onExit = (code: number) => {
        cleanup()
        reject(new Error(`Worker finalizó con código ${code}`))
      }

      const onMessage = (message: { type: string; character?: string; progress?: number }) => {
        if (message.type === 'progress') {
          process.output += message.character ?? ''
          process.progress = message.progress ?? process.progress

          this.emitUpdate()
        }

        if (message.type === 'turn-completed') {
          cleanup()
          resolve()
        }
      }

      worker.on('message', onMessage)
      worker.once('error', onError)
      worker.once('exit', onExit)

      worker.postMessage({
        type: 'execute',
        quantum: this.config.quantum
      })
    })
  }

  private emitUpdate() {
    if (!this.window.isDestroyed()) {
      this.window.webContents.send(
        'round-robin:update',
        this.processes.map((process) => ({ ...process }))
      )
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
