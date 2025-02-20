import requests
import json
import uuid
import os

# The API URL for Google Sheets
SHEET_API_URL = "https://sheets.googleapis.com/v4/spreadsheets/1yAdvMR9Jc_j33R-muYeG6myXa_xmVV6ojaUZ0Kyl-ug/values/Sheet1!A1:D30?key=AIzaSyD52LWaOJD3grSJuupuetz0PhDieW-Tw0g"
# The path where your current JSON file is located
current_dir = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE_PATH = os.path.join(current_dir, "products.json")


# Function to fetch data from Google Sheets
def fetch_sheet_data(url):
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to fetch data from Google Sheets.")
    return response.json()["values"]

# Function to generate a unique ID for each product
def generate_uuid():
    return str(uuid.uuid4())

# Function to process the data and structure it as needed
def process_data(data):
    products = []
    current_category = None

    # Iterate through the data and process it
    for row in data:
        # Check for category header (either "soup" or "plat-du-jour")
        if row[1].lower() in ["soup", "plat-du-jour"]:
            current_category = row[1].lower()
            continue  # Skip the header row

        # Skip empty or invalid rows
        if len(row) < 4 or not any(cell.strip() for cell in row):
            continue

        # Extract data for each product
        day, name, single_portion, family_portion = row[:4]
        product = {
            "id": generate_uuid(),
            "day": day.strip().lower(),
            "name": name.strip(),
            "category": current_category,
            "price": {
                "single": float(single_portion)*100,
                "family": float(family_portion)*100,
            },
            "image": f"{name.strip().lower().replace(' ', '-')}.jpg",
        }
        products.append(product)

    return products

# Function to save data to a JSON file, removing specified categories
def save_to_file(data, file_path):
    # Check if the products.json file exists
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    # Remove existing products with the categories "soup" and "plat-du-jour"
    excluded_categories = ["soup", "plat-du-jour"]
    filtered_data = [item for item in existing_data if item["category"] not in excluded_categories]

    # Merge the filtered existing data with the new data
    filtered_data.extend(data)

    # Write the updated data back to the same JSON file
    with open(file_path, "w") as f:
        json.dump(filtered_data, f, indent=2)

def update_products():
    try:
        # Fetch data from Google Sheets
        print(f"Fetching data from: {SHEET_API_URL}")
        data = fetch_sheet_data(SHEET_API_URL)

        # Process the data
        processed_data = process_data(data)

        # Save processed data to the existing products.json file
        save_to_file(processed_data, OUTPUT_FILE_PATH)

        print("Data updated and saved to products.json.")
    except Exception as e:
        print(f"Error updating products: {e}")

# Run the update process
update_products()

