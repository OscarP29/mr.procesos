from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api_server.models.database import Base


class Preemption(Enum):
    PREEMPTIVE = 0
    NON_PREEMPTIVE = 1


class Catalog(Base):
    __tablename__ = "catalogs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    processes: Mapped[list["Process"]] = relationship(
        "Process",
        back_populates="catalog",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processes": [process.to_dict() for process in self.processes],
        }

    def __repr__(self) -> str:
        return f"<Catalog id={self.id} name={self.name!r}>"