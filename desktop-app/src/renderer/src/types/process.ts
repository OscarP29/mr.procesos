export type ProcessPriority = 0 | 1
export type ProcessResponse = {
  total: number
  processList: {
    pid: number
    name: string
    description: string
    user: string
    cpu: number
    memory_mb: number
    preemption: ProcessPriority
  }[]
}

export const dataExample: ProcessResponse = {
  total: 10,
  processList: [
    {
      pid: 0,
      name: 'System Idle Process',
      description: 'Este proceso es System Idle Process.',
      user: 'NT AUTHORITY\\SYSTEM',
      cpu: 0,
      memory_mb: 0.01,
      preemption: 1
    },
    {
      pid: 4,
      name: 'System',
      description: 'Este proceso es System.',
      user: 'NT AUTHORITY\\SYSTEM',
      cpu: 0,
      memory_mb: 2.68,
      preemption: 1
    },
    {
      pid: 1144,
      name: 'Code.exe',
      description: 'Visual Studio Code',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 121.27,
      preemption: 1
    },
    {
      pid: 1676,
      name: 'Code.exe',
      description: 'Visual Studio Code',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 127.6,
      preemption: 1
    },
    {
      pid: 1832,
      name: 'Code.exe',
      description: 'Visual Studio Code',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 123.97,
      preemption: 1
    },
    {
      pid: 2028,
      name: 'Code.exe',
      description: 'Visual Studio Code',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 136.03,
      preemption: 1
    },
    {
      pid: 2272,
      name: 'TranslucentTB.exe',
      description: 'TranslucentTB',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 58.98,
      preemption: 1
    },
    {
      pid: 2360,
      name: 'cncmd.exe',
      description: 'AMD Software Command Line Interface',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 0.49,
      preemption: 1
    },
    {
      pid: 3176,
      name: 'CrossDeviceResume.exe',
      description: 'Este proceso es CrossDeviceResume.exe.',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 48.45,
      preemption: 1
    },
    {
      pid: 3916,
      name: 'conhost.exe',
      description: 'Console Window Host',
      user: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memory_mb: 0.24,
      preemption: 1
    }
  ]
}
