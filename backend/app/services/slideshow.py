from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import SlideshowImage
from ..exceptions import NotFoundError


class SlideshowService:

    @staticmethod
    def _get_or_raise(slide_id: str) -> SlideshowImage:
        slide = db.session.get(SlideshowImage, slide_id)
        if not slide:
            raise NotFoundError("Slide not found.")
        return slide

    @staticmethod
    def _get_all() -> list[SlideshowImage]:
        return SlideshowImage.query.order_by(
            SlideshowImage.sort_order, SlideshowImage.created_at
        ).all()

    @staticmethod
    def next_order() -> int:
        return (
            db.session.query(func.coalesce(func.max(SlideshowImage.sort_order), 0)).scalar() or 0
        ) + 1

    @staticmethod
    def create(image_url: str, sort_order: int) -> SlideshowImage:
        slide = SlideshowImage(sort_order=sort_order)
        slide.set_image(image_url)  # raises ValueError if blank

        try:
            db.session.add(slide)
            db.session.commit()
            return slide
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(slide: SlideshowImage) -> None:
        try:
            db.session.delete(slide)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def reorder(updates: dict[str, int]) -> None:
        try:
            for slide_id, order in updates.items():
                slide = db.session.get(SlideshowImage, slide_id)
                if slide:
                    slide.sort_order = order
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise
