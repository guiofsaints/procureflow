# Sonner Toast Examples

## Importing

```typescript
import { toast } from 'sonner';
```

## Basic Usage

### Success Toast

```typescript
toast.success('Operation successful!');
```

### Error Toast

```typescript
toast.error('Something went wrong!');
```

### Info Toast

```typescript
toast.info('Information message');
```

### Warning Toast

```typescript
toast.warning('Warning message');
```

## With Description

```typescript
toast.success('Added to cart!', {
  description: 'Laptop Dell XPS 15 has been added to your cart.',
});
```

## With Action Button

```typescript
toast.success('Item removed', {
  description: 'The item has been removed from your cart.',
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
});
```

## Promise-based Toast

```typescript
toast.promise(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    loading: 'Loading...',
    success: 'Data loaded!',
    error: 'Failed to load data',
  }
);
```

## Custom Duration

```typescript
toast.success('Quick message', {
  duration: 2000, // 2 seconds
});
```

## Custom Position

The Toaster component can be configured in `app/layout.tsx`:

```typescript
<Toaster position="top-right" />
```

Available positions:

- `top-left`
- `top-center`
- `top-right`
- `bottom-left`
- `bottom-center`
- `bottom-right`

## Dismissing Toasts

```typescript
// Dismiss all toasts
toast.dismiss();

// Dismiss specific toast (save the id when creating)
const toastId = toast.success('Message');
toast.dismiss(toastId);
```

## Current Implementation Examples

### Login Success

```typescript
toast.success('Login successful!', {
  description: 'Redirecting to catalog...',
});
```

### Login Error

```typescript
toast.error('Invalid credentials', {
  description: 'Please check your email and password and try again.',
});
```

### Add to Cart

```typescript
toast.success('Added to cart!', {
  description: `${item.name} has been added to your cart.`,
});
```

### Remove from Cart

```typescript
toast.info('Item removed', {
  description: `${item.name} has been removed from your cart.`,
});
```

### Checkout Success

```typescript
toast.success('Checkout successful!', {
  description: `Your order of ${count} items has been submitted.`,
});
```

## Best Practices

1. **Keep messages concise**: Use short, clear messages in the title
2. **Add context with description**: Use the description for additional details
3. **Choose appropriate toast types**:
   - Success: Completed actions
   - Error: Failed operations
   - Info: Neutral information
   - Warning: Cautionary messages
4. **Don't overuse**: Only show toasts for important user actions
5. **Consider duration**: Adjust duration based on message importance
6. **Auto-dismiss errors carefully**: Error toasts might need longer duration

## Documentation

Full Sonner documentation: https://sonner.emilkowal.ski/
