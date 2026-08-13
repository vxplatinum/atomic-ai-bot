from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class AIRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    session_id: str
    api_token: str = Field(
        ...,
        validation_alias=AliasChoices("api_key", "api_token"),
        description="Public bot api_key (OpenAPI name).",
    )
    widget_origin: str | None = Field(
        None,
        description="Embedding page origin for allowed_domain on validate.",
    )


class ClearChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_id: str
    api_token: str = Field(
        ...,
        validation_alias=AliasChoices("api_key", "api_token"),
    )
    widget_origin: str | None = Field(
        None,
        description="Embedding page origin for allowed_domain on validate.",
    )
