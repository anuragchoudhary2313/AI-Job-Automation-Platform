"""
Base repository class for data access layer using Beanie (MongoDB).
"""

from typing import Generic, TypeVar, Type, Optional, List, Dict, Any
from beanie import Document
from beanie.operators import In
from pydantic import BaseModel

from app.core.exceptions import NotFoundError, DatabaseError
from app.core.logging import get_logger

logger = get_logger(__name__)

# Type variable for Beanie Document
ModelType = TypeVar("ModelType", bound=Document)


class BaseRepository(Generic[ModelType]):
    """
    Base repository class with common CRUD operations using Beanie.
    """
    
    def __init__(self, model: Type[ModelType]) -> None:
        """
        Initialize repository.
        
        Args:
            model: Beanie Document class
        """
        self.model = model
    
    async def get_by_id(self, id: Any) -> Optional[ModelType]:
        """
        Get a single record by ID.
        """
        try:
            return await self.model.get(id)
        except Exception as e:
            logger.error(f"Error getting {self.model.__name__} by ID {id}: {str(e)}")
            raise DatabaseError(f"Failed to get {self.model.__name__}") from e
    
    async def get_or_404(self, id: Any) -> ModelType:
        """
        Get a single record by ID or raise 404.
        """
        try:
            record = await self.get_by_id(id)
            if not record:
                raise NotFoundError(self.model.__name__, id)
            return record
        except NotFoundError:
            raise
        except Exception as e:
            raise DatabaseError(f"Failed to get {self.model.__name__}") from e
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ModelType]:
        """
        Get all records with optional filtering and pagination.
        """
        try:
            query = self.model.find(filters or {})
            return await query.skip(skip).limit(limit).to_list()
        except Exception as e:
            logger.error(f"Error getting all {self.model.__name__}: {str(e)}")
            raise DatabaseError(f"Failed to get {self.model.__name__} records") from e
    
    async def create(self, **kwargs: Any) -> ModelType:
        """
        Create a new record.
        """
        try:
            instance = self.model(**kwargs)
            await instance.insert()
            logger.info(f"Created {self.model.__name__} with ID {instance.id}")
            return instance
        except Exception as e:
            logger.error(f"Error creating {self.model.__name__}: {str(e)}")
            raise DatabaseError(f"Failed to create {self.model.__name__}") from e
    
    async def update(self, id: Any, **kwargs: Any) -> ModelType:
        """
        Update an existing record.
        """
        try:
            instance = await self.get_or_404(id)
            
            # Filter out None values just in case, or apply all
            update_data = {k: v for k, v in kwargs.items() if v is not None}
            
            if update_data:
                await instance.set(update_data)
                
            logger.info(f"Updated {self.model.__name__} with ID {id}")
            return instance
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error updating {self.model.__name__} {id}: {str(e)}")
            raise DatabaseError(f"Failed to update {self.model.__name__}") from e
    
    async def delete(self, id: Any) -> bool:
        """
        Delete a record.
        """
        try:
            instance = await self.get_or_404(id)
            await instance.delete()
            logger.info(f"Deleted {self.model.__name__} with ID {id}")
            return True
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error deleting {self.model.__name__} {id}: {str(e)}")
            raise DatabaseError(f"Failed to delete {self.model.__name__}") from e
            
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count records.
        """
        try:
            return await self.model.find(filters or {}).count()
        except Exception as e:
            logger.error(f"Error counting {self.model.__name__}: {str(e)}")
            raise DatabaseError("Failed to count records") from e
