from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    replicate_api_token: str = Field(..., alias="REPLICATE_API_TOKEN")
    replicate_model_quality: str = Field(
        "851-labs/background-remover", alias="REPLICATE_MODEL_QUALITY"
    )
    replicate_model_fast: str = Field("lucataco/remove-bg", alias="REPLICATE_MODEL_FAST")

    max_file_size_mb: int = Field(15, alias="MAX_FILE_SIZE_MB")
    max_dimension: int = Field(3072, alias="MAX_DIMENSION")

    redis_url: str = Field("redis://redis:6379/0", alias="REDIS_URL")

    class Config:
        case_sensitive = False
        env_file = ".env"


settings = Settings()

