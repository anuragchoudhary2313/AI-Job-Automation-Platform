"""Unified admin CLI for user maintenance tasks."""

import argparse
import asyncio

from app.db.mongo import init_db
from app.models.enums import UserRole
from app.models.user import User


DEFAULT_EMAIL = "dynamicbaba6@gmail.com"


async def _find_user(email: str) -> User | None:
    return await User.find_one(User.email == email)


async def inspect_user(email: str) -> int:
    """Inspect user profile and role."""
    await init_db()

    print("\n=== INSPECTING USER ===\n")
    user = await _find_user(email)
    if not user:
        print(f"ERROR: User '{email}' not found")
        return 1

    print(f"User: {user.email}")
    print(f"ID: {user.id}")
    print(f"Username: {user.username}")
    print(f"Role: {user.role}")
    print(f"Active: {user.is_active}")

    return 0


async def promote_user_to_admin(email: str) -> int:
    """Promote a user to admin role."""
    await init_db()

    print("\n=== PROMOTING USER TO ADMIN ===\n")
    user = await _find_user(email)
    if not user:
        print(f"ERROR: User '{email}' not found")
        return 1

    if user.role == UserRole.ADMIN:
        print(f"{email} is already an admin")
        return 0

    user.role = UserRole.ADMIN
    await user.save()
    print(f"Successfully promoted {email} to admin")
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="User maintenance operations for backend admins"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    inspect_cmd = subparsers.add_parser(
        "inspect-user",
        help="Inspect user profile and role",
    )
    inspect_cmd.add_argument("--email", default=DEFAULT_EMAIL, help="User email")

    promote_cmd = subparsers.add_parser(
        "promote-admin",
        help="Promote user role to admin",
    )
    promote_cmd.add_argument("--email", default=DEFAULT_EMAIL, help="User email")

    return parser


async def _dispatch(args: argparse.Namespace) -> int:
    if args.command == "inspect-user":
        return await inspect_user(email=args.email)

    if args.command == "promote-admin":
        return await promote_user_to_admin(email=args.email)

    print(f"Unknown command: {args.command}")
    return 1


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    raise SystemExit(asyncio.run(_dispatch(args)))


if __name__ == "__main__":
    main()