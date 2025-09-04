use dioxus::prelude::*;

#[component]
pub fn TransactionAccountsComponent() -> Element {
    rsx! {
        // We can create elements inside the rsx macro with the element name followed by a block of attributes and children.
        div {
            // Attributes should be defined in the element before any children
            id: "transaction_accounts",
            // After all attributes are defined, we can define child elements and components
            div { id: "windows",
                // The RSX macro also supports text nodes surrounded by quotes
                a { href: "", "Hello World" }
            }
        }
    }
}
