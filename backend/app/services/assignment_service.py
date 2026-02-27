from uuid import UUID
from datetime import date
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.assignment import Assignment, AssignmentStatus
from app.models.document_alert import Document
from app.models.assignment import TaskType, Priority
from app.schemas.schemas import AssignmentCreate, AssignmentUpdate
from app.services.time_estimator import estimate_assignment_time

async def create_assignment(user_id: UUID, data: AssignmentCreate, db: AsyncSession) -> Assignment:
    assignment = Assignment(
        user_id=user_id,
        title=data.title,
        subject=data.subject,
        task_type=data.task_type,
        deadline=data.deadline,
        priority=data.priority,
        status=AssignmentStatus.pending,
        description=data.description
    )
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment


async def get_assignments(
    user_id: UUID,
    db: AsyncSession,
    status: str | None = None,
    subject: str | None = None,
) -> list[Assignment]:
    query = select(Assignment).where(Assignment.user_id == user_id)

    if status:
        try:
            status_enum = AssignmentStatus(status)
            query = query.where(Assignment.status == status_enum)
        except ValueError:
            pass  # ignore invalid status values

    if subject:
        query = query.where(Assignment.subject.ilike(f"%{subject}%"))

    # Most urgent first
    query = query.order_by(Assignment.deadline.asc().nulls_last(), Assignment.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())



async def get_assignment_by_id(user_id: UUID, assignment_id: UUID, db: AsyncSession) -> Assignment:
    result = await db.execute(
        select(Assignment).where(
            and_(Assignment.id == assignment_id, Assignment.user_id == user_id)
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


async def update_assignment(
    user_id: UUID, assignment_id: UUID, data: AssignmentUpdate, db: AsyncSession
) -> Assignment:
    assignment = await get_assignment_by_id(user_id, assignment_id, db)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)
    await db.flush()
    return assignment


async def delete_assignment(user_id: UUID, assignment_id: UUID, db: AsyncSession) -> None:
    assignment = await get_assignment_by_id(user_id, assignment_id, db)
    await db.delete(assignment)
    await db.flush()


async def get_upcoming_assignments(user_id: UUID, db: AsyncSession, days: int = 7) -> list[Assignment]:
    """Get assignments with deadlines in the next N days."""
    from datetime import timedelta
    from sqlalchemy import cast, String
    today = date.today()
    cutoff = today + timedelta(days=days)

    result = await db.execute(
        select(Assignment).where(
            and_(
                Assignment.user_id == user_id,
                Assignment.deadline >= today,
                Assignment.deadline <= cutoff,
                cast(Assignment.status, String) != AssignmentStatus.completed.value,
            )
        ).order_by(Assignment.deadline.asc())
    )
    return list(result.scalars().all())


async def create_assignment_from_document(user_id: UUID, document_id: UUID, db: AsyncSession) -> Assignment:
    result = await db.execute(
        select(Document).where(
            and_(Document.id == document_id, Document.user_id == user_id)
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    extracted = document.extracted_data or {}
    if not extracted:
        raise HTTPException(status_code=400, detail="Document not extracted yet")

    raw_text = document.raw_text or ""
    time_estimate = await estimate_assignment_time(
        text=raw_text,
        task_type=extracted.get("task_type") or "assignment",
    )

    title = extracted.get("title") or document.original_filename or "Extracted Assignment"
    subject = extracted.get("subject")

    task_type_val = extracted.get("task_type") or "assignment"
    try:
        task_type_val = TaskType(task_type_val).value
    except ValueError:
        task_type_val = TaskType.assignment.value

    priority_val = extracted.get("priority") or Priority.medium.value
    try:
        priority_val = Priority(priority_val).value
    except ValueError:
        priority_val = Priority.medium.value

    deadline_val = extracted.get("deadline")
    if isinstance(deadline_val, str):
        try:
            from dateutil import parser as dateutil_parser
            deadline_val = dateutil_parser.parse(deadline_val).date()
        except Exception:
            deadline_val = None

    assignment = Assignment(
        user_id=user_id,
        title=title,
        subject=subject,
        task_type=task_type_val,
        description=extracted.get("description"),
        deadline=deadline_val,
        priority=priority_val,
        source_document_id=document_id,
        ai_metadata={"time_estimate": time_estimate},
    )

    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment
