# Makemore Components

This directory contains the refactored components for the Makemore project.

## Structure

- **NamesGenerator.tsx** - Generate creative names using the names model
- **DrugNameGenerator.tsx** - Generate pharmaceutical-style drug names
- **DrugGuessGame.tsx** - Interactive game to guess real vs AI-generated drug names

## API Integration

All components use the centralized API service in `/services/api.ts` which calls:

```typescript
POST /api/generate
{
  model: "names" | "drugs",
  count: number,
  temperature: number
}
```

## Features

### Names Generator

- Adjustable count (1-20)
- Temperature control (0.1-2.0)
- Mobile-responsive grid layout

### Drug Name Generator

- Same controls as Names Generator
- Trained on real pharmaceutical drug names
- Distinct visual styling

### Drug Guess Game

- Random mix of real and AI-generated drug names
- Score tracking with accuracy percentage
- Immediate feedback on guesses
- Auto-advances to next round

## Mobile Optimization

All components are fully responsive with:

- Flexible grid layouts
- Touch-friendly controls
- Optimized text sizes using `clamp()`
- Adaptive button sizes
- Single-column layout on small screens
