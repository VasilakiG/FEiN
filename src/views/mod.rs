//! The views module contains the components for all Layouts and Routes for our app. Each layout and route in our [`Route`] enum will render one of these components.
//!
//!
//! The [`TransactionAccounts`]  component will be rendered when the current route is [`Route::TransactionAccounts`].
//!
//!
//! The [`Navbar`] component will be rendered on all pages of our app since every page is under the layout. The layout defines a common wrapper around all child routes.

mod transaction_accounts;
pub use transaction_accounts::TransactionAccounts;

mod navbar;
pub use navbar::Navbar;
