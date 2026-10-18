from datetime import datetime

from pydantic import BaseModel, Field

from api_server.models.dtos.process_dtos import ProcessCreate, ProcessResponse


class CatalogCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    processes: list[ProcessCreate] = Field(default_factory=list)


class CatalogSummary(BaseModel):
    id: int
    name: str
    process_count: int


class CatalogDetail(BaseModel):
    id: int
    name: str
    created_at: datetime
    processes: list[ProcessResponse]