import psutil
from api_server.lib.file_description import FileService

class ProcessService: 
    @staticmethod
    def getProcess(limit: int = 10): 
        process_list = []
        for process in psutil.process_iter(["pid", "name", "username","exe", "cpu_percent", "memory_percent"], ad_value=None):
            info = process.info

            process_list.append({
                "pid": info["pid"],
                "nombre": info["name"],
                "descripcion": FileService.get_description(info["exe"], info.get("name") or "desconocido"),
                "usuario": info["username"],
                "cpu": info["cpu_percent"],
                "mem": info["memory_percent"],
                "prioridad": "Unknown",
            })

            if len(process_list) >= limit:
                break

        return {
            "total": len(process_list),
            "processList": process_list,
        }