"""Application entry point for the Pronunciation Coach backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.analyze import router as analyze_router


app = FastAPI(title="Pronunciation Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://speak-score.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Return a placeholder health response.

    TODO: Define the production health-check contract.
    """
    return {"status": "ok"}
