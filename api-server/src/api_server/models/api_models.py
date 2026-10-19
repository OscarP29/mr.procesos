from typing import Annotated
from typing import Annotated, Literal

from fastapi import Query

ProcessLimit = Annotated[int, Query(ge=1, le=500)]
ProcessSortBy = Annotated[Literal["cpu", "memory"] | None, Query()]
ProcessSortOrder = Annotated[Literal["asc", "desc"], Query()]
ProcessMinCpu = Annotated[float | None, Query(ge=0, le=100)]
ProcessMinMemory = Annotated[float | None, Query(ge=0)]

