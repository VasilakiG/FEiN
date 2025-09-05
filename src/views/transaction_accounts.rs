use crate::components::TransactionAccountsComponent;
use dioxus::prelude::*;

#[component]
pub fn TransactionAccounts() -> Element {
    rsx! {
        TransactionAccountsComponent {}
    }
}
