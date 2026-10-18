from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from api_server.models.catalog_model import Catalog
from api_server.models.dtos.catalog_dtos import (
    CatalogCreate,
    CatalogDetail,
    CatalogSummary,
)
from api_server.models.dtos.process_dtos import ProcessResponse
from api_server.models.process_model import Process


class CatalogNotFoundError(Exception):
    def __init__(self, catalog_id: int):
        self.catalog_id = catalog_id
        self.detail = f"El catálogo con id {catalog_id} no existe"
        super().__init__(self.detail)


class CatalogNameAlreadyExistsError(Exception):
    def __init__(self, name: str):
        self.name = name
        self.detail = f"El catálogo '{name}' ya existe"
        super().__init__(self.detail)


class ProcessNotFoundError(Exception):
    def __init__(self, catalog_id: int, pid: int):
        self.catalog_id = catalog_id
        self.pid = pid
        self.detail = (
            f"El proceso con pid {pid} no existe en el catálogo con id {catalog_id}"
        )
        super().__init__(self.detail)


class CatalogService:
    @staticmethod
    def _to_response(process: Process) -> ProcessResponse:
        return ProcessResponse(
            id=process.id,
            catalog_id=process.catalog_id,
            pid=process.pid,
            name=process.name,
            user=process.user,
            description=process.description,
            preemption=process.preemption,
            cpu=process.cpu,
            memory_mb=process.memory_mb,
        )

    @staticmethod
    def _load(db: Session, catalog_id: int) -> Catalog:
        catalog = db.execute(
            select(Catalog)
            .options(selectinload(Catalog.processes))
            .where(Catalog.id == catalog_id)
        ).scalar_one_or_none()

        if catalog is None:
            raise CatalogNotFoundError(catalog_id)

        return catalog

    @staticmethod
    def _to_detail(catalog: Catalog) -> CatalogDetail:
        return CatalogDetail(
            id=catalog.id,
            name=catalog.name,
            created_at=catalog.created_at,
            processes=[
                CatalogService._to_response(process) for process in catalog.processes
            ],
        )

    @staticmethod
    def create(db: Session, payload: CatalogCreate) -> CatalogDetail:
        catalog = Catalog(name=payload.name)
        catalog.processes = [
            Process(
                pid=process.pid,
                name=process.name,
                user=process.user,
                description=process.description,
                preemption=process.preemption,
                cpu=process.cpu,
                memory_mb=process.memory_mb,
            )
            for process in payload.processes
        ]

        db.add(catalog)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise CatalogNameAlreadyExistsError(payload.name) from None

        db.refresh(catalog)
        return CatalogService._to_detail(catalog)

    @staticmethod
    def list_all(db: Session) -> list[CatalogSummary]:
        rows = db.execute(
            select(Catalog.id, Catalog.name, func.count(Process.id))
            .outerjoin(Process, Process.catalog_id == Catalog.id)
            .group_by(Catalog.id, Catalog.name)
            .order_by(Catalog.id)
        ).all()

        return [
            CatalogSummary(id=catalog_id, name=name, process_count=process_count)
            for catalog_id, name, process_count in rows
        ]

    @staticmethod
    def get_by_id(db: Session, catalog_id: int) -> CatalogDetail:
        return CatalogService._to_detail(CatalogService._load(db, catalog_id))

    @staticmethod
    def delete(db: Session, catalog_id: int) -> CatalogDetail:
        catalog = CatalogService._load(db, catalog_id)
        detail = CatalogService._to_detail(catalog)

        db.delete(catalog)
        db.commit()

        return detail

    @staticmethod
    def delete_process(db: Session, catalog_id: int, pid: int) -> ProcessResponse:
        process = db.execute(
            select(Process).where(
                Process.catalog_id == catalog_id, Process.pid == pid
            )
        ).scalar_one_or_none()

        if process is None:
            raise ProcessNotFoundError(catalog_id, pid)

        response = CatalogService._to_response(process)

        db.delete(process)
        db.commit()

        return response