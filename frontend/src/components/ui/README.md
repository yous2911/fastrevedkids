# Design System - UI Components

## Overview

This directory contains the unified design system components for FastRevEd Kids. All components follow consistent design patterns and are built with TypeScript, Tailwind CSS, and Framer Motion for smooth animations.

## Design Tokens

Our design system uses centralized tokens for consistent styling:

```tsx
import { colors, spacing, typography, shadows, animations } from '../../design-system/tokens';
```

### Available Tokens
- **Colors**: Primary, magical, semantic, and neutral color palettes
- **Spacing**: Consistent spacing scale (xs to 4xl)
- **Typography**: Font families, sizes, weights, and line heights
- **Shadows**: Elevation and magical glow effects
- **Animations**: Predefined animation presets

## Components

### Button Component

The `Button` component is the foundation of our design system, providing consistent styling and behavior across the application.

#### Usage

```tsx
import { Button } from '../ui/Button';

// Basic usage
<Button onClick={handleClick}>Click me</Button>

// With variants
<Button variant="primary" size="lg" onClick={handleClick}>
  Primary Button
</Button>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'ghost' \| 'magical' \| 'outline'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `disabled` | `boolean` | `false` | Disables the button |
| `icon` | `ReactNode` | - | Icon to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `fullWidth` | `boolean` | `false` | Full width button |
| `animated` | `boolean` | `true` | Enable animations |
| `soundEnabled` | `boolean` | `true` | Enable sound effects |
| `hapticEnabled` | `boolean` | `true` | Enable haptic feedback |
| `sparkyReaction` | `boolean` | `false` | Trigger Sparky reaction |
| `children` | `ReactNode` | - | Button content |
| `className` | `string` | - | Additional CSS classes |

#### Variants

- **`primary`**: Blue gradient, primary actions
- **`secondary`**: Gray gradient, secondary actions
- **`success`**: Green gradient, positive actions
- **`warning`**: Yellow gradient, caution actions
- **`danger`**: Red gradient, destructive actions
- **`ghost`**: Transparent with border, subtle actions
- **`magical`**: Purple gradient with particles, special actions
- **`outline`**: Outlined style, neutral actions

#### Sizes

- **`sm`**: Small buttons (px-3 py-1.5 text-sm)
- **`md`**: Medium buttons (px-4 py-2 text-base)
- **`lg`**: Large buttons (px-6 py-3 text-lg)
- **`xl`**: Extra large buttons (px-8 py-4 text-xl)

### Card Component

The `Card` component provides consistent container styling with multiple variants and animations.

#### Usage

```tsx
import { Card } from '../ui/Card';

<Card variant="magical" padding="lg" animated>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'elevated' \| 'outlined' \| 'magical'` | `'default'` | Visual style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Internal padding |
| `rounded` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'lg'` | Border radius |
| `animated` | `boolean` | `false` | Enable animations |
| `hoverable` | `boolean` | `false` | Enable hover effects |
| `onClick` | `() => void` | - | Click handler |

### Input Component

The `Input` component provides consistent form input styling with validation and animations.

#### Usage

```tsx
import { Input } from '../ui/Input';

<Input
  label="Email"
  placeholder="Enter your email"
  variant="magical"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'magical' \| 'outlined' \| 'filled'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Input size |
| `label` | `string` | - | Input label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `leftIcon` | `ReactNode` | - | Left icon |
| `rightIcon` | `ReactNode` | - | Right icon |
| `loading` | `boolean` | `false` | Show loading state |
| `success` | `boolean` | `false` | Show success state |

### Badge Component

The `Badge` component displays status indicators, labels, and tags with consistent styling.

#### Usage

```tsx
import { Badge } from '../ui/Badge';

<Badge variant="success" icon="✅">
  Completed
</Badge>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'magical' \| 'outline'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `animated` | `boolean` | `true` | Enable animations |
| `removable` | `boolean` | `false` | Show remove button |
| `onRemove` | `() => void` | - | Remove handler |
| `icon` | `ReactNode` | - | Badge icon |

### Select Component

The `Select` component provides a customizable dropdown with animations and keyboard navigation.

#### Usage

```tsx
import { Select } from '../ui/Select';

<Select
  options={[
    { value: 'option1', label: 'Option 1', icon: '🌟' },
    { value: 'option2', label: 'Option 2', icon: '✨' }
  ]}
  value={selectedValue}
  onChange={setSelectedValue}
  variant="magical"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | - | Available options |
| `value` | `string` | - | Selected value |
| `onChange` | `(value: string) => void` | - | Change handler |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `variant` | `'default' \| 'magical' \| 'outlined'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size |
| `disabled` | `boolean` | `false` | Disable select |
| `error` | `string` | - | Error message |
| `label` | `string` | - | Select label |
| `helperText` | `string` | - | Helper text |

### Tooltip Component

The `Tooltip` component displays contextual information on hover or focus.

#### Usage

```tsx
import { Tooltip } from '../ui/Tooltip';

<Tooltip content="This is a helpful tooltip" position="top" variant="magical">
  <Button>Hover me</Button>
</Tooltip>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `ReactNode` | - | Tooltip content |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |
| `variant` | `'default' \| 'magical' \| 'dark'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tooltip size |
| `delay` | `number` | `200` | Show delay in ms |

### Modal Component

The `Modal` component provides consistent modal dialogs with backdrop and animations.

#### Usage

```tsx
import { Modal } from '../ui/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Modal Title"
  variant="magical"
>
  <p>Modal content goes here</p>
</Modal>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Modal visibility |
| `onClose` | `() => void` | - | Close handler |
| `title` | `string` | - | Modal title |
| `variant` | `'default' \| 'magical'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal size |

### LoadingSpinner Component

The `LoadingSpinner` component provides consistent loading indicators.

#### Usage

```tsx
import { LoadingSpinner } from '../ui/LoadingSpinner';

<LoadingSpinner size="lg" variant="magical" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Spinner size |
| `variant` | `'default' \| 'white' \| 'magical'` | `'default'` | Visual style variant |

## Migration Guide

### Before (Old Pattern)
```tsx
<button
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  onClick={handleClick}
>
  Click me
</button>
```

### After (Design System)
```tsx
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

## Best Practices

1. **Use semantic variants**: Choose the variant that matches the action's intent
2. **Consistent sizing**: Use `md` for most components, `lg` for primary actions, `sm` for secondary actions
3. **Loading states**: Always show loading state for async operations
4. **Accessibility**: Ensure components have proper ARIA labels and keyboard navigation
5. **Responsive design**: Components automatically adapt to different screen sizes
6. **Animation consistency**: Use the provided animation presets for consistent motion
7. **Design tokens**: Use centralized tokens for colors, spacing, and typography

## Accessibility

All components include:
- Proper ARIA attributes
- Keyboard navigation support
- Focus states are clearly visible
- Screen reader announcements for state changes
- High contrast support

## Styling

Components use:
- Tailwind CSS for styling
- Framer Motion for animations
- Design tokens for consistency
- CSS custom properties for theming
- Responsive design patterns

## Future Components

Planned components for the design system:
- Tabs
- Accordion
- DatePicker
- TimePicker
- FileUpload
- Rating
- Slider
- Switch
- Checkbox
- Radio
- Textarea
- Pagination
- Breadcrumb
- Menu
- Dropdown
- Popover
- Alert
- Notification
- Progress
- Skeleton
