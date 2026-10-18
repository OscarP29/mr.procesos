import { app, BrowserWindow } from 'electron'
import { Worker } from 'node:worker_threads'
import { join } from 'node:path'
import { mkdirSync, rmSync } from 'node:fs'
// ?modulePath hace que electron-vite compile el worker y te dé la ruta correcta
// tanto en desarrollo como en build
import workerPath from '../workers/process-workers?modulePath'
import type { RoundRobinProcess, RoundRobinConfig } from '../types-round-robin'

type Status = 'idle' | 'running' | 'paused' | 'finished'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class RoundRobinService {
  private workers = new Map<number, Worker>()
  private processes: RoundRobinProcess[]
  private queue: number[]
  private status: Status = 'idle'
  private looping = false
  private generation = 0
  private dir = join(app.getPath('userData'), 'round-robin')

  constructor(
    private win: BrowserWindow,
    private config: RoundRobinConfig,
    processes: RoundRobinProcess[]
  ) {
    this.processes = processes.map((p) => ({
      ...p,
      state: 'ready',
      progress: 0,
      total: p.description.length,
      executions: 0,
      output: ''
    }))
    this.queue = this.processes.map((p) => p.pid)
  }

  start() {
    if (this.status !== 'idle') return
    rmSync(this.dir, { recursive: true, force: true })
    mkdirSync(this.dir, { recursive: true })

    for (const p of this.processes) {
      this.workers.set(
        p.pid,
        new Worker(workerPath, {
          workerData: {
            pid: p.pid,
            description: p.description,
            filePath: join(this.dir, `${p.pid}.txt`)
          }
        })
      )
    }
    this.status = 'running'
    this.emit()
    void this.loop()
  }

  pause() {
    if (this.status !== 'running') return
    this.status = 'paused'
    this.emit()
  }

  resume() {
    if (this.status !== 'paused') return
    this.status = 'running'
    this.emit()
    if (!this.looping) void this.loop()
  }

  reset() {
    this.generation++ // invalida cualquier loop en curso
    this.status = 'idle'
    this.killWorkers()
    rmSync(this.dir, { recursive: true, force: true })
    this.processes = this.processes.map((p) => ({
      ...p,
      state: 'ready',
      progress: 0,
      output: '',
      executions: 0
    }))
    this.queue = this.processes.map((p) => p.pid)
    this.emit()
  }

  private async loop() {
    const gen = this.generation
    this.looping = true
    try {
      while (this.status === 'running' && this.queue.length > 0) {
        const pid = this.queue.shift()!
        const current = this.processes.find((x) => x.pid === pid)!
        this.update(pid, { state: 'running', executions: current.executions + 1 })

        const result = await this.runTurn(pid)
        if (gen !== this.generation) return // hubo reset

        const p = this.processes.find((x) => x.pid === pid)!
        this.update(pid, {
          progress: result.progress,
          output: p.output + result.chunk,
          state: result.finished ? 'finished' : 'ready'
        })
        if (!result.finished) this.queue.push(pid)

        await sleep(this.config.delay)
        if (gen !== this.generation) return
      }

      if (this.status === 'running') {
        this.status = 'finished'
        this.killWorkers()
        this.emit()
      }
    } finally {
      this.looping = false
    }
  }

  private runTurn(pid: number) {
    return new Promise<{ progress: number; chunk: string; finished: boolean }>(
      (resolve, reject) => {
        const w = this.workers.get(pid)!
        w.once('message', resolve)
        w.once('error', reject)
        w.postMessage({ type: 'turn', quantum: this.config.quantum })
      }
    )
  }

  private update(pid: number, patch: Partial<RoundRobinProcess>) {
    this.processes = this.processes.map((p) => (p.pid === pid ? { ...p, ...patch } : p))
    this.emit()
  }

  private killWorkers() {
    this.workers.forEach((w) => w.terminate())
    this.workers.clear()
  }

  private emit() {
    if (this.win.isDestroyed()) return
    this.win.webContents.send('round-robin:update', {
      processes: this.processes,
      status: this.status
    })
  }
}
