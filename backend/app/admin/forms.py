from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    IntegerField,
    BooleanField,
    TextAreaField,
    FileField,
    PasswordField,
    SelectField,
    MultipleFileField,
)
from wtforms.validators import DataRequired, NumberRange, Length, Optional
from werkzeug.utils import secure_filename

DAY_CHOICES = [
    ("", "Select day"),
    ("monday", "Monday"),
    ("tuesday", "Tuesday"),
    ("wednesday", "Wednesday"),
    ("thursday", "Thursday"),
    ("friday", "Friday"),
    ("saturday", "Saturday"),
    ("sunday", "Sunday"),
]


class LoginForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(max=80)])
    password = PasswordField("Password", validators=[DataRequired()])


class ProductForm(FlaskForm):
    name = StringField(
        "Name",
        validators=[DataRequired(), Length(max=255)]
    )
    name_ar = StringField(
        "Arabic name",
        validators=[Optional(), Length(max=255)]
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

    ingredients = TextAreaField(
        "Ingredients",
        validators=[Optional()]
    )

    day = SelectField(
        "Day",
        choices=DAY_CHOICES,
        validators=[Optional()],
        default="",
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
        validators=[Optional()],
        render_kw={"accept": "image/*"},
    )

    def sanitize_filename(self) -> str | None:
        if not self.image.data:
            return None
        return secure_filename(self.image.data.filename or "")


class SlideshowForm(FlaskForm):
    images = MultipleFileField(
        "Upload slideshow images",
        validators=[Optional()],
        render_kw={"multiple": True, "accept": "image/*"},
    )


class CateringMenuForm(FlaskForm):
    images = MultipleFileField(
        "Upload catering menus",
        validators=[Optional()],
        render_kw={"multiple": True, "accept": "image/*"},
    )
