from pydantic import BaseModel, ConfigDict
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    color: str = "#6B7280"
    icon: str = "tag"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: str
    user_id: Optional[str] = None
    is_default: bool = False

    model_config = ConfigDict(from_attributes=True)
