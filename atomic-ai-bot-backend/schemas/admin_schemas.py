from typing import Any, Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class AdminStats(BaseModel):
    total_users: int
    total_bots: int
    active_sessions: int


class AdminUserListItem(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    role: str
    is_blocked: bool
    tariff_plan: str


class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int
    limit: int
    offset: int


class AdminBotOut(BaseModel):
    id: int
    name: str
    api_key: str
    allowed_domain: str
    owner_id: int
    settings: dict[str, Any] | None = None

    class Config:
        from_attributes = True


class AdminUserDetail(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    role: str
    is_blocked: bool
    tariff_plan: str
    bots: list[AdminBotOut]


class AdminUserUpdate(BaseModel):
    is_blocked: Optional[bool] = None
    tariff_plan: Optional[str] = Field(default=None, min_length=1, max_length=50)
    role: Optional[Literal["user", "admin"]] = None


class AdminBotUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    allowed_domain: Optional[str] = None
    settings: Optional[dict[str, Any]] = None
