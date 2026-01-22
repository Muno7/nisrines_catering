from collections import Counter

from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    flash,
    request,
    jsonify,
    session,
)
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import or_

from ..extensions import db
from ..models import User, Product, Category, slugify
from .forms import LoginForm, ProductForm
from ..s3 import upload_file

admin_bp = Blueprint("admin", __name__, template_folder="../templates/admin")

VALID_STATUSES = {"active", "inactive"}


def _status_value(product: Product) -> str:
    return product.status or ("active" if product.is_active else "inactive")


def _category_choices(include_placeholder: bool = True) -> list[tuple[int, str]]:
    categories = Category.query.order_by(Category.sort_order, Category.name).all()
    choices: list[tuple[int, str]] = []
    if include_placeholder:
        choices.append((0, "Select category"))
    choices.extend([(c.id, c.name) for c in categories])
    return choices


def _resolve_category(form: ProductForm) -> Category | None:
    if form.new_category.data and form.new_category.data.strip():
        return Category.ensure(form.new_category.data.strip())
    if form.category_id.data:
        return Category.query.get(form.category_id.data)
    return None


def _apply_status(product: Product, status: str) -> None:
    product.status = status
    product.is_active = status == "active"


@admin_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("admin.products"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            return redirect(url_for("admin.products"))
        flash("Invalid credentials", "danger")
    return render_template("admin/login.html", form=form)


@admin_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out", "info")
    return redirect(url_for("admin.login"))


@admin_bp.route("/products")
@login_required
def products():
    q = request.args.get("q", "").strip()
    category_id = request.args.get("category_id", type=int)
    status_filter = request.args.get("status", "all").strip().lower()
    missing_image = request.args.get("missing_image") == "1"

    base_query = Product.query

    if q:
        base_query = base_query.filter(Product.name.ilike(f"%{q}%"))
    if category_id:
        base_query = base_query.filter(Product.category_id == category_id)
    if status_filter in VALID_STATUSES:
        base_query = base_query.filter(Product.status == status_filter)
    if missing_image:
        base_query = base_query.filter(or_(Product.image == "", Product.image.is_(None)))

    items = base_query.order_by(Product.updated_at.desc()).all()
    all_items = Product.query.order_by(Product.updated_at.desc()).all()

    categories = Category.query.order_by(Category.sort_order, Category.name).all()
    category_counts = Counter([p.category for p in items if p.category])
    stats = {
        "total": len(all_items),
        "active": sum(1 for p in all_items if _status_value(p) == "active"),
        "inactive": sum(1 for p in all_items if _status_value(p) == "inactive"),
        "visible": len(items),
    }
    latest = items[0] if items else None
    return render_template(
        "admin/products.html",
        products=items,
        stats=stats,
        category_counts=category_counts,
        latest=latest,
        categories=categories,
        filters={
            "q": q,
            "category_id": category_id,
            "status": status_filter,
            "missing_image": missing_image,
        },
    )


@admin_bp.route("/products/new", methods=["GET", "POST"])
@login_required
def new_product():
    defaults = {
        "category_id": session.get("last_category_id", 0),
        "status": session.get("last_status", "active"),
    }
    form = ProductForm(data=defaults if request.method == "GET" else None)
    form.category_id.choices = _category_choices()
    categories = Category.query.order_by(Category.sort_order, Category.name).all()

    if form.validate_on_submit():
        file = form.image.data
        if not file:
            flash("Please upload a product image.", "danger")
            return render_template(
                "admin/product_form.html",
                form=form,
                is_edit=False,
                product=None,
                categories=categories,
            )

        ok, result = upload_file(file)
        if not ok:
            flash(result, "danger")
            return render_template(
                "admin/product_form.html",
                form=form,
                is_edit=False,
                product=None,
                categories=categories,
            )

        category_obj = _resolve_category(form)
        if not category_obj and not (form.new_category.data and form.new_category.data.strip()):
            flash("Choose an existing category or create a new one.", "danger")
            return render_template(
                "admin/product_form.html",
                form=form,
                is_edit=False,
                product=None,
                categories=categories,
            )

        if category_obj:
            category_name = category_obj.name
        else:
            category_name = (form.new_category.data or "").strip()

        family_price = form.priceFamilyCents.data or 0

        product = Product(
            name=form.name.data.strip(),
            priceSingleCents=form.priceSingleCents.data,
            priceFamilyCents=family_price,
            image=result,
            category=category_name.lower() or "uncategorized",
            category_id=category_obj.id if category_obj else None,
            ingridients=form.ingridients.data.strip(),
            status=form.status.data,
        )
        _apply_status(product, form.status.data or "active")

        db.session.add(product)
        db.session.commit()

        session["last_category_id"] = product.category_id or 0
        session["last_status"] = product.status

        if "save_add_another" in request.form:
            flash("Product created. Add another.", "success")
            return redirect(url_for("admin.new_product"))

        flash("Product created", "success")
        return redirect(url_for("admin.products"))

    return render_template(
        "admin/product_form.html",
        form=form,
        is_edit=False,
        product=None,
        categories=categories,
    )


@admin_bp.route("/products/<product_id>/edit", methods=["GET", "POST"])
@login_required
def edit_product(product_id: str):
    product = Product.query.get_or_404(product_id)
    form = ProductForm(obj=product)
    form.category_id.choices = _category_choices()
    if product.category_id:
        form.category_id.data = product.category_id
    if not product.status:
        form.status.data = "active" if product.is_active else "inactive"
    categories = Category.query.order_by(Category.sort_order, Category.name).all()

    if form.validate_on_submit():
        family_price = form.priceFamilyCents.data or 0
        file = form.image.data

        if file:
            ok, result = upload_file(file)
            if not ok:
                flash(result, "danger")
                return render_template(
                    "admin/product_form.html",
                    form=form,
                    product=product,
                    is_edit=True,
                    categories=categories,
                )
            product.image = result

        category_obj = _resolve_category(form)
        if not category_obj and not (form.new_category.data and form.new_category.data.strip()) and not product.category_id:
            flash("Choose an existing category or create a new one.", "danger")
            return render_template(
                "admin/product_form.html",
                form=form,
                product=product,
                is_edit=True,
                categories=categories,
            )

        category_name = category_obj.name if category_obj else (form.new_category.data or product.category)

        product.name = form.name.data.strip()
        product.priceSingleCents = form.priceSingleCents.data
        product.priceFamilyCents = family_price
        product.category = category_name.lower() if category_name else ""
        product.category_id = category_obj.id if category_obj else product.category_id
        product.ingridients = form.ingridients.data.strip()
        _apply_status(product, form.status.data or "active")

        db.session.commit()

        if "save_duplicate" in request.form:
            duplicate = Product(
                name=f"{product.name} (copy)",
                priceSingleCents=product.priceSingleCents,
                priceFamilyCents=product.priceFamilyCents,
                image=product.image,
                category=product.category,
                category_id=product.category_id,
                ingridients=product.ingridients,
                status="inactive",
            )
            _apply_status(duplicate, duplicate.status)
            db.session.add(duplicate)
            db.session.commit()
            flash("Product duplicated as draft.", "success")
            return redirect(url_for("admin.edit_product", product_id=duplicate.id))

        flash("Product updated", "success")
        return redirect(url_for("admin.products"))

    if product.priceFamilyCents == 0:
        form.priceFamilyCents.data = None

    return render_template(
        "admin/product_form.html",
        form=form,
        product=product,
        is_edit=True,
        categories=categories,
    )


@admin_bp.route("/products/<product_id>/toggle", methods=["POST"])
@login_required
def toggle_product(product_id: str):
    product = Product.query.get_or_404(product_id)
    payload = request.get_json(silent=True) or {}
    desired_state = payload.get("is_active", request.form.get("is_active"))

    if desired_state is None:
        return jsonify({"ok": False, "message": "Missing desired state."}), 400

    new_state = str(desired_state).lower() in {"true", "1", "on", "yes"}
    _apply_status(product, "active" if new_state else "inactive")
    db.session.commit()

    if request.is_json or request.headers.get("Accept") == "application/json":
        return jsonify({"ok": True, "is_active": product.is_active, "status": product.status})

    flash(f"Product {'activated' if product.is_active else 'paused'}.", "success")
    return redirect(request.referrer or url_for("admin.products"))


@admin_bp.route("/products/<product_id>/set-status", methods=["POST"])
@login_required
def set_product_status(product_id: str):
    product = Product.query.get_or_404(product_id)
    payload = request.get_json(silent=True) or {}
    status = (payload.get("status") or request.form.get("status") or "").strip().lower()

    if status not in VALID_STATUSES:
        return jsonify({"ok": False, "message": "Invalid status"}), 400

    _apply_status(product, status)
    db.session.commit()

    return jsonify({"ok": True, "status": product.status, "is_active": product.is_active})


@admin_bp.route("/products/<product_id>/duplicate", methods=["POST"])
@login_required
def duplicate_product(product_id: str):
    product = Product.query.get_or_404(product_id)
    copy = Product(
        name=f"{product.name} (copy)",
        priceSingleCents=product.priceSingleCents,
        priceFamilyCents=product.priceFamilyCents,
        image=product.image,
        category=product.category,
        category_id=product.category_id,
        ingridients=product.ingridients,
        status="inactive",
    )
    _apply_status(copy, copy.status)
    db.session.add(copy)
    db.session.commit()
    flash("Product duplicated as draft.", "success")
    return redirect(url_for("admin.edit_product", product_id=copy.id))


@admin_bp.route("/products/bulk", methods=["POST"])
@login_required
def bulk_products():
    product_ids = request.form.getlist("product_ids")
    if not product_ids:
        flash("Select at least one product for bulk update.", "warning")
        return redirect(url_for("admin.products"))

    status_choice = request.form.get("bulk_status")
    category_id = request.form.get("bulk_category_id", type=int)

    updated = 0
    for product in Product.query.filter(Product.id.in_(product_ids)).all():
        if status_choice in VALID_STATUSES:
            _apply_status(product, status_choice)
        if category_id:
            category = Category.query.get(category_id)
            if category:
                product.category_id = category.id
                product.category = category.name.lower()
        updated += 1

    db.session.commit()
    flash(f"Bulk updated {updated} products.", "success")
    return redirect(url_for("admin.products"))


@admin_bp.route("/categories", methods=["GET", "POST"])
@login_required
def categories():
    categories = Category.query.order_by(Category.sort_order, Category.name).all()
    if request.method == "POST":
        action = request.form.get("action")
        if action == "create":
            name = request.form.get("name", "").strip()
            if not name:
                flash("Category name is required.", "danger")
            else:
                Category.ensure(name)
                db.session.commit()
                flash("Category created.", "success")
            return redirect(url_for("admin.categories"))

        if action == "rename":
            cat_id = request.form.get("category_id", type=int)
            name = request.form.get("name", "").strip()
            category = Category.query.get(cat_id)
            if category and name:
                category.name = name
                category.slug = slugify(name)
                db.session.commit()
                flash("Category renamed.", "success")
            else:
                flash("Missing category or name.", "danger")
            return redirect(url_for("admin.categories"))

        if action == "toggle_active":
            cat_id = request.form.get("category_id", type=int)
            category = Category.query.get(cat_id)
            if category:
                category.active = not category.active
                db.session.commit()
                flash("Category updated.", "success")
            return redirect(url_for("admin.categories"))

        if action == "merge":
            source_id = request.form.get("source_id", type=int)
            target_id = request.form.get("target_id", type=int)
            source = Category.query.get(source_id)
            target = Category.query.get(target_id)
            if source and target and source.id != target.id:
                Product.query.filter_by(category_id=source.id).update(
                    {"category_id": target.id, "category": target.name.lower()}
                )
                source.active = False
                db.session.commit()
                flash("Categories merged.", "success")
            else:
                flash("Invalid merge selection.", "danger")
            return redirect(url_for("admin.categories"))

        if action == "reorder":
            for cat in categories:
                key = f"order_{cat.id}"
                if key in request.form:
                    try:
                        cat.sort_order = int(request.form[key])
                    except ValueError:
                        continue
            db.session.commit()
            flash("Order updated.", "success")
            return redirect(url_for("admin.categories"))

    counts = {
        cat.id: Product.query.filter_by(category_id=cat.id).count() for cat in categories
    }
    return render_template("admin/categories.html", categories=categories, counts=counts)
