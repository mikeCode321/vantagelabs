import datetime as dt
import pydantic


# no need for id; it auto indexes
class BaseContact(pydantic.BaseModel):
    first_name: str
    last_name: str
    email: str
    phone_number: str


class Contact(BaseContact):
    id: int
    date_created: dt.datetime

    class Config:
        from_attributes = True
        json_encoders = {
            dt.datetime: lambda v: v.isoformat()  # <-- convert datetime to ISO string
        }


class CreateContact(BaseContact):
    pass