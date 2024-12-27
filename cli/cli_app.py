import requests
from app.auth import is_admin

BASE_URL = "http://localhost:8000"

def main_menu():
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
            user_menu(token)
    elif choice == "3":
        print("Exiting...")
    else:
        print("Invalid choice. Please try again.")

def register():
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
    print("\nLog in")
    email = input("Enter your email: ")
    password = input("Enter your password: ")

    response = requests.get(f"{BASE_URL}/auth/login/", json={
        "email": email,
        "password": password
    })

    if response.status_code == 200:
        data = response.json()
        print("Log in successful.")
        return data["access_token"]
    else:
        print("Invalid login credentials.")
        return None


def admin_menu(user_id):
    while True:
        print("\nAdmin Menu")
        print("1. View All Transaction Accounts")
        print("2. Log Out")
        choice = input("Choose an option: ")

        if choice == "1":
            admin_view_all_accounts()
        elif choice == "2":
            print("Logging out...")
            break
        else:
            print("Invalid choice. Please try again.")

def admin_view_all_accounts():
    print("\nAll Transaction Accounts")
    response = requests.get(f"{BASE_URL}/admin/accounts/")

    if response.status_code == 200:
        accounts = response.json()
        for account in accounts:
            print(f"Account ID: {account['transaction_account_id']}, Name: {account['account_name']}, Balance: {account['balance']}")
    else:
        print("Failed to retrieve accounts.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def user_menu(token):
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
            view_reports()
        elif choice == "12":
            print("Logging out...")
            break
        else:
            print("Invalid choice. Please try again.")

def add_transaction_account():
    print("\nAdd Transaction Account")
    account_name = input("Enter account name: ")
    balance = float(input("Enter balance: "))

    response = requests.post(f"{BASE_URL}/accounts/", json={
        "account_name": account_name,
        "balance": balance
    })

    if response.status_code == 200:
        print("Transaction account added successfully.")
    else:
        print("Failed to add transaction account.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def view_transaction_accounts(user_id):
    print("\nTransaction Accounts")
    response = requests.get(f"{BASE_URL}/accounts/", params={"user_id": user_id})

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
    print("\nAdd Transaction")
    transaction_name = input("Enter transaction name: ")
    amount = float(input("Enter amount: "))
    date = input("Enter date (YYYY-MM-DDTHH:MM:SS): ")

    response = requests.get(f"{BASE_URL}/transactions/", json={
        "transaction_name": transaction_name,
        "amount": amount,
        "net_amount": 0,
        "date": date
    })

    if response.status_code == 200:
        print("Transaction added successfully.")
    else:
        print("Failed to add transaction.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def view_transactions():
    print("\nView Transactions")
    response = requests.get(f"{BASE_URL}/transactions/")

    if response.status_code == 200:
        transactions = response.json()
        for transaction in transactions:
            print(f"Transaction ID: {transaction['transaction_id']}")
            print(f"Transaction Name: {transaction['transaction_name']}")
            print(f"Amount: {transaction['amount']}")
            print(f"Net Amount: {transaction['net_amount']}")
            print(f"Date: {transaction['date']}")
            print()
    else:
        print("Failed to retrieve transactions.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def modify_transaction():
    print("\nModify Transaction")
    transaction_id = int(input("Enter transaction ID to modify: "))
    transaction_name = input("Enter new transaction name (or leave blank): ")
    amount = input("Enter new amount (or leave blank): ")
    net_amount = input("Enter new net amount (or leave blank): ")
    date = input("Enter new date (YYYY-MM-DDTHH:MM:SS) (or leave blank): ")

    data = {}
    if transaction_name:
        data["transaction_name"] = transaction_name
    if amount:
        data["amount"] = float(amount)
    if net_amount:
        data["net_amount"] = float(net_amount)
    if date:
        data["date"] = date

    response = requests.put(f"{BASE_URL}/transactions/{transaction_id}", json=data)

    if response.status_code == 200:
        print("Transaction modified successfully.")
    else:
        print("Failed to modify transaction.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def delete_transaction():
    print("\nDelete Transaction")
    transaction_id = int(input("Enter transaction ID to delete: "))

    response = requests.delete(f"{BASE_URL}/transactions/{transaction_id}")

    if response.status_code == 200:
        print("Transaction deleted successfully.")
    else:
        print("Failed to delete transaction.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def add_tag():
    print("\nAdd Tag")
    tag_name = input("Enter tag name: ")

    response = requests.post(f"{BASE_URL}/tags/", json={"tag_name": tag_name})

    if response.status_code == 200:
        print("Tag added successfully.")
    else:
        print("Failed to add tag.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def view_tags():
    print("\nView Tags")
    response = requests.get(f"{BASE_URL}/tags/")

    if response.status_code == 200:
        tags = response.json()
        for tag in tags:
            print(f"ID: {tag['tag_id']}, Name: {tag['tag_name']}")
    else:
        print("Error retrieving tags.")

def assign_tag_to_transaction():
    print("\nAssign Tag to Transaction")
    transaction_id = int(input("Enter transaction ID: "))
    tag_id = int(input("Enter tag ID: "))

    response = requests.post(f"{BASE_URL}/tags/assign/", json={
        "transaction_id": transaction_id,
        "tag_id": tag_id
    })

    if response.status_code == 200:
        print("Tag assigned successfully.")
    else:
        print("Failed to assign tag.")
        print(f"Error: {response.json().get('detail', 'Unknown error')}")

def view_transaction_tags():
    print("\nView Transaction Tags")
    transaction_id = int(input("Enter transaction ID to view its tags: "))

    response = requests.get(f"{BASE_URL}/transactions/{transaction_id}/tags")

    if response.status_code == 200:
        tags = response.json()
        for tag in tags:
            print(f"ID: {tag['tag_id']}, Name: {tag['tag_name']}")
    else:
        print(f"Error retrieving tags for transaction. {response.json().get('detail', 'Unknown error')}")

def view_reports():
    print("\nView Reports")
    response = requests.get(f"{BASE_URL}/reports/")

    if response.status_code == 200:
        print(response.json())
    else:
        print("Error retrieving reports.")

if __name__ == "__main__":
    main_menu()