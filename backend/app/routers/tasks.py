from fastapi import APIRouter, Depends, HTTPException

from app import d1_database
from app.auth import get_current_user
from app.database import get_db
from app.models import TaskStatus
from app.schemas import TaskResponse
from app.services.d1 import D1Client

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: D1Client = Depends(get_db),
):
    task = await d1_database.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse(
        task_id=task["id"],
        status=TaskStatus(task["status"]),
        progress=task["progress"],
        episode_id=task["episode_id"],
    )
