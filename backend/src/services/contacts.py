from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

import database
from models.contact import Contact
import schemas.contact as contact_schema
# from fastapi.responses import JSONResponse

def add_tables():
    return database.Base.metadata.create_all(bind=database.engine)

async def create_contact(contact: contact_schema, db: "Session"):
    contact = Contact(**contact.dict())
    db.add(contact)
    db.commit()
    db.refresh(contact)

    # return {"nice":"good"} if you use this make sure the api in main.py doesn't expect a specific format response
    # return contact_schema.Contact.model_validate(contact)
    return contact
    # return JSONResponse(content={"status": "good!"}, status_code=200)

async def get_all_contacts(db: "Session") -> List[contact_schema.Contact]:
    contacts = db.query(Contact).all()
    return [contact_schema.Contact.model_validate(c) for c in contacts]

async def get_contact(contact_id: int, db: "Session") -> contact_schema.Contact:
    return db.query(Contact).filter(Contact.id == contact_id).first()

async def delete_contact(contact: contact_schema.Contact, db: "Session"):
    db.delete(contact)
    db.commit()

    deleted_contact = contact_schema.Contact.model_validate(contact).model_dump()  # dict with ISO datetime
    return {"deleted_contact": deleted_contact, "status_code": 200}

async def update_contact(contact: contact_schema.Contact, contact_data: contact_schema.Contact, db: "Session") -> contact_schema.Contact:
    contact.first_name = contact_data.first_name
    contact.last_name = contact_data.last_name
    contact.email = contact_data.email
    contact.phone_number = contact_data.phone_number

    db.commit()
    db.refresh(contact)
    
    return contact_schema.Contact.model_validate(contact)