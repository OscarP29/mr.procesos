from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api_server.models.database import init_db
from api_server.routes.catalog import router as router_catalog
from api_server.routes.process import router as router_process


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_process)
app.include_router(router_catalog)


@app.get("/")
def root():
    return "Hi Mom!"