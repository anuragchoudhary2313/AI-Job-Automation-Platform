"""
Pagination utilities for efficient query handling.
"""
from typing import Generic, TypeVar, List, Any
from pydantic import BaseModel
from beanie import Document
from beanie.odm.queries.find import FindMany

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = 1
    page_size: int = 20
    
    @property
    def offset(self) -> int:
        """Calculate offset from page and page_size."""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Get limit (same as page_size)."""
        return self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model."""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int
    ) -> "PaginatedResponse[T]":
        """
        Create paginated response.
        """
        total_pages = (total + page_size - 1) // page_size
        
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )


async def paginate(
    query: FindMany,
    pagination: PaginationParams
) -> tuple[List[Any], int]:
    """
    Paginate Beanie query.
    
    Args:
        query: Beanie FindMany query
        pagination: Pagination parameters
        
    Returns:
        Tuple of (items, total_count)
    """
    # Get total count
    total = await query.count()
    
    # Get paginated items
    items = await query.skip(pagination.offset).limit(pagination.limit).to_list()
    
    return items, total
