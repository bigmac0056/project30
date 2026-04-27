from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenOut)
def register(body: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=body.email,
        name=body.name,
        hashed_password=auth_utils.hash_password(body.password),
        amputation_level=body.amputation_level or "",
        weeks_to_fitting=body.weeks_to_fitting or 16,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_utils.create_token(user.id)
    return schemas.TokenOut(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.TokenOut)
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not auth_utils.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_utils.create_token(user.id)
    return schemas.TokenOut(access_token=token, user=schemas.UserOut.model_validate(user))
