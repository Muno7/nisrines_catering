from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required
from sqlalchemy.exc import SQLAlchemyError

from . import bp
from ...services import ImageService, SlideshowService
from ...exceptions import ValidationError, NotFoundError
from ..forms import SlideshowForm


@bp.get("/slideshow")
@login_required
def slideshow():
    return render_template(
        "admin/slideshow.html",
        form=SlideshowForm(),
        images=SlideshowService._get_all(),
    )


@bp.post("/slideshow")
@login_required
def upload_slideshow():
    form = SlideshowForm()

    if not form.validate():
        flash("Invalid form submission.", "danger")
        return redirect(url_for("admin.slideshow"))

    files = request.files.getlist("images")
    if not files or not any(f.filename for f in files):
        flash("Please select at least one image.", "warning")
        return redirect(url_for("admin.slideshow"))

    uploaded, errors = 0, []
    for file in files:
        if not file or not file.filename:
            continue
        try:
            url = ImageService.upload(file)
            SlideshowService.create(url, SlideshowService.next_order())
            uploaded += 1
        except (ValidationError, SQLAlchemyError) as e:
            errors.append(f"{file.filename}: {e}")

    if uploaded:
        flash(f"Added {uploaded} slideshow image(s).", "success")
    if errors:
        flash("Failed to upload: " + "; ".join(errors), "danger")
    if not uploaded and not errors:
        flash("No images were uploaded.", "warning")

    return redirect(url_for("admin.slideshow"))


@bp.post("/slideshow/<slide_id>/delete")
@login_required
def delete_slide(slide_id: str):
    try:
        slide = SlideshowService._get_or_raise(slide_id)
        SlideshowService.delete(slide)
        flash("Slide removed.", "success")
    except NotFoundError:
        flash("Slide not found.", "danger")
    except SQLAlchemyError:
        flash("Failed to delete slide due to a database error.", "danger")
    return redirect(url_for("admin.slideshow"))


@bp.post("/slideshow/reorder")
@login_required
def reorder_slideshow():
    ids = request.form.getlist("item_ids")
    try:
        SlideshowService.reorder(ids)
        flash("Slide order updated.", "success")
    except SQLAlchemyError:
        flash("Failed to save slide order due to a database error.", "danger")
    return redirect(url_for("admin.slideshow"))
