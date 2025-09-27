# GitHub Copilot Instructions for AVMSatoshiDice

## Project Overview

AVMSatoshiDice is a decentralized gambling/gaming platform built on the Algorand blockchain using AlgoKit. The project enables game creators to create dice games with configurable win ratios and supports multiple token types including native ALGO, ASA tokens, and ARC200 tokens.

## Project Structure

This is an **AlgoKit workspace** with multiple projects:

```
/
├── projects/
│   ├── AVMSatoshiDice/          # Smart contracts (Algorand TypeScript)
│   ├── web-vue/                 # Vue.js frontend application
│   └── web-react/               # React frontend application (alternative)
├── .algokit.toml               # AlgoKit workspace configuration
└── .github/                    # CI/CD workflows and configurations
```

## Technology Stack

### Smart Contracts
- **Language**: Algorand TypeScript (`@algorandfoundation/algorand-typescript`)
- **Framework**: AlgoKit with Puya compiler
- **Testing**: Vitest with AlgoKit testing utilities
- **Deployment**: AlgoKit deployment scripts with multisig support

### Frontend (Vue.js - Primary)
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia
- **Styling**: Tailwind CSS with custom themes
- **UI Components**: PrimeVue, HeadlessUI
- **Animations**: @vueuse/motion, @fireworks-js/vue, canvas-confetti
- **Wallet Integration**: @txnlab/use-wallet-vue, @perawallet/connect
- **Blockchain**: algosdk, avm-satoshi-dice package

### Development Tools
- **Build**: Vite
- **Type Checking**: TypeScript with Vue TSC
- **Linting**: ESLint
- **Formatting**: Prettier
- **Package Manager**: npm

## Core Business Logic

### Game Mechanics
1. **Game Creation**: Users can create games with specified win ratios and token types
2. **Game Play**: Players set win probability (1-1000000 scale, where 1000000 = 100%)
3. **Payout Calculation**: `winnings = deposit / (win_probability / 1000000)`
4. **Token Support**: Native ALGO, ASA tokens, ARC200 tokens

### Smart Contract Architecture
- **Main Contract**: `AvmSatoshiDice` in `avm_satoshi_dice/contract.algo.ts`
- **Key Structures**:
  - `GameStruct`: Game configuration and state
  - `PlayStruct`: Individual play records
  - `AddressAssetStruct`: Game identification
- **Box Storage**: Games stored in box maps for efficient access

## Coding Conventions

### Smart Contract Patterns
```typescript
// Use arc4 types for ABI compatibility
class GameStruct extends arc4.Struct<{
  balance: UintN256
  assetId: UintN64
  // ... more fields
}> {}

// Contract methods use methodSelector decorator
@methodSelector('create_game')
createGame(/* parameters */) {
  // Implementation
}
```

### Vue.js Patterns
```vue
<!-- Component structure -->
<template>
  <!-- Use Tailwind classes for styling -->
  <div class="bg-background-dark text-white">
    <!-- Content -->
  </div>
</template>

<script setup lang="ts">
// Use Composition API
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

// Store usage
const gameStore = useGameStore()
</script>
```

### State Management (Pinia)
```typescript
export const useGameStore = defineStore('game', () => {
  // Reactive state
  const games = ref<IGameStruct[]>([])
  
  // Computed values
  const filteredGames = computed(() => { /* logic */ })
  
  // Actions
  const loadGames = async () => { /* implementation */ }
  
  return { games, filteredGames, loadGames }
})
```

## Styling Guidelines

### Tailwind Configuration
- **Theme**: Dark theme with neon accents
- **Colors**: 
  - Primary: Indigo palette (#6366f1)
  - Secondary: Teal palette (#2dd4bf)
  - Background: Dark grays (#121212, #1c1c1c)
- **Effects**: Neon box shadows for interactive elements
- **Typography**: Inter font family

### Component Styling
- Use consistent spacing with Tailwind utilities
- Apply neon glow effects to buttons and interactive elements
- Maintain responsive design principles
- Use custom gradient backgrounds for visual appeal

## Development Workflows

### Smart Contract Development
1. Write contracts in `smart_contracts/` directory
2. Use `npm run build` to compile with AlgoKit
3. Run tests with `npm run test`
4. Deploy with `npm run deploy` or deployment scripts

### Frontend Development
1. Components in `src/components/` with logical organization
2. Views in `src/views/` for route components
3. Stores in `src/stores/` for state management
4. Use `npm run dev` for development server
5. Build with `npm run build`

### Testing Patterns
```typescript
// Smart contract testing
describe('Contract Name', () => {
  beforeEach(localnet.newScope)
  
  test('specific functionality', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)
    // Test implementation
  })
})
```

## Integration Patterns

### Wallet Integration
```typescript
// Use wallet store for connections
const { activeAccount, signTransactions } = useWallet()

// Transaction signing
const signedTxns = await signTransactions([transaction])
```

### Blockchain Interaction
```typescript
// Use generated client
const client = new AvmSatoshiDiceClient({
  algorand: algorandClient,
  appId: BigInt(appId),
  defaultSender: account
})

const result = await client.send.methodName({ args: { /* parameters */ } })
```

## Common Patterns to Follow

1. **Type Safety**: Always use TypeScript interfaces and proper typing
2. **Error Handling**: Implement comprehensive error handling with user-friendly messages
3. **Loading States**: Use reactive loading states for async operations
4. **Responsive Design**: Ensure mobile-friendly interfaces
5. **Accessibility**: Include proper ARIA labels and semantic HTML
6. **Performance**: Optimize for large lists and frequent updates

## File Naming Conventions

- **Vue Components**: PascalCase (e.g., `GameDetailView.vue`)
- **TypeScript Files**: camelCase (e.g., `gameStore.ts`)
- **Smart Contracts**: snake_case (e.g., `contract.algo.ts`)
- **Utility Functions**: camelCase with descriptive names

## Dependencies to Consider

When suggesting new dependencies, prefer:
- Well-maintained packages with good TypeScript support
- Packages that work well with Vue 3 Composition API
- Algorand ecosystem packages when dealing with blockchain functionality
- Lightweight alternatives when possible to keep bundle size optimal

## Testing Priorities

1. Smart contract business logic and edge cases
2. Critical user flows (game creation, gameplay, withdrawals)
3. Wallet connection and transaction signing
4. Token handling for different types (native, ASA, ARC200)
5. State management and data consistency