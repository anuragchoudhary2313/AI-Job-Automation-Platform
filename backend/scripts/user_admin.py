"""Unified admin CLI for user/team maintenance tasks.

This script consolidates team assignment checks, team removal, and admin promotion
to avoid scattered one-off maintenance scripts.
"""

import argparse
import asyncio

from app.db.mongo import init_db
from app.models.enums import UserRole
from app.models.team import Team
from app.models.user import User


DEFAULT_EMAIL = "dynamicbaba6@gmail.com"


async def _find_user(email: str) -> User | None:
    return await User.find_one(User.email == email)


async def check_and_fix_user_team(email: str, auto_assign: bool = True) -> int:
    """Show team overview and optionally assign user to first team if missing."""
    await init_db()

    print("\n=== CHECKING USER AND TEAMS ===\n")
    user = await _find_user(email)
    if not user:
        print(f"ERROR: User '{email}' not found")
        return 1

    print(f"User: {user.email}")
    print(f"Current team_id: {user.team_id}")

    teams = await Team.find_all().to_list()
    print(f"\nFound {len(teams)} teams in database:")

    for idx, team in enumerate(teams, start=1):
        team_users = await User.find(User.team_id == str(team.id)).to_list()
        print(f"\n  Team {idx}:")
        print(f"    ID: {team.id}")
        print(f"    Name: {team.name}")
        print(f"    Users: {len(team_users)}")
        for team_user in team_users:
            print(f"      - {team_user.email}")

    if user.team_id is None and teams and auto_assign:
        first_team = teams[0]
        print(f"\n>>> Assigning user to team: {first_team.name}")
        user.team_id = str(first_team.id)
        await user.save()
        print("[OK] User assigned to team successfully")
        print(f"New team_id: {user.team_id}")

    return 0


async def remove_user_from_team(email: str) -> int:
    """Remove a user from the current team."""
    await init_db()

    print("\n=== REMOVING USER FROM TEAM ===\n")
    user = await _find_user(email)
    if not user:
        print(f"ERROR: User '{email}' not found")
        return 1

    print(f"User found: {user.email}")
    print(f"Current team_id: {user.team_id}")

    user.team_id = None
    await user.save()

    print("\n[OK] User removed from team successfully")
    print(f"New team_id: {user.team_id}")
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
        description="User/team maintenance operations for backend admins"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    check_cmd = subparsers.add_parser(
        "check-fix-team",
        help="Inspect team membership and auto-assign user to first team when missing",
    )
    check_cmd.add_argument("--email", default=DEFAULT_EMAIL, help="User email")
    check_cmd.add_argument(
        "--no-auto-assign",
        action="store_true",
        help="Only inspect state and do not assign user to a team",
    )

    remove_cmd = subparsers.add_parser(
        "remove-from-team",
        help="Remove user from current team",
    )
    remove_cmd.add_argument("--email", default=DEFAULT_EMAIL, help="User email")

    promote_cmd = subparsers.add_parser(
        "promote-admin",
        help="Promote user role to admin",
    )
    promote_cmd.add_argument("--email", default=DEFAULT_EMAIL, help="User email")

    return parser


async def _dispatch(args: argparse.Namespace) -> int:
    if args.command == "check-fix-team":
        return await check_and_fix_user_team(
            email=args.email,
            auto_assign=not args.no_auto_assign,
        )

    if args.command == "remove-from-team":
        return await remove_user_from_team(email=args.email)

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