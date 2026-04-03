from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required
from sqlalchemy.exc import SQLAlchemyError

from . import bp
from ...services import SubscriptionService
from ...exceptions import ValidationError, ConflictError, NotFoundError
from ..forms import SubscriptionPlanForm


@bp.get("/subscriptions")
@login_required
def subscriptions():
    plans = SubscriptionService.list_all()
    return render_template(
        "admin/subscriptions.html",
        person_plans=[p for p in plans if p.audience == "person"],
        family_plans=[p for p in plans if p.audience == "family"],
    )


@bp.get("/subscriptions/new")
@login_required
def new_subscription_plan():
    return render_template(
        "admin/subscription_form.html",
        form=SubscriptionPlanForm(),
        plan=None,
        is_edit=False,
    )


@bp.post("/subscriptions/new")
@login_required
def create_subscription_plan():
    form = SubscriptionPlanForm()
    if form.validate():
        try:
            SubscriptionService.create(
                audience=form.audience.data,
                days_per_month=form.days_per_month.data,
                price_plat_du_jour=form.price_plat_du_jour.data,
                price_with_salad=form.price_with_salad.data,
            )
            flash("Subscription plan created.", "success")
            return redirect(url_for("admin.subscriptions"))
        except (ValidationError, ConflictError) as e:
            flash(str(e), "danger")
        except SQLAlchemyError:
            flash("A database error occurred.", "danger")

    return render_template("admin/subscription_form.html", form=form, plan=None, is_edit=False)


@bp.get("/subscriptions/<plan_id>/edit")
@login_required
def edit_subscription_plan(plan_id: str):
    try:
        plan = SubscriptionService._get_or_raise(plan_id)
    except NotFoundError:
        flash("Subscription plan not found.", "danger")
        return redirect(url_for("admin.subscriptions"))

    return render_template(
        "admin/subscription_form.html",
        form=SubscriptionPlanForm(obj=plan),
        plan=plan,
        is_edit=True,
    )


@bp.post("/subscriptions/<plan_id>/edit")
@login_required
def update_subscription_plan(plan_id: str):
    try:
        plan = SubscriptionService._get_or_raise(plan_id)
    except NotFoundError:
        flash("Subscription plan not found.", "danger")
        return redirect(url_for("admin.subscriptions"))

    form = SubscriptionPlanForm()
    if form.validate():
        try:
            SubscriptionService.update(
                plan,
                audience=form.audience.data,
                days_per_month=form.days_per_month.data,
                price_plat_du_jour=form.price_plat_du_jour.data,
                price_with_salad=form.price_with_salad.data,
            )
            flash("Subscription plan updated.", "success")
            return redirect(url_for("admin.subscriptions"))
        except (ValidationError, ConflictError) as e:
            flash(str(e), "danger")
        except SQLAlchemyError:
            flash("A database error occurred.", "danger")

    return render_template("admin/subscription_form.html", form=form, plan=plan, is_edit=True)


@bp.post("/subscriptions/<plan_id>/delete")
@login_required
def delete_subscription_plan(plan_id: str):
    try:
        plan = SubscriptionService._get_or_raise(plan_id)
        SubscriptionService.delete(plan)
        flash("Subscription plan deleted.", "success")
    except NotFoundError:
        flash("Subscription plan not found.", "danger")
    except SQLAlchemyError:
        flash("A database error occurred.", "danger")
    return redirect(url_for("admin.subscriptions"))
