from pydantic import BaseModel
from typing import Optional, Literal, Union

class WatchAnalysis(BaseModel):
    brand: str
    type: str
    features: str

class RepairItem(BaseModel):
    id: Optional[Union[str, int]] = None
    user_phone: str
    customerName: str
    description: str
    status: Literal['PENDING', 'IN_PROGRESS', 'COMPLETED']
    date: str
    imageUrl: Optional[str] = None
    analysis: Optional[WatchAnalysis] = None

class User(BaseModel):
    phone: str
    name: str
    role: Literal['CUSTOMER', 'ADMIN'] = 'CUSTOMER'
