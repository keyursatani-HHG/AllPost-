"""Social account connections and post scheduling."""
from __future__ import annotations

import pathlib
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import errors
from app.models.calendar_note import CalendarNote
from app.models.enums import PostStatus, ScheduleStatus, SocialPlatform
from app.models.post import Post
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.models.user import User
from app.schemas.common import PaginationParams
from app.schemas.schedule import ScheduleCreate, SocialAccountConnect
from app.services import bluesky, linkedin, mastodon

UPLOAD_DIR = pathlib.Path("uploads")
_MIME = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".gif": "image/gif",
}
_VIDEO_MIME = {".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm"}


# --- Social accounts ------------------------------------------------------- #
async def list_social_accounts(db: AsyncSession, user_id: uuid.UUID) -> list[SocialAccount]:
    result = await db.execute(
        select(SocialAccount)
        .where(SocialAccount.user_id == user_id)
        .order_by(SocialAccount.created_at.desc())
    )
    return list(result.scalars().all())


async def connect_account(
    db: AsyncSession, user: User, data: SocialAccountConnect
) -> SocialAccount:
    account = SocialAccount(
        user_id=user.id,
        platform=data.platform,
        external_id=data.external_id,
        handle=data.handle,
        display_name=data.display_name,
        avatar_url=data.avatar_url,
        access_token=data.access_token,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


async def disconnect_account(
    db: AsyncSession, user_id: uuid.UUID, account_id: uuid.UUID
) -> None:
    account = await db.get(SocialAccount, account_id)
    if account is None:
        raise errors.not_found("Social account not found")
    if account.user_id != user_id:
        raise errors.forbidden()
    await db.delete(account)
    await db.commit()


# --- Scheduling ------------------------------------------------------------ #
async def create_schedule(
    db: AsyncSession, user: User, data: ScheduleCreate
) -> list[ScheduledPost]:
    post = await db.get(Post, data.post_id)
    if post is None or post.user_id != user.id:
        raise errors.not_found("Post not found")

    # Verify every target account belongs to the user.
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id.in_(data.social_account_ids),
            SocialAccount.user_id == user.id,
        )
    )
    accounts = list(result.scalars().all())
    if len(accounts) != len(set(data.social_account_ids)):
        raise errors.bad_request("One or more social accounts are invalid", "invalid_accounts")

    created: list[ScheduledPost] = []
    for account in accounts:
        sp = ScheduledPost(
            post_id=post.id,
            social_account_id=account.id,
            scheduled_at=data.scheduled_at,
            status=ScheduleStatus.queued,
        )
        db.add(sp)
        created.append(sp)

    post.status = PostStatus.scheduled
    await db.commit()
    for sp in created:
        await db.refresh(sp)
    return created


async def list_scheduled(
    db: AsyncSession,
    user_id: uuid.UUID,
    pagination: PaginationParams,
    status: ScheduleStatus | None = None,
) -> tuple[list[ScheduledPost], int]:
    filters = [Post.user_id == user_id]
    if status is not None:
        filters.append(ScheduledPost.status == status)

    base = select(ScheduledPost).join(Post, ScheduledPost.post_id == Post.id).where(*filters)
    total = await db.scalar(
        select(func.count()).select_from(ScheduledPost).join(Post, ScheduledPost.post_id == Post.id).where(*filters)
    )
    result = await db.execute(
        base.order_by(ScheduledPost.scheduled_at.asc())
        .limit(pagination.page_size)
        .offset(pagination.offset)
    )
    return list(result.scalars().all()), int(total or 0)


async def calendar_items(
    db: AsyncSession, user_id: uuid.UUID, start: datetime, end: datetime
) -> list[dict]:
    """Scheduled/published items for a user within [start, end), with post content."""
    rows = await db.execute(
        select(
            ScheduledPost.id,
            ScheduledPost.post_id,
            ScheduledPost.scheduled_at,
            ScheduledPost.published_at,
            ScheduledPost.status,
            ScheduledPost.external_post_id,
            Post.content,
            Post.media_urls,
            SocialAccount.platform,
            SocialAccount.handle,
        )
        .join(Post, ScheduledPost.post_id == Post.id)
        .join(SocialAccount, ScheduledPost.social_account_id == SocialAccount.id)
        .where(
            Post.user_id == user_id,
            ScheduledPost.scheduled_at >= start,
            ScheduledPost.scheduled_at < end,
        )
        .order_by(ScheduledPost.scheduled_at.asc())
    )
    items: list[dict] = []
    for r in rows.all():
        platform = r.platform.value if hasattr(r.platform, "value") else str(r.platform)
        url = (
            bluesky.post_url(r.external_post_id, r.handle)
            if r.external_post_id and platform == "bluesky"
            else None
        )
        items.append(
            {
                "id": r.id,
                "post_id": r.post_id,
                "scheduled_at": r.scheduled_at,
                "published_at": r.published_at,
                "status": r.status,
                "content": r.content or "",
                "platform": platform,
                "handle": r.handle,
                "has_media": bool(r.media_urls),
                "url": url,
            }
        )
    return items


