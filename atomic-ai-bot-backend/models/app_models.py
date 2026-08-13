from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Dict, Any

from database.database import Base

class Bot(Base):
    __tablename__ = "bots"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    api_key: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    allowed_domain: Mapped[str] = mapped_column(String(255))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    owner = relationship("User", back_populates="bots")

    settings: Mapped[Dict[str, Any]] = mapped_column(
        JSON, 
        nullable=True, 
        default=lambda: {
            "system_prompt": "",
            "widget": {
                "icon": "atomic-ai-bot",
                "color": "#3b82f6",
                "text_color": "#ffffff"
            }
        }
    )