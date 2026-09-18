import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "PowerMind"
    APP_DESCRIPTION: str = "PowerMind — Smart Campus Energy Optimization Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]
    
    # LLM Settings
    LLM_PROVIDER: str = Field(default="mock", description="Provider: mock, gemini, openai, groq, openrouter")
    LLM_MODEL: str = Field(default="gemini-2.5-flash", description="Model name or scan model")
    LLM_API_KEY: str = Field(default="", description="API key for selected LLM provider")
    LLM_BASE_URL: str = Field(default="", description="Custom base URL if needed")
    LLM_TIMEOUT_SECONDS: float = 8.0
    LLM_MAX_REPAIR_ATTEMPTS: int = 1
    
    # Cache Settings
    CACHE_ENABLED: bool = True
    CACHE_MAX_SIZE: int = 1024
    
    # Optimizer Settings
    SOLVER_TIMEOUT_SECONDS: float = 10.0
    SOLVER_TOLERANCE: float = 1e-5
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
