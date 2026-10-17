export type ProcessResponse = {
  total: number
  processList: {
    pid: number
    nombre: string
    descripcion: string
    usuario: string
    cpu: number
    memoria_mb: number
    prioridad: string
  }[]
}

export const dataExample: ProcessResponse = {
  total: 10,
  processList: [
    {
      pid: 0,
      nombre: 'System Idle Process',
      descripcion: 'Este proceso es System Idle Process.',
      usuario: 'NT AUTHORITY\\SYSTEM',
      cpu: 0,
      memoria_mb: 0.01,
      prioridad: 'Unknown'
    },
    {
      pid: 4,
      nombre: 'System',
      descripcion: 'Este proceso es System.',
      usuario: 'NT AUTHORITY\\SYSTEM',
      cpu: 0,
      memoria_mb: 2.68,
      prioridad: 'Unknown'
    },
    {
      pid: 1144,
      nombre: 'Code.exe',
      descripcion: 'Visual Studio Code',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 121.27,
      prioridad: 'Unknown'
    },
    {
      pid: 1676,
      nombre: 'Code.exe',
      descripcion: 'Visual Studio Code',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 127.6,
      prioridad: 'Unknown'
    },
    {
      pid: 1832,
      nombre: 'Code.exe',
      descripcion: 'Visual Studio Code',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 123.97,
      prioridad: 'Unknown'
    },
    {
      pid: 2028,
      nombre: 'Code.exe',
      descripcion: 'Visual Studio Code',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 136.03,
      prioridad: 'Unknown'
    },
    {
      pid: 2272,
      nombre: 'TranslucentTB.exe',
      descripcion: 'TranslucentTB',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 58.98,
      prioridad: 'Unknown'
    },
    {
      pid: 2360,
      nombre: 'cncmd.exe',
      descripcion: 'AMD Software Command Line Interface',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 0.49,
      prioridad: 'Unknown'
    },
    {
      pid: 3176,
      nombre: 'CrossDeviceResume.exe',
      descripcion: 'Este proceso es CrossDeviceResume.exe.',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 48.45,
      prioridad: 'Unknown'
    },
    {
      pid: 3916,
      nombre: 'conhost.exe',
      descripcion: 'Console Window Host',
      usuario: 'OSUDESKTOP\\ADMIN',
      cpu: 0,
      memoria_mb: 0.24,
      prioridad: 'Unknown'
    }
  ]
}
