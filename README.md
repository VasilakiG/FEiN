# FEiN
Mobile application for personal finance tracking

# Development

Your new jumpstart project includes basic organization with an organized `assets` folder and a `components` folder.
If you chose to develop with the router feature, you will also have a `views` folder.

```
project/
├─ assets/ # Any assets that are used by the app should be placed here
├─ src/
│  ├─ main.rs # The entrypoint for the app. It also defines the routes for the app.
│  ├─ components/
│  │  ├─ mod.rs # Defines the components module
│  │  ├─ ... Implementations of components
│  ├─ views/ # The views each route will render in the app.
│  │  ├─ mod.rs # Defines the module for the views route and re-exports the components for each route
│  │  ├─ ... Components that will render at respective routes
├─ Cargo.toml # The Cargo.toml file defines the dependencies and feature flags for your project
```



### Serving Your App

Run the following command in the root of your project to start developing with the default platform:

```bash
dx serve --platform android
```


