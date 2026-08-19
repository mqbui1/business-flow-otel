from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    splunk_base_url: str = "https://localhost:8089"
    splunk_token: str = ""
    splunk_index: str = "business_milestones"
    verify_tls: bool = True


settings = Settings()
