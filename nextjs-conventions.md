1. Components → PascalCase

Component file names should usually match the component name.

Button.tsx
UserCard.tsx
NavigationMenu.tsx
ProductGrid.tsx
export function UserCard() {
  return <div />;
}

✅ Most common convention

Avoid:

user-card.tsx
userCard.tsx
user_card.tsx

for React components.

2. Hooks → camelCase with use
useAuth.ts
useUser.ts
useWindowSize.ts
useDebounce.ts
export function useAuth() {
  // ...
}
3. Utility Functions → camelCase
formatDate.ts
calculateTotal.ts
parseUser.ts
export function formatDate() {}
4. Types → camelCase file, PascalCase types

File:

user.ts
product.ts
auth.ts

Inside:

export interface User {}
export interface Product {}
5. Next.js App Router Folders → lowercase
app/
├── dashboard/
├── products/
├── settings/
└── profile/

URLs become:

/dashboard
/products
/settings

Never:

Dashboard/
Products/
6. Route Files → Next.js reserved names

Keep these exactly as Next.js expects:

page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
route.ts
template.tsx
default.tsx

Never rename:

home.tsx
main-layout.tsx

for route files.

7. API Route Folders → kebab-case or lowercase
app/api/users/route.ts
app/api/auth/login/route.ts
app/api/payment-webhook/route.ts
8. Regular Folders

Two popular styles:

Option A (Most Common)
components/
hooks/
lib/
utils/
services/
types/
Option B
components/
hooks/
lib/
server/
shared/

All lowercase.

9. Multi-word Folders

Usually kebab-case:

user-profile/
shopping-cart/
admin-dashboard/

Preferred over:

userProfile/
user_profile/
10. Environment Variables

Upper snake case:

DATABASE_URL=
NEXT_PUBLIC_API_URL=
OPENAI_API_KEY=
11. Constants
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;

Upper snake case for true constants.

12. Variables

camelCase:

const userName = "";
const totalPrice = 0;
const isLoading = false;
13. Functions

camelCase:

function getUser() {}
function createInvoice() {}
function formatDate() {}
14. Types / Interfaces / Classes

PascalCase:

interface User {}
interface ProductCardProps {}

type ApiResponse = {};

class DatabaseClient {}
15. Component Props

PascalCase component + Props:

interface UserCardProps {
  name: string;
}
function UserCard({ name }: UserCardProps) {}
16. CSS Modules

Match component name:

Button.module.css
UserCard.module.css
Navbar.module.css
17. Database Models

PascalCase:

User
Post
Order
Product
18. Booleans

Prefix with:

isLoading
isOpen
hasPermission
canEdit
shouldRefresh

Not:

loading
open
permission
Recommended Next.js Project Structure
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── layout.tsx
│
├── components/
│   ├── Button.tsx
│   ├── UserCard.tsx
│   └── Navbar.tsx
│
├── hooks/
│   ├── useAuth.ts
│   └── useUser.ts
│
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   └── stripe.ts
│
├── types/
│   ├── user.ts
│   └── product.ts
│
└── utils/
    ├── formatDate.ts
    └── calculateTotal.ts