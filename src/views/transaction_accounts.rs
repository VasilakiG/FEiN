use crate::components::TransactionAccountsComponent;
use dioxus::prelude::*;

/// The TransactionAccounts page component that will be rendered when the current route is `[Route::Home]`
#[component]
pub fn TransactionAccounts() -> Element {
    rsx! {
        TransactionAccountsComponent {}
    }
}
