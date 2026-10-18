from pydantic import BaseModel, Field


class ProcessCreate(BaseModel):
    pid: int
    name: str = Field(min_length=1, max_length=120)
    user: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1)
    preemption: int = Field(ge=0, le=1)
    cpu: float
    memory_mb: float | None = None


class ProcessResponse(BaseModel):
    id: int
    catalog_id: int
    pid: int
    name: str
    user: str
    description: str
    preemption: int
    cpu: float
    memory_mb: float | None