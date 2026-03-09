from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from slowapi.middleware import SlowAPIMiddleware
import schema
import fastapi
import backend.src.services as services
import sqlalchemy.orm as orm
from typing import TYPE_CHECKING, List
from logger import Logger
from config.settings import ENV

log = Logger(location='main.py')

log.info(f"Starting server on - {ENV}")
log.info("testing here")

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
if ENV != "development":
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Slow down!"}
    ))
else:
    # In development, attach a dummy limiter so code still works
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    limiter = DummyLimiter()

@app.get("/status")
def status():
    return {"status": "ok"}

# http://127.0.0.1:8000/docs
# view api endpoints in the ui and test there
@app.post("/api/contacts/", response_model = schema.Contact)
# @app.post("/app/contacts/")
async def create_contact(
    contact: schema.CreateContact, 
    db: orm.Session = fastapi.Depends(services.get_db)
):
    return await services.create_contact(contact=contact,db=db)


@app.get("/api/contacts/", response_model=List[schema.Contact])
async def get_contacts(db: orm.Session = fastapi.Depends(services.get_db)):
    return await services.get_all_contacts(db=db)

# get one contact
@app.get("/api/contact/{contact_id}/", response_model=schema.Contact)
@limiter.limit("5/minute")  # 5 requests per minute per IP
async def get_contact(request: Request, contact_id: int, db: orm.Session = fastapi.Depends(services.get_db)):
    return await services.get_contact(contact_id=contact_id, db=db)

# update contact
@app.put('/api/contacts/{contact_id}', response_model=schema.Contact)
async def put_contact(contact_id: int, contact_data: schema.CreateContact, db: orm.Session = fastapi.Depends(services.get_db)):
    contact = await services.get_contact(contact_id, db)
    if contact is None:
        log.error("USER DNE")
        raise fastapi.HTTPException(404, detail="User DNE")
    
    return await services.update_contact(contact, contact_data, db)

# delete contact 
@app.delete('/api/contacts/{contact_id}/')
async def delete_contact(contact_id: int, db: orm.Session = fastapi.Depends(services.get_db)):
    contact = await services.get_contact(contact_id, db)
    if contact is None:
        log.error("USER DNE")
        raise fastapi.HTTPException(404, detail="User DNE")
    
    return await services.delete_contact(contact, db) 

@app.get("/api/calc_cash_on_hand/")
async def calc_cash_on_hand( net_income: float, expenses: float, years: int, interest_rates_and_thresholds: List[tuple] ):
    return await services.calc_cash_on_hand(net_income, expenses, years, interest_rates_and_thresholds)