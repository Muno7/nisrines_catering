from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import SubscriptionPlan
from ..exceptions import ConflictError, NotFoundError


class SubscriptionService:

    @staticmethod
    def list_all() -> list[SubscriptionPlan]:
        return SubscriptionPlan.query.order_by(
            SubscriptionPlan.audience, SubscriptionPlan.days_per_month
        ).all()

    @staticmethod
    def _get_or_raise(plan_id: str) -> SubscriptionPlan:
        plan = db.session.get(SubscriptionPlan, plan_id)
        if not plan:
            raise NotFoundError("Subscription plan not found.")
        return plan

    @staticmethod
    def create(
        *,
        audience: str,
        days_per_month: int,
        price_plat_du_jour: int,
        price_with_salad: int,
    ) -> SubscriptionPlan:
        # Conflict check — needs the DB
        if SubscriptionPlan.query.filter_by(
            audience=audience, days_per_month=days_per_month
        ).first():
            raise ConflictError(
                f"A plan for '{audience}' with {days_per_month} days/month already exists."
            )

        plan = SubscriptionPlan()
        plan.set_audience(audience)
        plan.set_days_per_month(days_per_month)
        plan.set_price_plat_du_jour(price_plat_du_jour)
        plan.set_price_with_salad(price_with_salad)

        try:
            db.session.add(plan)
            db.session.commit()
            return plan
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def update(
        plan: SubscriptionPlan,
        *,
        audience: str,
        days_per_month: int,
        price_plat_du_jour: int,
        price_with_salad: int,
    ) -> SubscriptionPlan:
        # Conflict check — another plan occupying the same slot
        conflict = (
            SubscriptionPlan.query.filter_by(audience=audience, days_per_month=days_per_month)
            .filter(SubscriptionPlan.id != plan.id)
            .first()
        )
        if conflict:
            raise ConflictError(
                f"Another plan for '{audience}' with {days_per_month} days/month already exists."
            )

        plan.set_audience(audience)
        plan.set_days_per_month(days_per_month)
        plan.set_price_plat_du_jour(price_plat_du_jour)
        plan.set_price_with_salad(price_with_salad)

        try:
            db.session.commit()
            return plan
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(plan: SubscriptionPlan) -> None:
        try:
            db.session.delete(plan)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise
