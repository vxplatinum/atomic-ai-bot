from pydantic import BaseModel, EmailStr, Field
from typing import Literal

class UserCreate(BaseModel):
    username: str = Field(..., min_length=5, max_length=50, description="Nickname")
    email: EmailStr = Field(..., description="Email")
    password: str = Field(..., min_length=5, max_length=100, description="Password")

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    role: Literal["user", "admin"]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class VerificationRequest(BaseModel):
    token: str

class LogoutRequest(BaseModel):
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=5)


class DeleteAccountRequest(BaseModel):
    password: str = Field(..., min_length=1, description="Your current password")