# --- Calendar notes -------------------------------------------------------- #
async def list_notes(
    db: AsyncSession, user_id: uuid.UUID, start: date, end: date
) -> list[CalendarNote]:
    result = await db.execute(
        select(CalendarNote).where(
            CalendarNote.user_id == user_id,
            CalendarNote.note_date >= start,
            CalendarNote.note_date <= end,
        )
    )
    return list(result.scalars().all())


async def upsert_note(
    db: AsyncSession, user_id: uuid.UUID, note_date: date, content: str
) -> CalendarNote:
    result = await db.execute(
        select(CalendarNote).where(
            CalendarNote.user_id == user_id, CalendarNote.note_date == note_date
        )
    )
    note = result.scalar_one_or_none()
    if note is None:
        note = CalendarNote(user_id=user_id, note_date=note_date, content=content)
        db.add(note)
    else:
        note.content = content
    await db.commit()
    await db.refresh(note)
    return note


async def delete_note(db: AsyncSession, user_id: uuid.UUID, note_date: date) -> None:
    result = await db.execute(
        select(CalendarNote).where(
            CalendarNote.user_id == user_id, CalendarNote.note_date == note_date
        )
    )
    note = result.scalar_one_or_none()
    if note is not None:
        await db.delete(note)
        await db.commit()


async def cancel_scheduled(
    db: AsyncSession, user_id: uuid.UUID, scheduled_id: uuid.UUID
) -> ScheduledPost:
    sp = await db.get(ScheduledPost, scheduled_id)
    if sp is None:
        raise errors.not_found("Scheduled post not found")
    post = await db.get(Post, sp.post_id)
    if post is None or post.user_id != user_id:
        raise errors.forbidden()
    if sp.status in (ScheduleStatus.published, ScheduleStatus.publishing):
        raise errors.bad_request("Cannot cancel a post that is already publishing", "already_publishing")
    sp.status = ScheduleStatus.canceled
    await db.commit()
    await db.refresh(sp)
    return sp


# --- Bluesky (real integration) ------------------------------------------- #
async def connect_bluesky(
    db: AsyncSession, user: User, identifier: str, app_password: str
) -> SocialAccount:
    """Validate the app password against Bluesky, then save/update the account."""
    session = await bluesky.create_session(identifier, app_password)
    did = session["did"]
    handle = session["handle"]

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == user.id,
            SocialAccount.platform == SocialPlatform.bluesky,
            SocialAccount.external_id == did,
        )
    )
    acc = result.scalar_one_or_none()
    if acc is not None:
        acc.access_token = app_password
        acc.handle = handle
        acc.display_name = handle
        acc.is_active = True
    else:
        acc = SocialAccount(
            user_id=user.id,
            platform=SocialPlatform.bluesky,
            external_id=did,
            handle=handle,
            display_name=handle,
            access_token=app_password,  # encrypt at rest in production
        )
        db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc


async def connect_mastodon(
    db: AsyncSession, user: User, instance_url: str, access_token: str
) -> SocialAccount:
    """Validate the access token against a Mastodon instance, then save/update the account."""
    account = await mastodon.verify(instance_url, access_token)
    host = mastodon.instance_host(instance_url)
    handle = f"{account['username']}@{host}"  # publish derives the instance from this
    external_id = str(account["id"])
    display = account.get("display_name") or account["username"]

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == user.id,
            SocialAccount.platform == SocialPlatform.mastodon,
            SocialAccount.external_id == external_id,
        )
    )
    acc = result.scalar_one_or_none()
    if acc is not None:
        acc.access_token = access_token
        acc.handle = handle
        acc.display_name = display
        acc.avatar_url = account.get("avatar")
        acc.is_active = True
    else:
        acc = SocialAccount(
            user_id=user.id,
            platform=SocialPlatform.mastodon,
            external_id=external_id,
            handle=handle,
            display_name=display,
            avatar_url=account.get("avatar"),
            access_token=access_token,  # encrypt at rest in production
        )
        db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc


