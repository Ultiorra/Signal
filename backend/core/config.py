from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    cors_origins: str = "http://localhost:3000"
    coingecko_base: str = "https://api.coingecko.com/api/v3"
    coinpaprika_base: str = "https://api.coinpaprika.com/v1"
    request_timeout: int = 20
    history_days: int = 365
    forecast_horizon: int = 14

    class Config:
        env_file = ".env"


settings = Settings()
