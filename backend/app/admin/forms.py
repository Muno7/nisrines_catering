from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    IntegerField,
    BooleanField,
    TextAreaField,
    FileField,
    PasswordField,
    SelectField,
)
from wtforms.validators import DataRequired, NumberRange, Length, Optional
from werkzeug.utils import secure_filename


class LoginForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(max=80)])
    password = PasswordField("Password", validators=[DataRequired()])


class ProductForm(FlaskForm):
    name = StringField(
        "Name",
        validators=[DataRequired(), Length(max=255)]
    )

    priceSingleCents = IntegerField(
        "Single price (cents)",
        validators=[DataRequired(), NumberRange(min=0)]
    )

    priceFamilyCents = IntegerField(
        "Family price (cents, optional)",
        validators=[Optional(), NumberRange(min=0)]
    )

    category_id = SelectField(
        "Category",
        validators=[Optional()],
        coerce=int,
        choices=[],
    )

    new_category = StringField(
        "Or create new category",
        validators=[Optional(), Length(max=100)]
    )

    ingridients = TextAreaField(
        "Ingredients",
        validators=[DataRequired()]
    )

    status = SelectField(
        "Status",
        choices=[
            ("active", "Active"),
            ("inactive", "Inactive"),
        ],
        default="active",
        validators=[DataRequired()],
    )

    image = FileField(
        "Image",
        validators=[Optional()]
    )

    def sanitize_filename(self) -> str | None:
        if not self.image.data:
            return None
        return secure_filename(self.image.data.filename or "")
