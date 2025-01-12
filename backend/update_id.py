import json
import uuid
import os

# Ensure the script and JSON file are in the same folder
current_dir = os.path.dirname(os.path.abspath(__file__))
json_file_path = os.path.join(current_dir, "products.json")

def update_product_ids(file_path):
    try:
        # Open and load the JSON file
        with open(file_path, 'r') as file:
            products = json.load(file)
        
        # Update or generate UUIDs for each product
        for product in products:
            product['id'] = str(uuid.uuid4())
        
        # Save the updated JSON file
        with open(file_path, 'w') as file:
            json.dump(products, file, indent=4)
        
        print(f"Updated product IDs successfully saved to {file_path}")
    
    except FileNotFoundError:
        print(f"Error: File not found at path {file_path}")
    except json.JSONDecodeError as e:
        print(f"Error reading JSON file: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# Call the function
update_product_ids(json_file_path)
