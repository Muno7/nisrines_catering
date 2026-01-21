from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user

from ..extensions import db
from ..models import User, Product
from .forms import LoginForm, ProductForm
from ..s3 import upload_file

admin_bp = Blueprint("admin", __name__, template_folder="../templates/admin")


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
    items = Product.query.order_by(Product.created_at.desc()).all()
    return render_template("admin/products.html", products=items)


@admin_bp.route("/products/new", methods=["GET", "POST"])
@login_required
def new_product():
    form = ProductForm()
    if form.validate_on_submit():
        file = form.image.data
        ok, result = upload_file(file)
        if not ok:
            flash(result, "danger")
            return render_template("admin/product_form.html", form=form)

        family_price = form.priceFamilyCents.data
        if family_price is None:
            family_price = 0

        product = Product(
            name=form.name.data.strip(),
            priceSingleCents=form.priceSingleCents.data,
            priceFamilyCents=family_price,
            image=result,
            category=form.category.data.strip().lower(),
            ingridients=form.ingridients.data.strip(),
            is_active=form.active.data,
        )
        db.session.add(product)
        db.session.commit()
        flash("Product created", "success")
        return redirect(url_for("admin.products"))

    return render_template("admin/product_form.html", form=form)
