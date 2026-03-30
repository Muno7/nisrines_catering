FROM python:3.12-slim

WORKDIR /app

# Install Python deps
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

EXPOSE 8000

# Run with Gunicorn (production server)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "run:app", "--workers", "1", "--threads", "2", "--timeout", "120"]