from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

import backend.src.models.database as database
from models.contact import Contact
import schema
from fastapi.responses import JSONResponse

def add_tables():
    return database.Base.metadata.create_all(bind=database.engine)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def create_contact(contact: schema, db: "Session"):
    contact = Contact(**contact.dict())
    db.add(contact)
    db.commit()
    db.refresh(contact)

    # return {"nice":"good"} if you use this make sure the api in main.py doesn't expect a specific format response
    # return schema.Contact.model_validate(contact)
    return contact
    # return JSONResponse(content={"status": "good!"}, status_code=200)

async def get_all_contacts(db: "Session") -> List[schema.Contact]:
    contacts = db.query(Contact).all()
    return [schema.Contact.model_validate(c) for c in contacts]

async def get_contact(contact_id: int, db: "Session") -> schema.Contact:
    return db.query(Contact).filter(Contact.id == contact_id).first()

async def delete_contact(contact: schema.Contact, db: "Session"):
    db.delete(contact)
    db.commit()

    deleted_contact = schema.Contact.model_validate(contact).model_dump()  # dict with ISO datetime
    return {"deleted_contact": deleted_contact, "status_code": 200}

async def update_contact(contact: schema.Contact, contact_data: schema.Contact, db: "Session") -> schema.Contact:
    contact.first_name = contact_data.first_name
    contact.last_name = contact_data.last_name
    contact.email = contact_data.email
    contact.phone_number = contact_data.phone_number

    db.commit()
    db.refresh(contact)
    
    return schema.Contact.model_validate(contact)


# ------------------------------- Vantage Labs -------------------------------

async def calc_cash_on_hand(net_income: float, expenses: float, years: int, interest_rates_and_thresholds: List[tuple]) -> float:
    
    running_total = net_income

    for year in range(years): # 0 - years-1 so if years is 5, it will run for 0,1,2,3,4 which is 5 iterations
        running_total += net_income - expenses

        for threshold, rate in interest_rates_and_thresholds:
            if net_income < threshold:
                net_income += net_income * rate
                break

    return net_income