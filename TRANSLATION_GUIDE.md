# Ramz Translation System Guide

## Overview

The Ramz application has a comprehensive translation system that supports English, Arabic, and French. The system uses `react-i18next` for internationalization and provides full translation coverage across all pages and components.

## Translation Files

Translation files are located in `src/locales/` directory:
- `en/common.json` - English translations
- `ar/common.json` - Arabic translations  
- `fr/common.json` - French translations

Each file follows the same structure with nested keys for different sections of the application.

## How Translation Works

### 1. Language Detection and Setting

The `I18nProvider` component handles language detection:
- **Admin pages**: Uses the admin's preferred language from their profile
- **Quiz pages**: Uses the quiz creator's language preference
- **Home page**: Defaults to English

### 2. Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### 3. Language Change Propagation

When an admin changes their language preference in the profile settings:

1. The change is saved to the database via the API
2. The `i18n.changeLanguage()` method is called
3. All components using the `useTranslation` hook automatically re-render
4. The `I18nProvider` forces a complete re-render of the application
5. Document direction (LTR/RTL) is updated for Arabic language

## Ensuring All Components Update on Language Change

### For Components Using useTranslation Hook

Components that use the `useTranslation` hook will automatically re-render when the language changes. No additional action is needed.

### For Components Without useTranslation Hook

For components that don't use the translation hook directly but contain translated content, use the `useLanguageChange` hook:

```tsx
import { useLanguageChange } from '@/hooks/useLanguageChange';

function MyComponent() {
  const language = useLanguageChange(); // This forces re-render on language change
  
  return (
    <div key={language}> {/* Key change forces re-render */}
      {/* Translated content from props or context */}
    </div>
  );
}
```

### Using Higher-Order Component

Alternatively, use the `withLanguageChange` HOC:

```tsx
import { withLanguageChange } from '@/hooks/useLanguageChange';

function MyComponent({ text }) {
  return <div>{text}</div>;
}

export default withLanguageChange(MyComponent);
```

## Adding New Translations

### 1. Add Translation Keys

Add the new key to all three translation files:

**English (`en/common.json`):**
```json
{
  "newSection": {
    "newKey": "English translation"
  }
}
```

**Arabic (`ar/common.json`):**
```json
{
  "newSection": {
    "newKey": "الترجمة العربية"
  }
}
```

**French (`fr/common.json`):**
```json
{
  "newSection": {
    "newKey": "Traduction française"
  }
}
```

### 2. Use in Components

```tsx
const { t } = useTranslation();
t('newSection.newKey');
```

## RTL Support for Arabic

The application automatically handles Right-to-Left (RTL) layout for Arabic:
- Document direction is set to `rtl` when language is Arabic
- CSS classes like `rtl:text-right` are used for RTL-specific styling
- Components automatically adjust their layout

## Testing Translations

### 1. Test Language Switching

Use the language switcher in the admin interface to test all translations.

### 2. Verify RTL Layout

Test Arabic language to ensure RTL layout works correctly.

### 3. Check All Pages

Navigate through all pages to ensure translations are consistent.

## Common Issues and Solutions

### 1. Translations Not Updating

**Problem**: Components don't re-render when language changes.
**Solution**: Use the `useLanguageChange` hook or ensure components use `useTranslation`.

### 2. Missing Translations

**Problem**: Some text isn't translated.
**Solution**: Add the missing key to all translation files.

### 3. Layout Issues in RTL

**Problem**: Layout breaks in Arabic (RTL) mode.
**Solution**: Use RTL-specific CSS classes and test thoroughly.

## Best Practices

1. **Always use translation keys**: Never hardcode text in components
2. **Keep translations consistent**: Maintain the same structure across all language files
3. **Test all languages**: Verify translations work in all supported languages
4. **Use RTL-aware styling**: Design components to work in both LTR and RTL layouts
5. **Update documentation**: Keep this guide updated with any changes to the translation system

## API Integration

The translation system integrates with the backend API:
- Admin language preferences are stored in the database
- Quiz language is determined by the creator's preference
- All API responses should use the appropriate language context

## Performance Considerations

- Translations are loaded once during application initialization
- Language changes trigger re-renders but are optimized
- RTL layout changes are handled efficiently
