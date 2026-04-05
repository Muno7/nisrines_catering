from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required
from sqlalchemy.exc import SQLAlchemyError

from . import bp
from ...services import ImageService, ProductService, CategoryService
from ...exceptions import ValidationError, ConflictError, NotFoundError
from ..forms import ProductForm


@bp.get("/products")
@login_required
def products():
    filters = {
        "q": request.args.get("q", "").strip(),
        "category_id": request.args.get("category_id", type=int),
        "status": request.args.get("status", "all").strip().lower(),
        "day": request.args.get("day", "").strip().lower(),
        "missing_image": request.args.get("missing_image") == "1",
    }

    items = ProductService.list_filtered(**filters)
    categories = CategoryService.list_all()
    stats = ProductService.stats(items)

    return render_template(
        "admin/products.html",
        products=items,
        stats=stats,
        categories=categories,
        filters=filters,
    )


@bp.route("/products/new", methods=["GET", "POST"])
@login_required
def new_product():
    form = ProductForm()

    if form.validate_on_submit():
        # --- image upload ---
        image_url = None
        file = form.image.data
        if file and getattr(file, "filename", ""):
            try:
                image_url = ImageService.upload(file)
            except ValidationError as e:
                flash(str(e), "danger")
                return render_template("admin/product_form.html", form=form, is_edit=False, product=None)

        if not form.category_id.data:
            flash("Please select a category.", "danger")
            return render_template("admin/product_form.html", form=form, is_edit=False, product=None)

        # --- create product ---
        try:
            ProductService.create(
                name=form.name.data,
                name_ar=form.name_ar.data,
                price_single=form.priceSingleCents.data,
                price_family=form.priceFamilyCents.data or 0,
                image=image_url,
                category_id=form.category_id.data,
                ingredients=form.ingredients.data or "",
                day=form.day.data or None,
                status=form.status.data or "active",
            )
        except (ValidationError, ConflictError) as e:
            flash(str(e), "danger")
            return render_template("admin/product_form.html", form=form, is_edit=False, product=None)
        except SQLAlchemyError:
            flash("A database error occurred.", "danger")
            return render_template("admin/product_form.html", form=form, is_edit=False, product=None)

        if "save_add_another" in request.form:
            flash("Product created. Add another.", "success")
            return redirect(url_for("admin.new_product"))

        flash("Product created.", "success")
        return redirect(url_for("admin.products"))

    return render_template("admin/product_form.html", form=form, is_edit=False, product=None)


@bp.route("/products/<product_id>/edit", methods=["GET", "POST"])
@login_required
def edit_product(product_id: str):
    try:
        product = ProductService._get_or_raise(product_id)
    except NotFoundError:
        flash("Product not found.", "danger")
        return redirect(url_for("admin.products"))

    form = ProductForm(obj=product)

    if request.method == "GET":
        if product.category_id:
            form.category_id.data = product.category_id
        if not product.status:
            form.status.data = "active" if product.is_active else "inactive"
        if product.priceFamilyCents == 0:
            form.priceFamilyCents.data = None

    if form.validate_on_submit():
        # --- image upload ---
        image_url = None
        file = form.image.data
        if file and getattr(file, "filename", ""):
            try:
                image_url = ImageService.upload(file)
            except ValidationError as e:
                flash(str(e), "danger")
                return render_template("admin/product_form.html", form=form, product=product, is_edit=True)

        # --- update product ---
        try:
            ProductService.update(
                product,
                name=form.name.data,
                name_ar=form.name_ar.data,
                price_single=form.priceSingleCents.data,
                price_family=form.priceFamilyCents.data or 0,
                image=image_url,
                category_id=form.category_id.data or None,
                ingredients=form.ingredients.data or "",
                day=form.day.data or None,
                status=form.status.data or "active",
            )
        except (ValidationError, ConflictError) as e:
            flash(str(e), "danger")
            return render_template("admin/product_form.html", form=form, product=product, is_edit=True)
        except SQLAlchemyError:
            flash("A database error occurred.", "danger")
            return render_template("admin/product_form.html", form=form, product=product, is_edit=True)

        if "save_duplicate" in request.form:
            try:
                copy = ProductService.duplicate(product)
                flash("Product duplicated as draft.", "success")
                return redirect(url_for("admin.edit_product", product_id=copy.id))
            except SQLAlchemyError:
                flash("Failed to duplicate product.", "danger")

        flash("Product updated.", "success")
        return redirect(url_for("admin.products"))

    return render_template("admin/product_form.html", form=form, product=product, is_edit=True)


