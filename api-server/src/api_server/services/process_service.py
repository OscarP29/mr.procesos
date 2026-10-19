import psutil

from api_server.lib.file_description import FileService
from api_server.lib.process_classifier import ProcessClassifier
from api_server.models.catalog_model import Preemption


class ProcessService:
    @staticmethod
    def getProcess(limit: int = 10):
        process_list = []
        for process in psutil.process_iter(
            ["pid", "name", "username", "exe", "cpu_percent", "memory_info"], ad_value=None
        ):
            info = process.info
            username = info.get("username")
            if not username or username.strip().casefold() == "unknown":
                continue

            memory_info = info.get("memory_info")  # hola

            is_system = ProcessClassifier.is_system_process(username)
            preemption = (
                Preemption.NON_PREEMPTIVE if is_system else Preemption.PREEMPTIVE
            )

            process_list.append({
                "pid": info["pid"],
                "name": info["name"],
                "description": FileService.get_description(info["exe"], info.get("name") or "unknown"),
                "user": username,
                "cpu": info["cpu_percent"],
                "memory_mb": round(memory_info.rss / (1024 ** 2), 2) if memory_info else None,
                "preemption": preemption.value,
            })

            if len(process_list) >= limit:
                break

        return {
            "total": len(process_list),
            "processList": process_list,
        }