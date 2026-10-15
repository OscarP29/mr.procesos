from fastapi import FastAPI
from api_server.routes.process import router as router_process
app = FastAPI()

app.include_router(router_process)

@app.get("/")
def root():
    return "Hi Mom!"