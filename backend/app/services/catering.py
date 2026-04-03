from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import CateringMenuImage
from ..exceptions import NotFoundError


class CateringService:

    @staticmethod
    def _get_or_raise(menu_id: str) -> CateringMenuImage:
        menu = db.session.get(CateringMenuImage, menu_id)
        if not menu:
            raise NotFoundError("Catering menu image not found.")
        return menu

    @staticmethod
    def _get_all() -> list[CateringMenuImage]:
        return CateringMenuImage.query.order_by(
            CateringMenuImage.sort_order, CateringMenuImage.created_at
        ).all()

    @staticmethod
    def next_order() -> int:
        return (
            db.session.query(func.coalesce(func.max(CateringMenuImage.sort_order), 0)).scalar() or 0
        ) + 1

    @staticmethod
    def create(image_url: str, sort_order: int) -> CateringMenuImage:
        menu = CateringMenuImage(sort_order=sort_order)
        menu.set_image(image_url)  # raises ValueError if blank

        try:
            db.session.add(menu)
            db.session.commit()
            return menu
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(menu: CateringMenuImage) -> None:
        try:
            db.session.delete(menu)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def reorder(updates: dict[str, int]) -> None:
        try:
            for menu_id, order in updates.items():
                menu = db.session.get(CateringMenuImage, menu_id)
                if menu:
                    menu.sort_order = order
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise
