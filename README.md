
# +++++++Preferred Folder structure+++++++++++++++++++++++++
```ts
src
├── app/                      # Global application layer (Redux, Providers, Config)
│   ├── store.ts
│   ├── rootReducer.ts
│   ├── hooks.ts              # useAppSelector / useAppDispatch
│   ├── AppProvider.tsx       # ThemeProvider, ReduxProvider, RouterProvider
│   └── config/               # Global app configs
│       ├── constants.ts
│       └── env.ts
│
├── features/                 # Feature (Domain) based architecture
│   ├── auth/
│   │   ├── api/              # RTK Query API layer
│   │   │   └── auth.api.ts
│   │   ├── slices/           # Redux slices for feature
│   │   │   └── auth.slice.ts
│   │   ├── components/       # UI components of this feature
│   │   │   └── LoginForm.tsx
│   │   ├── pages/            # Screen/page components
│   │   │   └── LoginPage.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── dashboard/
│   │   ├── api/
│   │   ├── slices/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── types/
│   │
│   └── ... other modules
│
├── components/               # Reusable components (non-feature-specific)
│   ├── ui/                   # Atomic UI (Buttons, Inputs)
│   │   ├── AppButton.tsx
│   │   ├── AppTextField.tsx
│   │   └── AppSelect.tsx
│   ├── layout/               # Layout: Sidebar, Header, AppShell
│   │   ├── MainLayout.tsx
│   │   └── Sidebar.tsx
│   └── common/               # Widgets (Dialogs, Tables, Loaders)
│       ├── Loader.tsx
│       ├── DataTable.tsx
│       └── ConfirmDialog.tsx
│
├── routes/
│   ├── AppRoutes.tsx
│   ├── ProtectedRoute.tsx
│   └── RouteConfig.ts        # Dynamic route config
│
├── services/                 # External services or wrappers
│   ├── axiosClient.ts        # Axios instance (if not using RTKQ everywhere)
│   ├── storage.service.ts    # LocalStorage/Session helpers
│   └── errorHandler.ts
│
├── hooks/                    # Global reusable hooks
│   ├── useDebounce.ts
│   ├── usePagination.ts
│   └── useToggle.ts
│
├── styles/                   # MUI theme system
│   ├── theme.ts              # Main MUI theme config
│   ├── palette.ts
│   ├── typography.ts
│   ├── components.ts         # reuse style overrides
│   └── global.css
│
├── utils/                    # Helper utilities (pure functions)
│   ├── dateUtils.ts
│   ├── numberUtils.ts
│   ├── stringUtils.ts
│   └── validators.ts
│
├── assets/                   # Static assets
│   ├── images/
│   ├── icons/
│   └── svg/
│
├── types/                    # Global TS types
│   ├── api.types.ts
│   ├── common.types.ts
│   └── global.d.ts
│
├── index.tsx
└── App.tsx
```
