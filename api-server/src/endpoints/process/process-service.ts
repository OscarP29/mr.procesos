import sys from "systeminformation";

export const ProcessService = {
  async getProcess(limit: number = 10) {
    const { list } = await sys.processes();

    const processList = list.slice(0, limit).map((process) => ({
      pid: process.pid,
      nombre: process.name,
      usuario: process.user,
      cpu: process.cpu,
      mem: process.mem,
      prioridad: "Unknown",
    }));

    return {
      total: processList.length,
      processList,
    };
  },
};
