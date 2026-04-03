from flask import render_template, redirect, url_for, flash, request, jsonify
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
    images = SlideshowService._get_all()
    wants_json = request.accept_mimetypes["application/json"] >= request.accept_mimetypes["text/html"]

    if not form.validate():
        if wants_json:
            return jsonify({"ok": False, "uploaded": 0, "errors": ["Invalid form submission."]}), 400
        return render_template("admin/slideshow.html", form=form, images=images)

    files = request.files.getlist("images")
    if not files or not any(f.filename for f in files):
        if wants_json:
            return jsonify({"ok": False, "uploaded": 0, "errors": ["No files provided."]}), 400
        flash("Please select at least one image.", "warning")
        return render_template("admin/slideshow.html", form=form, images=images)

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

    if wants_json:
        return jsonify({"ok": uploaded > 0, "uploaded": uploaded, "errors": errors}), (200 if uploaded else 400)

    if uploaded:
        flash(f"Added {uploaded} slideshow image(s).", "success")
    if errors:
        flash(f"Failed to upload {len(errors)} image(s): " + "; ".join(errors), "danger")
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
        flash("A database error occurred.", "danger")
    return redirect(url_for("admin.slideshow"))


@bp.post("/slideshow/reorder")
@login_required
def reorder_slideshow():
    slides = SlideshowService._get_all()
    updates = {}
    for slide in slides:
        key = f"order_{slide.id}"
        if key in request.form:
            try:
                updates[slide.id] = int(request.form[key])
            except ValueError:
                continue
    try:
        SlideshowService.reorder(updates)
        flash("Slide order updated.", "success")
    except SQLAlchemyError:
        flash("A database error occurred.", "danger")
    return redirect(url_for("admin.slideshow"))
