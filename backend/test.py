import os
import uuid
from dotenv import load_dotenv
import boto3

load_dotenv()

AWS_REGION = os.environ["AWS_REGION"]
S3_BUCKET_NAME = os.environ["S3_BUCKET_NAME"]
S3_PUBLIC_BASE_URL = os.environ["S3_PUBLIC_BASE_URL"]

def main():
    # Pick an existing small image file on your computer for the test.
    local_path = "test.jpg"  # put a real file with this name in the same folder

    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Put an image named {local_path} next to this script.")

    ext = os.path.splitext(local_path)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png"]:
        raise ValueError("Use a .jpg, .jpeg, or .png file for the test.")

    key = f"products/test-{uuid.uuid4().hex}{ext}"

    s3 = boto3.client("s3", region_name=AWS_REGION)

    content_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    with open(local_path, "rb") as f:
        s3.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=key,
            Body=f,
            ContentType=content_type
        )

    url = f"{S3_PUBLIC_BASE_URL}/{key}"
    print("Uploaded successfully.")
    print("Public URL:", url)

if __name__ == "__main__":
    main()
