from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api_server.models.database import get_db
from api_server.models.dtos.catalog_dtos import (
    CatalogCreate,
    CatalogDetail,
    CatalogSummary,
)
from api_server.models.dtos.process_dtos import ProcessResponse
from api_server.services.catalog_service import (
    CatalogNameAlreadyExistsError,
    CatalogNotFoundError,
    CatalogService,
    ProcessNotFoundError,
)

router = APIRouter(prefix="/catalogs", tags=["Catalog"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CatalogDetail)
def create_catalog(payload: CatalogCreate, db: Session = Depends(get_db)):
    try:
        catalog = CatalogService.create(db, payload)
    except CatalogNameAlreadyExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=error.detail
        ) from error

    return catalog


@router.get("/", response_model=list[CatalogSummary])
def list_catalogs(db: Session = Depends(get_db)):
    return CatalogService.list_all(db)


@router.get("/{catalog_id}/", response_model=CatalogDetail)
def get_catalog(catalog_id: int, db: Session = Depends(get_db)):
    try:
        return CatalogService.get_by_id(db, catalog_id)
    except CatalogNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=error.detail
        ) from error


@router.delete("/{catalog_id}/", response_model=CatalogDetail)
def delete_catalog(catalog_id: int, db: Session = Depends(get_db)):
    try:
        return CatalogService.delete(db, catalog_id)
    except CatalogNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=error.detail
        ) from error


@router.delete(
    "/{catalog_id}/processes/{pid}/", response_model=ProcessResponse
)
def delete_catalog_process(
    catalog_id: int, pid: int, db: Session = Depends(get_db)
):
    try:
        return CatalogService.delete_process(db, catalog_id, pid)
    except ProcessNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=error.detail
        ) from error