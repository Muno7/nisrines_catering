from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required
from sqlalchemy.exc import SQLAlchemyError

from . import bp
from ...services import ImageService, CateringService
from ...exceptions import ValidationError, NotFoundError
from ..forms import CateringMenuForm


@bp.get("/catering")
@login_required
def catering():
    return render_template(
        "admin/catering.html",
        form=CateringMenuForm(),
        menus=CateringService.list_all(),
    )


@bp.post("/catering")
@login_required
def upload_catering():
    form = CateringMenuForm()

    if not form.validate():
        flash("Invalid form submission.", "danger")
        return redirect(url_for("admin.catering"))

    files = request.files.getlist("images")
    if not files or not any(f.filename for f in files):
        flash("Please select at least one image.", "warning")
        return redirect(url_for("admin.catering"))

    uploaded, errors = 0, []
    for file in files:
        if not file or not file.filename:
            continue
        try:
            url = ImageService.upload(file)
            CateringService.create(url)
            uploaded += 1
        except (ValidationError, SQLAlchemyError) as e:
            errors.append(f"{file.filename}: {e}")

    if uploaded:
        flash(f"Added {uploaded} catering menu image(s).", "success")
    if errors:
        flash("Failed to upload: " + "; ".join(errors), "danger")
    if not uploaded and not errors:
        flash("No images were uploaded.", "warning")

    return redirect(url_for("admin.catering"))


@bp.post("/catering/<menu_id>/delete")
@login_required
def delete_catering_menu(menu_id: str):
    try:
        menu = CateringService._get_or_raise(menu_id)
        CateringService.delete(menu)
        flash("Catering menu image removed.", "success")
    except NotFoundError:
        flash("Image not found.", "danger")
    except SQLAlchemyError:
        flash("Failed to delete catering menu image due to a database error.", "danger")
    return redirect(url_for("admin.catering"))


@bp.post("/catering/reorder")
@login_required
def reorder_catering_menus():
    ids = request.form.getlist("item_ids")
    try:
        CateringService.reorder(ids)
        flash("Catering menu order updated.", "success")
    except SQLAlchemyError:
        flash("Failed to save catering menu order due to a database error.", "danger")
    return redirect(url_for("admin.catering"))
