from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    body: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if body.name is not None:
        current_user.name = body.name
    if body.amputation_level is not None:
        current_user.amputation_level = body.amputation_level
    if body.weeks_to_fitting is not None:
        current_user.weeks_to_fitting = body.weeks_to_fitting
    db.commit()
    db.refresh(current_user)
    return current_user
