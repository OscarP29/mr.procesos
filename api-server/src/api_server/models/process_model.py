from sqlalchemy import CheckConstraint, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api_server.models.catalog_model import Catalog
from api_server.models.database import Base


class Process(Base):
    __tablename__ = "processes"
    __table_args__ = (
        CheckConstraint("preemption IN (0, 1)", name="ck_processes_preemption"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    catalog_id: Mapped[int] = mapped_column(
        ForeignKey("catalogs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    pid: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    user: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    preemption: Mapped[int] = mapped_column(Integer, nullable=False)
    cpu: Mapped[float] = mapped_column(Float, nullable=False)
    memory_mb: Mapped[float | None] = mapped_column(Float, nullable=True)

    catalog: Mapped[Catalog] = relationship("Catalog", back_populates="processes")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "catalog_id": self.catalog_id,
            "pid": self.pid,
            "name": self.name,
            "user": self.user,
            "description": self.description,
            "preemption": self.preemption,
            "cpu": self.cpu,
            "memory_mb": self.memory_mb,
        }

    def __repr__(self) -> str:
        return f"<Process pid={self.pid} name={self.name!r}>"