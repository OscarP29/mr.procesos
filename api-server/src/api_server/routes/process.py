from fastapi import APIRouter
from api_server.models.process_models import ProcessLimit
from api_server.services.process_service import ProcessService 


router = APIRouter(prefix="/process", tags=["Process"])

@router.get("/")
def get_process(limit: ProcessLimit = 10): 
    return ProcessService.getProcess(limit)