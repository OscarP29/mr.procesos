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
  private processes: RoundRobinProcess[] = []
  private queue: number[] = []
  private status: Status = 'idle'
  private looping = false
  private generation = 0
  private source: RoundRobinProcess[]
  private clock = 0
  private pending: number[] = []

  //Ruta en la que se guardan los los archivos
  private dir = join(app.getPath('userData'), 'round-robin')

  constructor(
    private win: BrowserWindow,
    private config: RoundRobinConfig,
    processes: RoundRobinProcess[]
  ) {
    this.source = processes
    this.init()
  }

  //Funciona como funcion contructura de la clase, tiene el estado inicial.
  private init(): void {
    const th = this.config.delay
    this.clock = 0
    this.processes = this.source.map((p) => ({
      ...p,
      state: 'ready',
      progress: 0,
      total: p.description.length,
      output: '',
      executions: 0,
      arrivalTime: (p.arrivalTime ?? 0) * th,
      burst: p.description.length * th,
      finishTime: null,
      turnaround: null
    }))
    this.pending = [...this.processes]
      .sort((a, b) => a.arrivalTime - b.arrivalTime)
      .map((p) => p.pid)
    this.queue = []
    this.admit()
  }

  // Pasa a la cola los procesos que ya llegaron según el reloj virtual
  private admit(): void {
    while (this.pending.length) {
      const p = this.processes.find((x) => x.pid === this.pending[0])!
      if (p.arrivalTime > this.clock) break
      this.queue.push(this.pending.shift()!)
    }
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
    this.init()
    this.emit()
  }

  private async loop(): Promise<void> {
    const gen = this.generation
    const th = this.config.delay
    this.looping = true
    try {
      while (this.status === 'running' && (this.queue.length > 0 || this.pending.length > 0)) {
        // CPU ociosa: salta el reloj hasta la próxima llegada
        if (this.queue.length === 0) {
          const next = this.processes.find((x) => x.pid === this.pending[0])!
          this.clock = next.arrivalTime
          this.admit()
        }

        const pid = this.queue.shift()!
        const p = this.processes.find((x) => x.pid === pid)!
        this.update(pid, { state: 'running', executions: p.executions + 1 })

        // No expulsivo: corre todo lo que le falta. Expulsivo: solo el quantum.
        const remaining = p.total - p.progress
        const chars = p.preemption === 1 ? remaining : Math.min(this.config.quantum, remaining)
        console.log(chars, 'Es no expulsivo?', p.preemption === 1)

        const result = await this.runTurn(pid, chars)
        if (gen !== this.generation) return

        // El proceso sigue en "running": se ve el progreso y el texto escrito
        this.update(pid, {
          progress: result.progress,
          output: p.output + result.chunk
        })

        // Dura lo que le toca: caracteres * TH
        await sleep(result.chunk.length * th)
        if (gen !== this.generation) return

        // Ahora sí termina el turno
        this.clock += result.chunk.length * th
        this.admit()

        this.update(pid, {
          state: result.finished ? 'finished' : 'ready',
          ...(result.finished
            ? { finishTime: this.clock, turnaround: this.clock - p.arrivalTime }
            : {})
        })
        if (!result.finished) this.queue.push(pid)

        await sleep(150)
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

  private runTurn(pid: number, quantum: number) {
    return new Promise<{ progress: number; chunk: string; finished: boolean }>(
      (resolve, reject) => {
        const w = this.workers.get(pid)!
        w.once('message', resolve)
        w.once('error', reject)
        w.postMessage({ type: 'turn', quantum })
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
