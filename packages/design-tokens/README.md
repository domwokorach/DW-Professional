# DOMINIC Portfolio Design Tokens

The reusable CSS colour and theme tokens used by DOMINIC Portfolio. The package includes the canonical light theme and the `[data-theme="dark"]` overrides generated from the application's source stylesheet.

## Install

GitHub Packages requires npm to use the GitHub registry for the `@domwokorach` scope. Authenticate with a token that has `read:packages`; never commit the token.

```ini
@domwokorach:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```bash
npm install @domwokorach/dw-professional-design-tokens@1.0.1
```

Import the stylesheet once near the application root:

```css
@import "@domwokorach/dw-professional-design-tokens";
```

Set `data-theme="dark"` on the root HTML element to activate the dark token values.

## Licence

This package contains original proprietary project tokens. See [LICENSE.md](LICENSE.md). Dependencies and consuming applications remain governed by their own licences.
