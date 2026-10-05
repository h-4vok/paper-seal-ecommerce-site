# Snipcart side cart theme

The generated concept images show the intended Paper Seal Studio direction:

- [Desktop cart with an artwork](desktop-populated.png)
- [Mobile empty cart](mobile-empty.png)

They are visual explorations, not screenshots of Snipcart. The production theme keeps Snipcart's own cart, quantity controls, checkout and transactional copy. Snipcart's [v3 theming API](https://docs.snipcart.com/v3/setup/theming) supplies the colour and state variables; `src/styles/snipcart.scss` adds scoped typography, spacing and image treatments. The default stylesheet still loads first.

The focused live smoke test captured [desktop with an artwork](actual-desktop-populated.png) and [mobile empty](actual-mobile-empty.png) in Snipcart Test mode. These show the implemented vendor UI; the concept text and illustration are intentionally not part of the checkout.

Palette: warm paper (`#f3ede2`, `#faf7f0`), signature navy (`#0b2541`), garden (`#4b5d46`) and restrained terracotta (`#a6533d`). Headings use the site's display serif; labels and controls use its UI sans. Focus remains visible through the site's terracotta focus token. The Snipcart test-mode banner stays visually distinct.

Storybook's `Foundations/Snipcart theme` is a static specimen using the same theme CSS, including empty and populated desktop/mobile states. Snipcart's live UI is verified separately by `tests/snipcart/smoke.spec.ts` because Storybook cannot import the vendor application through the Astro integration.

The Test environment adds a payment-step notice through Snipcart's supported `payment` top section in `public/snipcart-templates-test.html`. It is enabled only when the public Test API key is configured. Snipcart's [payment testing guide](https://docs.snipcart.com/v3/testing/payments) defines the success card and expiry/CVC rules. The [live Test checkout capture](actual-test-payment.png) shows the notice beside the card field. The notice is also shown in the `TestPaymentHint` Storybook state.
