from typing import Annotated
from fastapi import Query

ProcessLimit = Annotated[
    int,
    Query(ge=1, le=500)
]