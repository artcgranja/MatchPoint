export const FASTAPI_STARTER_FILES: Record<string, string> = {
  "main.py": `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="My API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
`,
  "requirements.txt": `fastapi>=0.115.0
uvicorn[standard]>=0.34.0
pydantic>=2.0
python-dotenv>=1.0.0
`,
  ".env.example": `# Add your environment variables here
# API_KEY=your_api_key
`,
};
