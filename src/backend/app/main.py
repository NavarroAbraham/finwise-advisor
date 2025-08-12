from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI(title="FinWise API")

@app.get("/", response_class=PlainTextResponse)
def read_root():
    return "FinWise API: OK"