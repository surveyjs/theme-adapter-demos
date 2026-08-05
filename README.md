# SurveyJS Theme Adapter Demos (Bootstrap, MUI, shadcn/ui)

This repository contains demo applications that showcase **SurveyJS Theme Adapters**&mdash;a set of lightweight style mappings that allow SurveyJS components to inherit the visual language of popular UI frameworks and design systems without requiring custom CSS.

Each demo shows how to integrate a specific theme adapter into a SurveyJS application and how SurveyJS controls automatically adopt the appearance of the surrounding UI framework.

## Available Theme Adapters

This repository includes theme adapter demos for the following CSS frameworks:

- Bootstrap
- Material UI (MUI)
- shadcn/ui

Additional adapters may be added over time.

## What Are Theme Adapters?

SurveyJS v3.0 introduces a unified Design Tokens system based on CSS variables. Theme adapters map these design tokens to external framework-specific variables. Instead of overriding individual component styles, you install a single adapter that makes SurveyJS components automatically follow your application's existing design language.

Benefits include:

- Consistent appearance across your application
- Minimal CSS maintenance
- Easy switching between CSS frameworks
- Automatic support for future SurveyJS UI components

## Repository Structure

Each adapter has its own demo application that can be built and run independently:

- [`bootstrap`](./apps/bootstrap/)
- [`mui`](./apps/mui/)
- [`shadcn`](./apps/shadcn/)

## Getting Started

Clone the repository:

```bash
git clone https://github.com/surveyjs/theme-adapter-demos.git
cd theme-adapter-demos
```

Install dependencies from the **repository root** (npm workspaces):

```bash
npm install
```

Start all demos:

```bash
npm run dev
```

- Bootstrap — http://localhost:3000
- shadcn/ui — http://localhost:3001
- MUI — http://localhost:3002

Or start a single demo:

```bash
npm run dev --workspace @adapter/bootstrap
npm run dev --workspace @adapter/shadcn
npm run dev --workspace @adapter/mui
```

### Regenerating shadcn/ui components

Committed UI sources under `apps/shadcn` are enough for day-to-day work. To reinstall components from the shadcn registry (manual, not part of `npm install`):

```bash
npm run install:ui
```

## License

[MIT](./LICENSE)

## Related Resources

- [SurveyJS Website](https://surveyjs.io/)
- [SurveyJS Documentation](https://surveyjs.io/documentation)
- [What's New in SurveyJS](https://surveyjs.io/WhatsNew)