async def connect_linkedin(
    db: AsyncSession,
    user_id: uuid.UUID,
    sub: str,
    name: str,
    access_token: str,
    avatar: str | None = None,
) -> SocialAccount:
    """Save/update a LinkedIn account after the OAuth callback."""
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == user_id,
            SocialAccount.platform == SocialPlatform.linkedin,
            SocialAccount.external_id == sub,
        )
    )
    acc = result.scalar_one_or_none()
    handle = (name or "LinkedIn")[:120]
    if acc is not None:
        acc.access_token = access_token
        acc.handle = handle
        acc.display_name = name
        acc.avatar_url = avatar
        acc.is_active = True
    else:
        acc = SocialAccount(
            user_id=user_id,
            platform=SocialPlatform.linkedin,
            external_id=sub,
            handle=handle,
            display_name=name,
            avatar_url=avatar,
            access_token=access_token,  # encrypt at rest in production
        )
        db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc


def _load_post_media(
    post: Post,
) -> tuple[list[tuple[bytes, str]], tuple[bytes, str] | None, tuple[int, int] | None]:
    """Read a post's media from disk. A post is either images (up to 4) or one video."""
    images: list[tuple[bytes, str]] = []
    video: tuple[bytes, str] | None = None
    aspect: tuple[int, int] | None = None
    for url in post.media_urls or []:
        path = UPLOAD_DIR / pathlib.Path(url).name
        if not path.exists():
            continue
        ext = path.suffix.lower()
        if ext in _VIDEO_MIME and video is None:
            video = (path.read_bytes(), _VIDEO_MIME[ext])
            from app.services import video as video_service

            aspect = video_service.probe_dimensions(video[0])
        elif ext in _MIME:
            images.append((path.read_bytes(), _MIME[ext]))
    return images, video, aspect


async def publish_to_account(post: Post, account: SocialAccount) -> str:
    """Publish `post` to one `account`; return the external post URL/URI or raise.

    Shared by immediate publish and the scheduled-post worker.
    """
    if not account.access_token:
        raise errors.bad_request(
            "Live publishing isn't available for this platform yet.", "platform_unsupported"
        )
    images, video, aspect = _load_post_media(post)

    if account.platform == SocialPlatform.bluesky:
        return await bluesky.publish(
            account.handle, account.access_token, post.content, images,
            video=video, aspect_ratio=aspect,
        )
    if account.platform == SocialPlatform.mastodon:
        # Handle is stored as "username@host"; the instance is https://<host>.
        instance = f"https://{account.handle.split('@')[-1]}"
        return await mastodon.publish(
            instance, account.access_token, post.content, images, video=video
        )
    if account.platform == SocialPlatform.linkedin:
        # LinkedIn supports text + images (video is a separate upload flow, not yet wired).
        return await linkedin.publish(
            account.access_token, account.external_id, post.content, images
        )
    raise errors.bad_request(
        "Live publishing isn't available for this platform yet.", "platform_unsupported"
    )


async def publish_now(
    db: AsyncSession, user: User, post_id: uuid.UUID, account_ids: list[uuid.UUID]
) -> list[dict]:
    """Publish a post to the selected accounts immediately (real send for Bluesky)."""
    post = await db.get(Post, post_id)
    if post is None or post.user_id != user.id:
        raise errors.not_found("Post not found")

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id.in_(account_ids), SocialAccount.user_id == user.id
        )
    )
    accounts = list(result.scalars().all())
    if not accounts:
        raise errors.bad_request("No valid accounts selected", "invalid_accounts")

    outcomes: list[dict] = []
    published_any = False
    for acc in accounts:
        sp = ScheduledPost(
            post_id=post.id,
            social_account_id=acc.id,
            scheduled_at=datetime.now(timezone.utc),
        )
        try:
            ext = await publish_to_account(post, acc)
            sp.status = ScheduleStatus.published
            sp.published_at = datetime.now(timezone.utc)
            sp.external_post_id = ext
            published_any = True
            url = bluesky.post_url(ext, acc.handle) if acc.platform == SocialPlatform.bluesky else ext
            outcomes.append({
                "account_id": acc.id, "platform": acc.platform.value,
                "status": "published", "url": url,
            })
        except Exception as exc:  # noqa: BLE001 - report per-account
            detail = getattr(exc, "detail", str(exc))
            if getattr(exc, "code", "") == "platform_unsupported":
                sp.status = ScheduleStatus.queued
                outcomes.append({
                    "account_id": acc.id, "platform": acc.platform.value,
                    "status": "queued",
                    "error": "Live publishing isn't wired for this platform yet.",
                })
            else:
                sp.status = ScheduleStatus.failed
                sp.error_message = str(detail)[:500]
                outcomes.append({
                    "account_id": acc.id, "platform": acc.platform.value,
                    "status": "failed", "error": str(detail),
                })
        db.add(sp)

    post.status = PostStatus.published if published_any else PostStatus.scheduled
    await db.commit()
    return outcomes
