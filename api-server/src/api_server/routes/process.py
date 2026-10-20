from fastapi import APIRouter
from api_server.models.api_models import (
    ProcessLimit,
    ProcessMinCpu,
    ProcessMinMemory,
    ProcessSortBy,
    ProcessSortOrder,
)
from api_server.services.process_service import ProcessService 


router = APIRouter(prefix="/process", tags=["Process"])

@router.get("/")
def get_process(
    limit: ProcessLimit = 10,
    sort_by: ProcessSortBy = None,
    order: ProcessSortOrder = "desc",
    min_cpu: ProcessMinCpu = None,
    min_memory_mb: ProcessMinMemory = None,
):
    return ProcessService.getProcess(
        limit, sort_by, order, min_cpu, min_memory_mb
    )