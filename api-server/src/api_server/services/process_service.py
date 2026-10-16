import psutil
from api_server.lib.file_description import FileService

class ProcessService: 
    @staticmethod
    def getProcess(limit: int = 10): 
        process_list = []
        for process in psutil.process_iter(["pid", "name", "username","exe", "cpu_percent", "memory_info"], ad_value=None):
            info = process.info
            username = info.get("username")
            if not username or username.strip().casefold() == "unknown":
                continue

            memory_info = info.get("memory_info")

            process_list.append({
                "pid": info["pid"],
                "nombre": info["name"],
                "descripcion": FileService.get_description(info["exe"], info.get("name") or "desconocido"),
                "usuario": username,
                "cpu": info["cpu_percent"],
                "memoria_mb": round(memory_info.rss / (1024 ** 2), 2) if memory_info else None,
                "prioridad": "Unknown",
            })

            if len(process_list) >= limit:
                break

        return {
            "total": len(process_list),
            "processList": process_list,
        }