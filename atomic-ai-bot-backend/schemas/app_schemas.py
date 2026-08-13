from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
class WidgetSettings(BaseModel):
    icon: Optional[str] = None 
    color: Optional[str] = None
    text_color: Optional[str] = None

class BotSettings(BaseModel):
    system_prompt: Optional[str] = None
    widget: Optional[WidgetSettings] = Field(default_factory=WidgetSettings)

class BotCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    allowed_domain: str = Field(..., description="Example: mysite.com")
    settings: Optional[BotSettings] = Field(default_factory=BotSettings)

class BotOut(BaseModel):
    id: int
    name: str
    api_key: str
    allowed_domain: str
    settings: BotSettings

    class Config:
        from_attributes = True

class BotShortInfo(BaseModel):
    id: int
    name: str
    api_key: str
    allowed_domain: str
    settings: dict

    class Config:
        from_attributes = True

class BotUpdate(BaseModel):
    name: Optional[str] = None
    allowed_domain: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None