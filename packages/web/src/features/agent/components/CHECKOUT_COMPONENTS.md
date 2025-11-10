# Agent Checkout Components

Interactive checkout components for the AI agent with hold-to-confirm functionality.

## Components

### AgentCheckoutButton

Main checkout button with long-press confirmation and success modal.

**Features:**

- Hold-to-confirm (2 seconds)
- Visual progress indicator
- Processing state
- Success modal with order details
- Link to purchase request page

**Usage:**

```tsx
import { AgentCheckoutButton } from '@/features/agent';

function MyComponent() {
  const handleCheckout = async () => {
    // Call your checkout API
    const response = await fetch('/api/agent/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'My purchase request' }),
    });

    return await response.json();
  };

  return <AgentCheckoutButton onCheckout={handleCheckout} disabled={false} />;
}
```

### AgentCheckoutPrompt

Complete checkout UI with message, cart summary, and checkout button.

**Features:**

- Agent message display
- Cart summary (items count + total)
- Integrated checkout button
- User instructions

**Usage:**

```tsx
import { AgentCheckoutPrompt } from '@/features/agent';

function MyComponent({ cart }) {
  const handleCheckout = async () => {
    const response = await fetch('/api/agent/checkout', {
      method: 'POST',
    });

    return await response.json();
  };

  return (
    <AgentCheckoutPrompt
      message='Your cart is ready! Would you like to submit a purchase request?'
      cartItemCount={cart.items.length}
      cartTotal={cart.totalCost}
      onCheckout={handleCheckout}
    />
  );
}
```

## Integration with Agent Messages

To integrate with the agent chat, you can conditionally render the checkout prompt when the agent suggests checkout:

```tsx
import { AgentCheckoutPrompt } from '@/features/agent';

function AgentMessage({ message, cart }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Check if message is suggesting checkout
  const isCheckoutMessage = message.content.toLowerCase().includes('checkout');

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/agent/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: message.conversationId,
        }),
      });

      return await response.json();
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div>
      {/* Regular message */}
      <p>{message.content}</p>

      {/* Show checkout prompt if applicable */}
      {isCheckoutMessage && cart && cart.items.length > 0 && (
        <AgentCheckoutPrompt
          message='Ready to submit your purchase request?'
          cartItemCount={cart.items.length}
          cartTotal={cart.totalCost}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}
```

## Customization

### Button States

The button automatically handles these states:

- **Default**: "Press to Checkout"
- **Pressed**: "Hold to Confirm..." with progress bar
- **Processing**: Spinner with "Processing..."
- **Disabled**: Grayed out, non-interactive

### Modal Content

The success modal shows:

- ✅ Success icon and title
- Request ID (monospace font)
- Status badge
- Complete items list with categories
- Item quantities and prices
- Total cost
- "View Request Details" button (links to `/purchase/{id}`)

### Styling

All components use Tailwind CSS and shadcn/ui primitives, matching the app's design system:

- Dark mode support
- Responsive layout
- Accessible (keyboard + screen reader friendly)
- Smooth animations

## API Response Format

The `onCheckout` callback should return this format:

```typescript
{
  id: string; // Purchase request ID
  items: Array<{
    itemName: string;
    itemCategory: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalCost: number;
  status: string; // e.g., "submitted", "pending"
}
```

## Accessibility

- **Keyboard**: Can be triggered with Space/Enter keys
- **Touch**: Works on mobile with touch events
- **Screen readers**: Proper ARIA labels and descriptions
- **Focus**: Clear focus indicators
- **Motion**: Respects `prefers-reduced-motion`
