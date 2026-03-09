import sqlalchemy as sql
from sqlalchemy.sql import func
import database as db

class Contact(db.Base):
    __tablename__ = "contacts"

    id = sql.Column(sql.Integer, primary_key=True, index=True)
    first_name = sql.Column(sql.String(100), nullable=False, index=True)
    last_name = sql.Column(sql.String(100), nullable=False, index=True)
    email = sql.Column(sql.String(255), nullable=False, unique=True, index=True)
    phone_number = sql.Column(sql.String(20), unique=True, index=True)
    date_created = sql.Column(
        sql.DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )