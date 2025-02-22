import requests
import jwt
from app.auth import is_admin, decode_access_token

BASE_URL = "http://localhost:8000"
access_token = None # Global variable for the access token

def main_menu():
    """Displays the main menu for registration and login."""
    global access_token
    while True:
        print("\nMain Menu")
        print("1. Register")
        print("2. Login")
        print("3. Exit")
        choice = input("Choose an option: ")

        if choice == "1":
            register()
        elif choice == "2":
            token = login()
            if token:
                access_token = token
                handle_menu_after_login()
        elif choice == "3":
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please try again.")

def register():
    """Handles user registration."""
    print("\nRegister")
    user_name = input("Enter your username: ")
    email = input("Enter your email: ")
    password = input("Enter your password: ")

    response = requests.post(f"{BASE_URL}/auth/register/", json={
        "user_name": user_name,
        "email": email,
        "password": password
    })

    if response.status_code == 200:
        print("Registration successful.")
    else:
        print("Registration failed. Please try again.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def login():
    """Handles user login and returns the access token."""
    print("\nLog in")
    email = input("Enter your email: ")
    password = input("Enter your password: ")

    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": email,
        "password": password
    })

    if response.status_code == 200:
        data = response.json()
        print(f"Log in successful. Access Token: {data['access_token']}")
        return data["access_token"]
    else:
        print("Invalid login credentials.")
        return None

def handle_menu_after_login():
    """Routes the user to the appropriate menu based on their role."""
    global access_token
    # Decode the JWT to extract user information
    try:
        payload = decode_access_token(access_token)   
        user_id = payload.get("sub")  # Extract user_id from the token
        email = payload.get("email")  # Extract email from the token
        
        if not user_id or not email:
            raise ValueError("Token is missing required fields.")
        
        print(f"User ID from token: {user_id}, Email: {email}")

        # Check if the user is an admin
        if is_admin(email):
            admin_menu()
        else:
            user_menu()
    except jwt.ExpiredSignatureError:
        print("Session expired. Please log in again.")
        access_token = None
    except ValueError as e:
        print(f"Token validation error: {str(e)}. Logging out.")
        access_token = None
    except Exception as e:
        print(f"An error occurred: {str(e)}. Logging out.")
        access_token = None

def admin_menu():
    """Displays the admin menu."""
    global access_token
    while True:
        print("\nAdmin Menu")
        print("1. View All Transaction Accounts")
        print("2. Log Out")
        choice = input("Choose an option: ")

        if choice == "1":
            admin_view_all_accounts()
        elif choice == "2":
            print("Logging out...")
            access_token = None
            break
        else:
            print("Invalid choice. Please try again.")

