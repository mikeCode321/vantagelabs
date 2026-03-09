from fastapi import APIRouter, Depends, HTTPException, Request
import sqlalchemy.orm as orm
from typing import List
import schemas.contact as contact_schema
import services.contacts as contact_service
from dependencies import get_db, limiter

router = APIRouter(prefix="/api/contacts", tags=["contacts"])

@router.get("/", response_model=List[contact_schema.Contact])
async def get_contacts(db: orm.Session = Depends(get_db)):
    return await contact_service.get_all_contacts(db=db)

@router.post("/", response_model=contact_schema.Contact)
async def create_contact(contact: contact_schema.CreateContact, db: orm.Session = Depends(get_db)):
    return await contact_service.create_contact(contact=contact, db=db)

@router.get("/{contact_id}/", response_model=contact_schema.Contact)
@limiter.limit("5/minute")
async def get_contact(request: Request, contact_id: int, db: orm.Session = Depends(get_db)):
    return await contact_service.get_contact(contact_id=contact_id, db=db)

@router.put("/{contact_id}", response_model=contact_schema.Contact)
async def put_contact(contact_id: int, contact_data: contact_schema.CreateContact, db: orm.Session = Depends(get_db)):
    contact = await contact_service.get_contact(contact_id, db)
    if contact is None:
        raise HTTPException(404, detail="User DNE")
    return await contact_service.update_contact(contact, contact_data, db)

@router.delete("/{contact_id}/")
async def delete_contact(contact_id: int, db: orm.Session = Depends(get_db)):
    contact = await contact_service.get_contact(contact_id, db)
    if contact is None:
        raise HTTPException(404, detail="User DNE")
    return await contact_service.delete_contact(contact, db)