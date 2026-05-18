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
from wtforms.validators import DataRequired, InputRequired, NumberRange, Length, Optional
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from ..services import CategoryService
        self.category_id.choices = CategoryService.choices()

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
        validators=[InputRequired(), NumberRange(min=0)]
    )

    priceFamilyCents = IntegerField(
        "Family price (cents, optional)",
        validators=[Optional(), NumberRange(min=0)]
    )

    category_id = SelectField(
        "Category",
        validators=[InputRequired(), NumberRange(min=1, message="Choose a category.")],
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


SUBSCRIPTION_AUDIENCE_CHOICES = [
    ("person", "1 Person"),
    ("family", "Family of 4"),
]


class SubscriptionPlanForm(FlaskForm):
    audience = SelectField(
        "Plan type",
        choices=SUBSCRIPTION_AUDIENCE_CHOICES,
        validators=[DataRequired()],
    )

    days_per_month = IntegerField(
        "Days / month",
        validators=[DataRequired(), NumberRange(min=1)],
    )

    price_plat_du_jour = IntegerField(
        "Plat du jour ($)",
        validators=[InputRequired(), NumberRange(min=0)],
    )

    price_with_salad = IntegerField(
        "With salad ($)",
        validators=[InputRequired(), NumberRange(min=0)],
    )


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
