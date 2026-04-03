from flask import render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user

from . import bp
from ...services import AdminService
from ...exceptions import ValidationError
from ..forms import LoginForm


@bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("admin.products"))

    form = LoginForm()
    if form.validate_on_submit():
        try:
            user = AdminService.authenticate(form.username.data, form.password.data)
            login_user(user)
            return redirect(url_for("admin.products"))
        except ValidationError as e:
            flash(str(e), "danger")

    return render_template("admin/login.html", form=form)


@bp.get("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out.", "info")
    return redirect(url_for("admin.login"))
