import psutil

from api_server.lib.file_description import FileService
from api_server.lib.process_classifier import ProcessClassifier
from api_server.models.catalog_model import Preemption


class ProcessService:
    @staticmethod
    def getProcess(
        limit: int = 10,
        sort_by: str | None = None,
        order: str = "desc",
        min_cpu: float | None = None,
        min_memory_mb: float | None = None,
    ):
        process_list = []
        for process in psutil.process_iter(
            ["pid", "name", "username", "exe", "cpu_percent", "memory_info"], ad_value=None
        ):
            info = process.info
            username = info.get("username")
            if not username or username.strip().casefold() == "unknown":
                continue

            memory_info = info.get("memory_info")
            cpu = info.get("cpu_percent")
            memory_mb = round(memory_info.rss / (1024 ** 2), 2) if memory_info else None

            if min_cpu is not None and (cpu is None or cpu < min_cpu):
                continue
            if min_memory_mb is not None and (memory_mb is None or memory_mb < min_memory_mb):
                continue

            is_system = ProcessClassifier.is_system_process(username)
            preemption = (
                Preemption.NON_PREEMPTIVE if is_system else Preemption.PREEMPTIVE
            )

            process_list.append({
                "pid": info["pid"],
                "name": info["name"],
                "user": username,
                "cpu": cpu,
                "memory_mb": memory_mb,
                "preemption": preemption.value,
                "exe": info.get("exe"),
            })

        sort_field = {"cpu": "cpu", "memory": "memory_mb"}.get(sort_by)
        if sort_field is not None:
            process_list.sort(
                key=lambda item: item[sort_field] or 0,
                reverse=order == "desc",
            )
            process_list.sort(key=lambda item: item[sort_field] is None)

        process_list = process_list[:limit]
        for item in process_list:
            item["description"] = FileService.get_description(
                item.pop("exe"), item["name"] or "unknown"
            )

        return {
            "total": len(process_list),
            "processList": process_list,
        }