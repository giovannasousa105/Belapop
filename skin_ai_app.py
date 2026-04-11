from fastapi import FastAPI

from skin_ai_service import router as skin_ai_router


app = FastAPI(title="BelaPop Skin AI Service")
app.include_router(skin_ai_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