@bp.post("/products/<product_id>/toggle")
@login_required
def toggle_product(product_id: str):
    try:
        product = ProductService._get_or_raise(product_id)
    except NotFoundError:
        return jsonify({"ok": False, "message": "Product not found."}), 404

    payload = request.get_json(silent=True) or {}
    desired = payload.get("is_active", request.form.get("is_active"))
    if desired is None:
        return jsonify({"ok": False, "message": "Missing desired state."}), 400

    new_status = "active" if str(desired).lower() in {"true", "1", "on", "yes"} else "inactive"

    try:
        ProductService.set_status(product, new_status)
    except ValidationError as e:
        return jsonify({"ok": False, "message": str(e)}), 400
    except SQLAlchemyError:
        return jsonify({"ok": False, "message": "Database error."}), 500

    if request.is_json or request.headers.get("Accept") == "application/json":
        return jsonify({"ok": True, "is_active": product.is_active, "status": product.status})

    flash(f"Product {'activated' if product.is_active else 'paused'}.", "success")
    return redirect(request.referrer or url_for("admin.products"))


@bp.post("/products/<product_id>/set-status")
@login_required
def set_product_status(product_id: str):
    try:
        product = ProductService._get_or_raise(product_id)
    except NotFoundError:
        return jsonify({"ok": False, "message": "Product not found."}), 404

    payload = request.get_json(silent=True) or {}
    status = (payload.get("status") or request.form.get("status") or "").strip().lower()

    try:
        ProductService.set_status(product, status)
        return jsonify({"ok": True, "status": product.status, "is_active": product.is_active})
    except ValidationError as e:
        return jsonify({"ok": False, "message": str(e)}), 400
    except SQLAlchemyError:
        return jsonify({"ok": False, "message": "Database error."}), 500


@bp.post("/products/<product_id>/duplicate")
@login_required
def duplicate_product(product_id: str):
    try:
        product = ProductService._get_or_raise(product_id)
        copy = ProductService.duplicate(product)
        flash("Product duplicated as draft.", "success")
        return redirect(url_for("admin.edit_product", product_id=copy.id))
    except NotFoundError:
        flash("Product not found.", "danger")
    except SQLAlchemyError:
        flash("A database error occurred.", "danger")
    return redirect(url_for("admin.products"))


@bp.post("/products/<product_id>/delete")
@login_required
def delete_product(product_id: str):
    try:
        product = ProductService._get_or_raise(product_id)
        ProductService.delete(product)
        flash("Product deleted.", "success")
    except NotFoundError:
        flash("Product not found.", "danger")
    except SQLAlchemyError:
        flash("A database error occurred.", "danger")
    return redirect(url_for("admin.products"))


@bp.post("/products/bulk")
@login_required
def bulk_products():
    product_ids = request.form.getlist("product_ids")
    if not product_ids:
        flash("Select at least one product.", "warning")
        return redirect(url_for("admin.products"))

    try:
        updated = ProductService.bulk_update(
            product_ids=product_ids,
            status=request.form.get("bulk_status"),
            category_id=request.form.get("bulk_category_id", type=int),
            price_single=request.form.get("bulk_price_single", type=int),
            price_family=request.form.get("bulk_price_family", type=int),
            day=(request.form.get("bulk_day") or "").strip().lower() or None,
        )
        flash(f"Bulk updated {updated} products.", "success")
    except ValidationError as e:
        flash(str(e), "danger")
    except SQLAlchemyError:
        flash("A database error occurred.", "danger")

    return redirect(url_for("admin.products"))
