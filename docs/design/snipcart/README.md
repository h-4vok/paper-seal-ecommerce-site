# Snipcart side cart theme

The generated concept images show the intended Paper Seal Studio direction:

- [Desktop cart with an artwork](desktop-populated.png)
- [Mobile empty cart](mobile-empty.png)

They are visual explorations, not screenshots of Snipcart. The production theme keeps Snipcart's own cart, quantity controls, checkout and transactional copy. Snipcart's [v3 theming API](https://docs.snipcart.com/v3/setup/theming) supplies the colour and state variables; `src/styles/snipcart.scss` adds scoped typography, spacing and image treatments. The default stylesheet still loads first.

The [desktop with an artwork](actual-desktop-populated.png) and [mobile empty](actual-mobile-empty.png) captures show the implemented vendor UI in Snipcart Test mode; the concept text and illustration are intentionally not part of the checkout.

Palette: warm paper (`#f3ede2`, `#faf7f0`), signature navy (`#0b2541`), garden (`#4b5d46`) and restrained terracotta (`#a6533d`). Headings use the site's display serif; labels and controls use its UI sans. Focus remains visible through the site's terracotta focus token. The Snipcart test-mode banner stays visually distinct.

The payment step uses Snipcart's default UI without a custom test-card notice. The [live Test checkout capture](actual-payment.png) shows the payment form after removing the notice. Manual Test-mode payment details are documented in the project's [Snipcart verification instructions](../../../README.md#verification).
