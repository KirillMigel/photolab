from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Backend is now minimal - just health check
    # All image processing happens in browser
    
    class Config:
        case_sensitive = False
        env_file = ".env"


settings = Settings()
