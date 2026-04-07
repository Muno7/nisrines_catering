from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required
from sqlalchemy.exc import SQLAlchemyError

from . import bp
from ...services import CategoryService
from ...exceptions import ValidationError, ConflictError, NotFoundError


@bp.get("/categories")
@login_required
def categories():
    all_categories = CategoryService.list_all()
    counts = CategoryService.product_counts()
    return render_template("admin/categories.html", categories=all_categories, counts=counts)


@bp.post("/categories")
@login_required
def manage_categories():
    action = request.form.get("action")
    all_categories = CategoryService.list_all()

    if action == "create":
        try:
            CategoryService.create(request.form.get("name") or "")
            flash("Category created.", "success")
        except (ValidationError, ConflictError) as e:
            flash(str(e), "danger")
        except SQLAlchemyError:
            flash("A database error occurred.", "danger")

    elif action == "update":
        try:
            category = CategoryService._get_or_raise(request.form.get("category_id", type=int))
            CategoryService.update(
                category,
                name=request.form.get("name") or None,
                sort_order=request.form.get("sort_order", type=int),
            )
            flash("Category updated.", "success")
        except NotFoundError:
            flash("Category not found.", "danger")
        except (ValidationError, ConflictError) as e:
            flash(str(e), "danger")
        except SQLAlchemyError:
            flash("A database error occurred.", "danger")

    elif action == "reorder":
        try:
            for cat in all_categories:
                new_name = (request.form.get(f"name_{cat.id}") or "").strip()
                new_order = request.form.get(f"order_{cat.id}", type=int)
                CategoryService.update(
                    cat,
                    name=new_name if new_name and new_name != cat.name else None,
                    sort_order=new_order if new_order is not None and new_order != cat.sort_order else None,
                )
            flash("Category order updated.", "success")
        except (ValidationError, ConflictError) as e:
            flash(str(e), "danger")
        except SQLAlchemyError:
            flash("A database error occurred.", "danger")

    return redirect(url_for("admin.categories"))


@bp.post("/categories/<int:category_id>/set-status")
@login_required
def set_category_status(category_id: int):
    category = CategoryService._get_or_raise(category_id)

    payload = request.get_json(silent=True) or {}
    status = (payload.get("status") or request.form.get("status") or "").strip().lower()

    if status not in {"active", "inactive"}:
        return jsonify({"ok": False, "message": "Invalid status."}), 400

    CategoryService.set_active(category, status == "active")
    return jsonify({
        "ok": True,
        "status": "active" if category.active else "inactive",
        "active": category.active,
    })


@bp.post("/categories/<int:category_id>/delete")
@login_required
def delete_category(category_id: int):
    try:
        category = CategoryService._get_or_raise(category_id)
        CategoryService.delete(category)
        flash("Category deleted.", "success")
    except NotFoundError:
        flash("Category not found.", "danger")
    except ValidationError as e:
        flash(str(e), "warning")
    except SQLAlchemyError:
        flash("A database error occurred.", "danger")
    return redirect(url_for("admin.categories"))
