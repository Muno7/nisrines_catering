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
from sqlalchemy import or_, func

from ..extensions import db
from ..models import (
    User,
    Product,
    Category,
    SlideshowImage,
    CateringMenuImage,
    SubscriptionPlan,
    slugify,
)
from .forms import (
    LoginForm,
    ProductForm,
    SlideshowForm,
    CateringMenuForm,
    SubscriptionPlanForm,
)
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
    if form.category_id.data:
        return Category.query.get(form.category_id.data)
    return None


def _apply_status(product: Product, status: str) -> None:
    product.status = status
    product.is_active = status == "active"


def _normalize_product_name(raw: str | None) -> str:
    text = (raw or "").strip()
    if not text:
        return ""
    return text[:1].upper() + text[1:].lower()


def _normalize_arabic_name(raw: str | None) -> str | None:
    text = (raw or "").strip()
    return text or None


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
    day_filter = (request.args.get("day") or "").strip().lower()

    base_query = Product.query

    if q:
        base_query = base_query.filter(
            or_(
                Product.name.ilike(f"%{q}%"),
                Product.name_ar.ilike(f"%{q}%"),
            )
        )
    if category_id:
        base_query = base_query.filter(Product.category_id == category_id)
    if status_filter in VALID_STATUSES:
        base_query = base_query.filter(Product.status == status_filter)
    if missing_image:
        base_query = base_query.filter(or_(Product.image == "", Product.image.is_(None)))
    if day_filter:
        base_query = base_query.filter(func.lower(Product.day) == day_filter)

    items = base_query.order_by(Product.updated_at.desc()).all()

    categories = Category.query.order_by(Category.sort_order, Category.name).all()
    category_counts = Counter([p.category for p in items if p.category])
    stats = {
        "total": len(items),
        "active": sum(1 for p in items if _status_value(p) == "active"),
        "inactive": sum(1 for p in items if _status_value(p) == "inactive"),
        "visible": len(items),
        "range_start": 1 if items else 0,
        "range_end": len(items),
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
            "day": day_filter,
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
        uploaded_image: str | None = None
        if file and getattr(file, "filename", ""):
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
            uploaded_image = result

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
            name=_normalize_product_name(form.name.data),
            name_ar=_normalize_arabic_name(form.name_ar.data),
            priceSingleCents=form.priceSingleCents.data,
            priceFamilyCents=family_price,
            image=uploaded_image,
            category=category_name.lower() or "uncategorized",
            category_id=category_obj.id if category_obj else None,
            ingredients=(form.ingredients.data or "").strip(),
            day=form.day.data or None,
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
    if request.method == "GET" and product.category_id:
        form.category_id.data = product.category_id
    if not product.status:
        form.status.data = "active" if product.is_active else "inactive"
    categories = Category.query.order_by(Category.sort_order, Category.name).all()

    if form.validate_on_submit():
        family_price = form.priceFamilyCents.data or 0
        file = form.image.data

        if file and getattr(file, "filename", ""):
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

        product.name = _normalize_product_name(form.name.data)
        product.name_ar = _normalize_arabic_name(form.name_ar.data)
        product.priceSingleCents = form.priceSingleCents.data
        product.priceFamilyCents = family_price
        product.category = category_name.lower() if category_name else ""
        product.category_id = category_obj.id if category_obj else product.category_id
        product.ingredients = (form.ingredients.data or "").strip()
        product.day = form.day.data or None
        _apply_status(product, form.status.data or "active")

        db.session.commit()

        if "save_duplicate" in request.form:
            duplicate = Product(
                name=f"{product.name} (copy)",
                name_ar=product.name_ar,
                priceSingleCents=product.priceSingleCents,
                priceFamilyCents=product.priceFamilyCents,
                image=product.image,
                category=product.category,
                category_id=product.category_id,
                ingredients=product.ingredients,
                day=product.day,
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
        ingredients=product.ingredients,
        day=product.day,
        status="inactive",
    )
    _apply_status(copy, copy.status)
    db.session.add(copy)
    db.session.commit()
    flash("Product duplicated as draft.", "success")
    return redirect(url_for("admin.edit_product", product_id=copy.id))


@admin_bp.route("/products/<product_id>/delete", methods=["POST"])
@login_required
def delete_product(product_id: str):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    flash("Product deleted.", "success")
    return redirect(url_for("admin.products"))


@admin_bp.route("/products/bulk", methods=["POST"])
@login_required
def bulk_products():
    product_ids = request.form.getlist("product_ids")
    if not product_ids:
        flash("Select at least one product for bulk update.", "warning")
        return redirect(url_for("admin.products"))

    status_choice = request.form.get("bulk_status")
    category_id = request.form.get("bulk_category_id", type=int)
    bulk_price_single = request.form.get("bulk_price_single", type=int)
    bulk_price_family = request.form.get("bulk_price_family", type=int)
    bulk_day = (request.form.get("bulk_day") or "").strip().lower()

    updated = 0
    for product in Product.query.filter(Product.id.in_(product_ids)).all():
        if status_choice in VALID_STATUSES:
            _apply_status(product, status_choice)
        if category_id:
            category = Category.query.get(category_id)
            if category:
                product.category_id = category.id
                product.category = category.name.lower()
        if bulk_price_single is not None:
            product.priceSingleCents = bulk_price_single
        if bulk_price_family is not None:
            product.priceFamilyCents = bulk_price_family
        if bulk_day:
            if bulk_day == "clear":
                product.day = None
            else:
                product.day = bulk_day
        updated += 1

    db.session.commit()
    flash(f"Bulk updated {updated} products.", "success")
    return redirect(url_for("admin.products"))


@admin_bp.route("/slideshow", methods=["GET", "POST"])
@login_required
def slideshow():
    form = SlideshowForm()
    images = SlideshowImage.query.order_by(SlideshowImage.sort_order, SlideshowImage.created_at).all()
    wants_json = request.accept_mimetypes["application/json"] >= request.accept_mimetypes["text/html"]

    if form.validate_on_submit():
        files = request.files.getlist("images")
        if not files or not any(f.filename for f in files):
            flash("Please select at least one image to upload.", "warning")
            if wants_json:
                return jsonify({"ok": False, "uploaded": 0, "errors": ["No files provided."]}), 400
            return render_template("admin/slideshow.html", form=form, images=images)

        next_order = (
            db.session.query(func.coalesce(func.max(SlideshowImage.sort_order), 0)).scalar() or 0
        )

        uploaded = 0
        errors: list[str] = []
        for file in files:
            if not file or not file.filename:
                continue
            ok, result = upload_file(file)
            if not ok:
                errors.append(f"{file.filename}: {result}")
                continue
            next_order += 1
            slide = SlideshowImage(image=result, sort_order=next_order)
            db.session.add(slide)
            uploaded += 1

        if uploaded:
            db.session.commit()
            flash(f"Added {uploaded} slideshow image(s).", "success")

        if wants_json:
            status_code = 200 if uploaded else 400
            return (
                jsonify({"ok": uploaded > 0, "uploaded": uploaded, "errors": errors}),
                status_code,
            )

        if uploaded:
            flash(f"Added {uploaded} slideshow image(s).", "success")
        if errors:
            flash(f"Failed to upload {len(errors)} image(s): " + "; ".join(errors), "danger")
        if not uploaded and not errors:
            flash("No images were uploaded.", "warning")
        return redirect(url_for("admin.slideshow"))

    return render_template("admin/slideshow.html", form=form, images=images)


@admin_bp.route("/slideshow/<slide_id>/delete", methods=["POST"])
@login_required
def delete_slide(slide_id: str):
    slide = SlideshowImage.query.get_or_404(slide_id)
    db.session.delete(slide)
    db.session.commit()
    flash("Slide removed.", "success")
    return redirect(url_for("admin.slideshow"))


@admin_bp.route("/slideshow/reorder", methods=["POST"])
@login_required
def reorder_slideshow():
    slides = SlideshowImage.query.order_by(SlideshowImage.sort_order, SlideshowImage.created_at).all()
    for slide in slides:
        key = f"order_{slide.id}"
        if key in request.form:
            try:
                slide.sort_order = int(request.form[key])
            except ValueError:
                continue
    db.session.commit()
    flash("Slide order updated.", "success")
    return redirect(url_for("admin.slideshow"))


@admin_bp.route("/categories", methods=["GET", "POST"])
@login_required
def categories():
    categories = Category.query.order_by(Category.sort_order, Category.name).all()

    if request.method == "POST":
        action = request.form.get("action")
        if action == "create":
            name = (request.form.get("name") or "").strip()
            if not name:
                flash("Category name is required.", "danger")
            else:
                existing = Category.query.filter(
                    or_(Category.name.ilike(name), Category.slug == slugify(name))
                ).first()
                if existing:
                    flash("Category already exists.", "warning")
                else:
                    Category.ensure(name)
                    db.session.commit()
                    flash("Category created.", "success")
            return redirect(url_for("admin.categories"))

        if action == "update":
            cat_id = request.form.get("category_id", type=int)
            category = Category.query.get(cat_id)
            if not category:
                flash("Category not found.", "danger")
                return redirect(url_for("admin.categories"))

            new_name = (request.form.get("name") or "").strip()
            new_order = request.form.get("sort_order", type=int)

            if new_name:
                slug = slugify(new_name)
                conflict = (
                    Category.query.filter(
                        or_(Category.slug == slug, Category.name.ilike(new_name))
                    )
                    .filter(Category.id != category.id)
                    .first()
                )
                if conflict:
                    flash("Another category already uses that name.", "danger")
                    return redirect(url_for("admin.categories"))
                category.name = new_name
                category.slug = slug

            if new_order is not None:
                category.sort_order = new_order

            db.session.commit()
            flash("Category updated.", "success")
            return redirect(url_for("admin.categories"))

        if action == "reorder":
            updated = 0
            for cat in categories:
                name_key = f"name_{cat.id}"
                order_key = f"order_{cat.id}"
                new_name = (request.form.get(name_key) or "").strip()
                new_order = request.form.get(order_key, type=int)

                # Update name/slug if provided and changed
                if new_name and new_name != cat.name:
                    slug = slugify(new_name)
                    conflict = (
                        Category.query.filter(
                            or_(Category.slug == slug, Category.name.ilike(new_name))
                        )
                        .filter(Category.id != cat.id)
                        .first()
                    )
                    if conflict:
                        flash(f"Name '{new_name}' already used by another category.", "danger")
                        return redirect(url_for("admin.categories"))
                    cat.name = new_name
                    cat.slug = slug

                if new_order is not None and new_order != cat.sort_order:
                    cat.sort_order = new_order

                updated += 1

            db.session.commit()
            flash("Category order updated.", "success")
            return redirect(url_for("admin.categories"))

    counts = {
        cat.id: Product.query.filter_by(category_id=cat.id).count() for cat in categories
    }
    return render_template("admin/categories.html", categories=categories, counts=counts)


@admin_bp.route("/categories/<int:category_id>/set-status", methods=["POST"])
@login_required
def set_category_status(category_id: int):
    category = Category.query.get_or_404(category_id)
    payload = request.get_json(silent=True) or {}
    status = (payload.get("status") or request.form.get("status") or "").strip().lower()

    if status not in VALID_STATUSES:
        return jsonify({"ok": False, "message": "Invalid status"}), 400

    category.active = status == "active"
    db.session.commit()

    return jsonify(
        {"ok": True, "status": "active" if category.active else "inactive", "active": category.active}
    )


@admin_bp.route("/categories/<int:category_id>/delete", methods=["POST"])
@login_required
def delete_category(category_id: int):
    category = Category.query.get_or_404(category_id)
    product_count = Product.query.filter_by(category_id=category.id).count()

    if product_count:
        flash("Cannot delete a category that still has products. Move or delete them first.", "warning")
        return redirect(url_for("admin.categories"))

    db.session.delete(category)
    db.session.commit()
    flash("Category deleted.", "success")
    return redirect(url_for("admin.categories"))


@admin_bp.route("/catering", methods=["GET", "POST"])
@login_required
def catering():
    form = CateringMenuForm()
    menus = CateringMenuImage.query.order_by(
        CateringMenuImage.sort_order,
        CateringMenuImage.created_at
    ).all()

    if form.validate_on_submit():
        files = request.files.getlist("images")
        if not files or not any(f.filename for f in files):
            flash("Please select at least one image to upload.", "warning")
            return redirect(url_for("admin.catering"))

        next_order = (
            db.session.query(func.coalesce(func.max(CateringMenuImage.sort_order), 0)).scalar() or 0
        )

        uploaded = 0
        errors: list[str] = []
        for file in files:
            if not file or not file.filename:
                continue
            ok, result = upload_file(file)
            if not ok:
                errors.append(f"{file.filename}: {result}")
                continue
            next_order += 1
            menu = CateringMenuImage(image=result, sort_order=next_order)
            db.session.add(menu)
            uploaded += 1

        if uploaded:
            db.session.commit()
            flash(f"Added {uploaded} catering menu image(s).", "success")

        if errors:
            flash("Failed to upload: " + "; ".join(errors), "danger")
        if not uploaded and not errors:
            flash("No images were uploaded.", "warning")

        return redirect(url_for("admin.catering"))

    return render_template("admin/catering.html", form=form, menus=menus)


@admin_bp.route("/catering/<menu_id>/delete", methods=["POST"])
@login_required
def delete_catering_menu(menu_id: str):
    menu = CateringMenuImage.query.get_or_404(menu_id)
    db.session.delete(menu)
    db.session.commit()
    flash("Catering menu image removed.", "success")
    return redirect(url_for("admin.catering"))


@admin_bp.route("/catering/reorder", methods=["POST"])
@login_required
def reorder_catering_menus():
    menus = CateringMenuImage.query.order_by(
        CateringMenuImage.sort_order,
        CateringMenuImage.created_at
    ).all()
    for menu in menus:
        key = f"order_{menu.id}"
        if key in request.form:
            try:
                menu.sort_order = int(request.form[key])
            except ValueError:
                continue
    db.session.commit()
    flash("Catering menu order updated.", "success")
    return redirect(url_for("admin.catering"))


@admin_bp.route("/subscriptions")
@login_required
def subscriptions():
    plans = SubscriptionPlan.query.order_by(
        SubscriptionPlan.audience,
        SubscriptionPlan.days_per_month,
    ).all()
    person_plans = [plan for plan in plans if plan.audience == "person"]
    family_plans = [plan for plan in plans if plan.audience == "family"]
    return render_template(
        "admin/subscriptions.html",
        person_plans=person_plans,
        family_plans=family_plans,
    )


@admin_bp.route("/subscriptions/new", methods=["GET", "POST"])
@login_required
def new_subscription_plan():
    form = SubscriptionPlanForm()
    if form.validate_on_submit():
        audience = form.audience.data
        days_per_month = form.days_per_month.data

        existing = SubscriptionPlan.query.filter_by(
            audience=audience,
            days_per_month=days_per_month,
        ).first()

        if existing:
            existing.price_plat_du_jour = form.price_plat_du_jour.data
            existing.price_with_salad = form.price_with_salad.data
            db.session.commit()
            flash("Subscription plan updated.", "success")
            return redirect(url_for("admin.subscriptions"))

        plan = SubscriptionPlan(
            audience=audience,
            days_per_month=days_per_month,
            price_plat_du_jour=form.price_plat_du_jour.data,
            price_with_salad=form.price_with_salad.data,
        )
        db.session.add(plan)
        db.session.commit()
        flash("Subscription plan created.", "success")
        return redirect(url_for("admin.subscriptions"))

    return render_template(
        "admin/subscription_form.html",
        form=form,
        plan=None,
        is_edit=False,
    )


@admin_bp.route("/subscriptions/<plan_id>/edit", methods=["GET", "POST"])
@login_required
def edit_subscription_plan(plan_id: str):
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    form = SubscriptionPlanForm(obj=plan if request.method == "GET" else None)

    if form.validate_on_submit():
        audience = form.audience.data
        days_per_month = form.days_per_month.data

        conflict = (
            SubscriptionPlan.query.filter_by(
                audience=audience,
                days_per_month=days_per_month,
            )
            .filter(SubscriptionPlan.id != plan.id)
            .first()
        )
        if conflict:
            flash("A subscription plan already exists for that plan type and days.", "danger")
            return render_template(
                "admin/subscription_form.html",
                form=form,
                plan=plan,
                is_edit=True,
            )

        plan.audience = audience
        plan.days_per_month = days_per_month
        plan.price_plat_du_jour = form.price_plat_du_jour.data
        plan.price_with_salad = form.price_with_salad.data
        db.session.commit()
        flash("Subscription plan updated.", "success")
        return redirect(url_for("admin.subscriptions"))

    return render_template(
        "admin/subscription_form.html",
        form=form,
        plan=plan,
        is_edit=True,
    )


@admin_bp.route("/subscriptions/<plan_id>/delete", methods=["POST"])
@login_required
def delete_subscription_plan(plan_id: str):
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    db.session.delete(plan)
    db.session.commit()
    flash("Subscription plan deleted.", "success")
    return redirect(url_for("admin.subscriptions"))
