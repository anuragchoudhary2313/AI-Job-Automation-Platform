import asyncio
from app.db.mongo import init_db
from app.models.resume import Resume

async def delete_all_resumes():
    await init_db()
    
    print("\n=== DELETING ALL RESUMES ===\n")
    
    # Get count before deletion
    resumes = await Resume.find_all().to_list()
    count = len(resumes)
    
    print(f"Found {count} resumes in database")
    
    if count > 0:
        # Delete all resumes
        result = await Resume.find_all().delete()
        print(f"Deleted {result.deleted_count} resumes")
    else:
        print("No resumes to delete")
    
    # Verify deletion
    remaining = await Resume.find_all().to_list()
    print(f"\nResumes remaining: {len(remaining)}")
    print("\n✓ All resumes deleted successfully!\n")

if __name__ == "__main__":
    asyncio.run(delete_all_resumes())
