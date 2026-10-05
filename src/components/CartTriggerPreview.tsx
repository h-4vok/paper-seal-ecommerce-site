export function CartTriggerPreview({
  quantity = 0,
  inline = false,
}: {
  quantity?: number;
  inline?: boolean;
}) {
  return (
    <span className={inline ? undefined : 'cart-trigger-preview'}>
      <button className="icon-button snipcart-checkout" type="button" aria-label="Open cart">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M8.5 10.5h15l1.5 17H7l1.5-17Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M12 12V8a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </svg>
        <span className="site-header__cart-count snipcart-items-count" aria-hidden="true">
          {quantity}
        </span>
      </button>
    </span>
  );
}