def admin_view_all_accounts():
    """Fetches and displays all transaction accounts for admin users."""
    headers = {"Authorization": f"Bearer {access_token}"}
    print("\nAll Transaction Accounts")
    response = requests.get(f"{BASE_URL}/admin/accounts/", headers=headers)

    if response.status_code == 200:
        accounts = response.json()
        for account in accounts:
            print(f"Account ID: {account['transaction_account_id']}\n"
                 +f"    Name: {account['account_name']}\n"
                 +f"    Balance: {account['balance']}\n")
    else:
        print("Failed to retrieve accounts.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def user_menu():
    """Displays the user menu."""
    global access_token
    while True:
        print("\nUser Menu")
        print("1. Add Transaction Account")
        print("2. View Transaction Accounts")
        print("3. Add Transaction")
        print("4. View Transactions")
        print("5. Modify Transaction")
        print("6. Delete Transaction")
        print("7. Add Tag")
        print("8. View Tags")
        print("9. Assign Tag to Transaction")
        print("10. View Transaction Tags")
        print("11. View Reports")
        print("12. Log Out")
        choice = input("Choose an option: ")

        if choice == "1":
            add_transaction_account()
        elif choice == "2":
            view_transaction_accounts()
        elif choice == "3":
            add_transaction()
        elif choice == "4":
            view_transactions()
        elif choice == "5":
            modify_transaction()
        elif choice == "6":
            delete_transaction()
        elif choice == "7":
            add_tag()
        elif choice == "8":
            view_tags()
        elif choice == "9":
            assign_tag_to_transaction()
        elif choice == "10":
            view_transaction_tags()
        elif choice == "11":
            reports_menu()
        elif choice == "12":
            print("Logging out...")
            access_token = None
            break
        else:
            print("Invalid choice. Please try again.")

def add_transaction_account():
    headers = {"Authorization": f"Bearer {access_token}"}
    print("\nAdd Transaction Account")
    account_name = input("Enter account name: ")
    balance = float(input("Enter balance: "))

    response = requests.post(f"{BASE_URL}/accounts/", json={
        "account_name": account_name,
        "balance": balance
    }, headers=headers)

    if response.status_code == 200:
        print("Transaction account added successfully.")
    else:
        print("Failed to add transaction account.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def view_transaction_accounts():
    headers = {"Authorization": f"Bearer {access_token}"}
    print("\nTransaction Accounts")
    response = requests.get(f"{BASE_URL}/accounts/", headers=headers)

    if response.status_code == 200:
        accounts = response.json()
        for account in accounts:
            print(f"Account ID: {account['transaction_account_id']}")
            print(f"Account Name: {account['account_name']}")
            print(f"Balance: {account['balance']}")
            print()
    else:
        print("Failed to retrieve transaction accounts.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def add_transaction():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nAdd Transaction")
    transaction_name = input("Enter transaction name: ")
    amount = float(input("Enter amount (default 0): ") or 0)
    date = input("Enter date (YYYY-MM-DDTHH:MM:SS+HH:MM: ")
    target_account_id = int(input("Enter target transaction account ID: "))
    tag_id = int(input("Enter tag ID (leave blank for none): ") or 0)

    breakdowns = []
    add_breakdown = input("Do you want to add breakdowns? (yes/no): ").lower()
    while add_breakdown == "yes":
        breakdown_account_id = int(input("Enter breakdown account ID: "))
        earned_amount = float(input("Enter earned amount (default 0): ") or 0)
        spent_amount = float(input("Enter spent amount (default 0): ") or 0)
        breakdowns.append({
            "transaction_account_id": breakdown_account_id,
            "earned_amount": earned_amount,
            "spent_amount": spent_amount
        })
        add_breakdown = input("Add another breakdown? (yes/no): ").lower()

    payload = {
        "transaction_name": transaction_name,
        "amount": amount,
        "date": date,
        "target_account_id": target_account_id,
        "tag_id": tag_id or None,
        "breakdowns": breakdowns
    }

    response = requests.post(f"{BASE_URL}/transactions/", json=payload, headers=headers)

    if response.status_code == 200:
        print("Transaction added successfully.")
    else:
        print("Failed to add transaction.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def view_transactions():
    headers = {"Authorization": f"Bearer {access_token}"}
    print("\nYour Transactions:")
    response = requests.get(f"{BASE_URL}/transactions/", headers=headers)

    if response.status_code == 200:
        transactions = response.json()
        for transaction in transactions:
            print(f"Transaction ID: {transaction['transaction_id']}")
            print(f"    Name: {transaction['transaction_name']}")
            print(f"    Amount: {transaction['amount']}")
            print(f"    Net Amount: {transaction['net_amount']}")
            print(f"    Date: {transaction['date']}")
            print(f"    Breakdowns:")

            breakdown_response = requests.get(
                f"{BASE_URL}/transactions/{transaction['transaction_id']}/breakdowns",
                headers=headers
            )

            if breakdown_response.status_code == 200:
                breakdowns = breakdown_response.json()
                for breakdown in breakdowns:
                    print(f"        Account ID: {breakdown['transaction_account_id']}")
                    print(f"        Earned: {breakdown['earned_amount']}")
                    print(f"        Spent: {breakdown['spent_amount']}")
            else:
                print(f"        Could not fetch breakdowns. Error: {breakdown_response.json().get('detail', 'Unknown error')}")
            print()
    else:
        print("Failed to retrieve transactions.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def modify_transaction():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nModify Transaction")
    transaction_id = int(input("Enter transaction ID to modify: "))
    transaction_name = input("Enter new transaction name (or leave blank): ")
    amount = input("Enter new amount (or leave blank): ")
    net_amount = input("Enter new net amount (or leave blank): ")
    date = input("Enter new date (YYYY-MM-DDTHH:MM:SS+HH:MM) (or leave blank): ")

    # Build the request payload
    data = {}
    if transaction_name:
        data["transaction_name"] = transaction_name
    if amount:
        data["amount"] = float(amount)
    if net_amount:
        data["net_amount"] = float(net_amount)
    if date:
        data["date"] = date

    # Make the PUT request with the Authorization header
    response = requests.put(f"{BASE_URL}/transactions/{transaction_id}", json=data, headers=headers)

    if response.status_code == 200:
        print("Transaction modified successfully.")
    else:
        print("Failed to modify transaction.")
        error_message = response.json().get('detail', 'Unknown error')
        print(f"Error: {error_message}")

def delete_transaction():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nDelete Transaction")
    transaction_id = int(input("Enter transaction ID to delete: "))

    response = requests.delete(f"{BASE_URL}/transactions/{transaction_id}", headers=headers)

    if response.status_code == 200:
        print("Transaction deleted successfully.")
    else:
        print("Failed to delete transaction.")
        error_message = response.json().get('detail', 'Unknown error')
        print(f"Error: {error_message}")

def add_tag():
    """Handles creating a new tag for the logged-in user."""
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nAdd Tag")
    tag_name = input("Enter tag name: ")

    response = requests.post(f"{BASE_URL}/tags/", json={"tag_name": tag_name}, headers=headers)

    if response.status_code == 200:
        print("Tag added successfully.")
    else:
        print("Failed to add tag.")
        error_message = response.json().get('detail', 'Unknown error')
        print(f"Error: {error_message}")

def view_tags():
    """Retrieve and display tags accessible to the logged-in user."""
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("\nYour Tags")
    response = requests.get(f"{BASE_URL}/tags/", headers=headers)

    if response.status_code == 200:
        tags = response.json()
        for tag in tags:
            print(f"ID: {tag['tag_id']}, Name: {tag['tag_name']}")
    else:
        print(f"Failed to retrieve tags. Error: {response.json().get('detail', 'Unknown error')}")

def assign_tag_to_transaction():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nAssign Tag to Transaction")
    transaction_id = int(input("Enter transaction ID: "))
    tag_id = int(input("Enter tag ID: "))

    response = requests.post(f"{BASE_URL}/tags/assign/", json={
        "transaction_id": transaction_id,
        "tag_id": tag_id
    }, headers=headers)

    if response.status_code == 200:
        print("Tag assigned successfully.")
    else:
        print("Failed to assign tag.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def view_transaction_tags():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nView Transaction Tags")
    transaction_id = int(input("Enter transaction ID to view its tags: "))

    response = requests.get(f"{BASE_URL}/transactions/{transaction_id}", headers=headers)

    if response.status_code == 200:
        transaction = response.json()
        print(f"Transaction: {transaction['transaction_name']}")

        # Fetch tags linked to the transaction
        tags_response = requests.get(f"{BASE_URL}/tags/transaction/{transaction_id}", headers=headers)
        if tags_response.status_code == 200:
            tags = tags_response.json()
            for tag in tags:
                print(f"Tag ID: {tag['tag_id']}, Name: {tag['tag_name']}")
        else:
            print(f"Failed to retrieve tags. Error: {tags_response.json().get('detail', 'Unknown error')}")
    else:
        print(f"Failed to retrieve transaction. Error: {response.json().get('detail', 'Unknown error')}")

def reports_menu():
    """
    Displays the reports menu.
    """
    global access_token
    
    while True:
        print("\nReports Menu")
        print("0. Go back to User Menu")
        print("1. View Total Spending")
        print("2. View Spending by Category")
        print("3. View Spending by Date Range")
        print("4. View Transactions Exceeding Account Balance")
        print("5. View Transactions Exceeding Account Balance Currently")
        print("6. View Chronological List of Transactions Exceeding Total Account Balances")
        print("7. View Transactions Exceeding User's Total Current Balance")
        choice = input("Choose a report option: ")

        if choice == "1":
            get_total_spending()
        elif choice == "2":
            get_spending_by_category()
        elif choice == "3":
            get_spending_by_date_range()
        elif choice == "4":
            get_exceeding_account_balance()
        elif choice == "5":
            get_exceeding_current_balance()
        elif choice == "6":
            get_exceeding_total_balances()
        elif choice == "7":
            get_exceeding_user_total_balance()
        elif choice == "0":
            break
        else:
            print("Invalid choice. Please try again.")

def get_total_spending():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nTotal Spending Report")
    try:
        response = requests.get(f"{BASE_URL}/reports/total-spending", headers=headers)

        if response.status_code == 200:
            data = response.json()
            total_spent = data.get("total_spent", 0.0)
            print(f"Your total spending is: {float(total_spent):,.2f}")
        else:
            print("Failed to fetch the total spending report.")
            error_message = response.json().get("detail", "Unknown error")
            print(f"Error: {error_message}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

def get_spending_by_category():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nSpending by Category Report")
    try:
        response = requests.get(f"{BASE_URL}/reports/spending-by-category", headers=headers)

        if response.status_code == 200:
            data = response.json()
            spending_by_category = data.get("spending_by_category", {})

            if not spending_by_category:
                print("No spending data found by category.")
            else:
                print("\nSpending by Category:")
                print("-" * 50)
                for category, amount in spending_by_category.items():
                    print(f"Category: {category}")
                    print(f"Total Spending: {float(amount):,.2f}")
                    print("-" * 50)
        else:
            print("Failed to fetch the spending by category report.")
            error_message = response.json().get("detail", "Unknown error")
            print(f"Error: {error_message}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

def get_spending_by_date_range():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nSpending by Date Range Report")
    start_date = input("Enter start date (YYYY-MM-DD): ")
    end_date = input("Enter end date (YYYY-MM-DD): ")

    try:
        response = requests.get(
            f"{BASE_URL}/reports/spending-by-date-range",
            params={"start_date": start_date, "end_date": end_date},
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            total_spent = data.get("total_spent", 0.0)
            print("\nSpending by Date Range:")
            print(f"From: {start_date} To: {end_date}")
            print(f"Total Spending: {float(total_spent):,.2f}")
        else:
            print("Failed to fetch the spending by date range report.")
            error_message = response.json().get("detail", "Unknown error")
            print(f"Error: {error_message}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

def get_exceeding_account_balance():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nTransactions Exceeding Account Balance Report")
    account_name = input("Enter account name (leave blank for all accounts): ")
    params = {"account_name": account_name} if account_name else {}
    
    try:
        response = requests.get(
            f"{BASE_URL}/reports/exceeding-transactions",
            params=params,
            headers=headers
        )

        if response.status_code == 200:
            records = response.json()
            if not records:
                print("No transactions exceeding account balance were found.")
            else:
                print("\nExceeding Transactions:")
                for record in records:
                    print("-" * 50)
                    print(f"User ID: {record['user_id']}")
                    print(f"User Name: {record['user_name']}")
                    print(f"Account Name: {record['account_name']}")
                    print(f"Transaction ID: {record['transaction_id']}")
                    print(f"Transaction Name: {record['transaction_name']}")
                    print(f"Transaction Amount: {float(record['transaction_amount']):,.2f}")
                    print(f"Transaction Date: {record['transaction_date']}")
                    print(f"Calculated Balance: {float(record['calculated_balance']):,.2f}")
                    print("-" * 50)
        else:
            print("Failed to fetch the exceeding transactions report.")
            print(f"Error: {response.json().get('detail', 'Unknown error')}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

def get_exceeding_current_balance():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nTransactions Exceeding Current Account Balance Report")
    try:
        response = requests.get(f"{BASE_URL}/reports/exceeding-current-balance", headers=headers)

        if response.status_code == 200:
            records = response.json()
            if not records:
                print("No transactions exceeding current account balance were found.")
            else:
                print("\nTransactions Exceeding Current Balance:")
                for record in records:
                    print("-" * 50)
                    print(f"User ID: {record['user_id']}")
                    print(f"User Name: {record['user_name']}")
                    print(f"Account Name: {record['account_name']}")
                    print(f"Current Balance: {record['current_balance']:,.2f}")
                    print(f"Transaction ID: {record['transaction_id']}")
                    print(f"Transaction Name: {record['transaction_name']}")
                    print(f"Transaction Amount: {record['transaction_amount']:,.2f}")
                    print(f"Transaction Date: {record['transaction_date']}")
                    print("-" * 50)
        else:
            print("Failed to fetch the report.")
            error_message = response.json().get("detail", "Unknown error")
            print(f"Error: {error_message}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

def get_exceeding_total_balances():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nChronological List of Transactions Exceeding Total Account Balances")
    try:
        response = requests.get(f"{BASE_URL}/reports/exceeding-total-balances", headers=headers)

        if response.status_code == 200:
            records = response.json()
            if not records:
                print("No transactions exceeding total balances found.")
            else:
                print("\nTransactions Exceeding Total Balances:")
                for record in records:
                    print("-" * 50)
                    print(f"User ID: {record['user_id']}")
                    print(f"User Name: {record['user_name']}")
                    print(f"Transaction ID: {record['transaction_id']}")
                    print(f"Transaction Name: {record['transaction_name']}")
                    print(f"Transaction Amount: {record['transaction_amount']:,.2f}")
                    print(f"Transaction Date: {record['transaction_date']}")
                    print(f"Calculated Total Balance: {record['calculated_total_balance']:,.2f}")
                    print("-" * 50)
        else:
            print("Failed to fetch the report.")
            error_message = response.json().get("detail", "Unknown error")
            print(f"Error: {error_message}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

def get_exceeding_user_total_balance():
    headers = {"Authorization": f"Bearer {access_token}"}

    print("\nTransactions Exceeding User's Total Balance")
    try:
        response = requests.get(f"{BASE_URL}/reports/exceeding-user-total-balance", headers=headers)

        if response.status_code == 200:
            records = response.json()
            if not records:
                print("No users with transactions exceeding their total balance.")
            else:
                print("\nUsers with Transactions Exceeding Total Balance:")
                for record in records:
                    print("-" * 50)
                    print(f"User ID: {record['user_id']}")
                    print(f"User Name: {record['user_name']}")
                    print(f"Total Transaction Amount: {record['total_transaction_amount']:,.2f}")
                    print(f"Total Balance: {record['user_total_balance']:,.2f}")
                    print("-" * 50)
        else:
            print("Failed to fetch the report.")
            error_message = response.json().get("detail", "Unknown error")
            print(f"Error: {error_message}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")


if __name__ == "__main__":
    main_menu()

